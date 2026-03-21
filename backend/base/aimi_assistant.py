"""
AIMI - AI Schedule Assistant
Handles schedule optimization and advice using Google Gemini API
"""

import os
import json
import google.generativeai as genai
from django.conf import settings
from . import models

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class AIScheduleAssistant:
    """AIMI Schedule Assistant using Gemini API"""
    
    MODEL = "gemini-1.5-flash"
    
    @staticmethod
    def get_schedule_context():
        """Build schedule context for AI analysis"""
        entries = models.ScheduleEntry.objects.all().count()
        professors = models.Professor.objects.all().count()
        blocks = models.Block.objects.all().count()
        rooms = models.Room.objects.all().count()
        courses = models.Course.objects.all().count()
        timeslots = models.TimeSlot.objects.all().count()
        
        return {
            'total_schedule_entries': entries,
            'professors': professors,
            'blocks': blocks,
            'rooms': rooms,
            'courses': courses,
            'timeslots': timeslots
        }
    
    @staticmethod
    def get_schedule_data_for_analysis():
        """Get full schedule data as JSON for AI analysis"""
        entries = models.ScheduleEntry.objects.all()
        data = []
        
        for entry in entries:
            data.append({
                'id': entry.id,
                'day': entry.time_slot.get_day_display() if entry.time_slot else None,
                'time': f"{entry.time_slot.start_time}-{entry.time_slot.end_time}" if entry.time_slot else None,
                'course': entry.course.code if entry.course else None,
                'block': entry.block.code if entry.block else None,
                'professor': entry.professor.name if entry.professor else None,
                'room': entry.room.name if entry.room else None,
            })
        
        return data
    
    @staticmethod
    def analyze_schedule_for_optimization(issue_description: str = None):
        """
        Analyze current schedule and suggest optimizations
        Returns AI-suggested improvements
        """
        if not GEMINI_API_KEY:
            return {
                'success': False,
                'error': 'Gemini API key not configured. Set GEMINI_API_KEY environment variable.'
            }
        
        try:
            schedule_data = AIScheduleAssistant.get_schedule_data_for_analysis()
            context = AIScheduleAssistant.get_schedule_context()
            
            prompt = f"""You are AIMI, an AI Schedule Assistant. Analyze this academic schedule and provide optimization suggestions.

SCHEDULE CONTEXT:
- Total Schedule Entries: {context['total_schedule_entries']}
- Professors: {context['professors']}
- Blocks (Classes): {context['blocks']}
- Rooms: {context['rooms']}
- Courses: {context['courses']}
- Time Slots Available: {context['timeslots']}

CURRENT SCHEDULE:
{json.dumps(schedule_data, indent=2)}

{f"USER ISSUE: {issue_description}" if issue_description else ""}

INSTRUCTIONS:
1. Identify any scheduling conflicts, gaps, or inefficiencies
2. Suggest specific improvements that would:
   - Reduce student class vacancies (spread classes across different days)
   - Better utilize room capacity
   - Reduce long gaps for students between classes
   - Avoid very early or late classes (before 8am or after 7pm)
3. Ensure suggestions follow hard constraints:
   - No double-bookings for same room/professor/block
   - Room type matches course requirements
4. Provide 2-3 specific, actionable proposals

Format your response as JSON with this structure:
{{
  "summary": "Brief overview of schedule health",
  "issues_found": ["list of identified problems"],
  "proposals": [
    {{
      "title": "Proposal 1 Title",
      "description": "What to change and why",
      "changes": [
        {{"from": "entry_id or description", "to": "new_assignment", "reason": "why this helps"}}
      ],
      "expected_benefit": "How this improves the schedule"
    }}
  ],
  "constraints_noted": "Any hard constraints that limit options"
}}"""

            model = genai.GenerativeModel(AIScheduleAssistant.MODEL)
            response = model.generate_content(prompt)
            
            response_text = response.text
            # Extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            if start_idx >= 0 and end_idx > start_idx:
                json_str = response_text[start_idx:end_idx]
                suggestions = json.loads(json_str)
                return {'success': True, 'suggestions': suggestions}
            else:
                return {'success': True, 'suggestions': {'summary': response_text}}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def chat_about_schedule(user_message: str, conversation_history: list = None):
        """
        Chat with AIMI about schedule optimization
        Only responds to schedule-related queries
        """
        if not GEMINI_API_KEY:
            return {
                'success': False,
                'error': 'Gemini API key not configured.'
            }
        
        try:
            schedule_data = AIScheduleAssistant.get_schedule_data_for_analysis()
            
            # System prompt to restrict responses to schedule only
            system_prompt = """You are AIMI, an AI Schedule Assistant for academic institutions. 
            You ONLY help with schedule optimization, rescheduling, and related questions.
            
            For any question NOT related to schedules, respond with:
            "I'm AIMI, the Schedule Assistant. I can only help with schedule-related questions. How can I help you optimize your academic schedule?"
            
            For schedule-related questions, provide specific, actionable advice based on the schedule data provided."""
            
            # Build conversation with history
            messages = [
                {"role": "user", "content": f"Schedule context:\n{json.dumps(schedule_data)}\n\nSystem: {system_prompt}"}
            ]
            
            if conversation_history:
                messages.extend(conversation_history)
            
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            model = genai.GenerativeModel(AIScheduleAssistant.MODEL)
            response = model.generate_content(messages)
            
            ai_response = response.text
            
            # Check if response is the non-schedule response
            if "I'm AIMI, the Schedule Assistant" in ai_response:
                return {
                    'success': True,
                    'response': ai_response,
                    'is_schedule_related': False
                }
            
            return {
                'success': True,
                'response': ai_response,
                'is_schedule_related': True
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
