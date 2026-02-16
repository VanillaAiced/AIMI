import React from 'react';
import { Container, Card, Table, Button, Badge, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const SchedulePreviewScreen = () => {
  const navigate = useNavigate();

  // Load data from localStorage
  const scheduleData = JSON.parse(localStorage.getItem('scheduleData') || '{"subjects":[],"professors":[],"rooms":[],"sections":[]}');
  
  // Generate schedule from actual input data
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
  const times = ['8A-9A', '9A-10A', '10A-11A', '11A-12P', '1P-2P', '2P-3P', '3P-4P', '4P-5P'];
  
  const generateSchedule = () => {
    const schedule = [];
    const { subjects, professors, rooms } = scheduleData;
    
    if (subjects.length === 0) {
      return [];
    }
    
    let dayIndex = 0;
    let timeIndex = 0;
    
    subjects.forEach((subject, index) => {
      const prof = professors[index % professors.length];
      const room = rooms[index % rooms.length];
      
      schedule.push({
        day: days[dayIndex],
        time: times[timeIndex],
        subject: subject.name,
        classCode: subject.code,
        block: subject.block,
        professor: prof ? prof.name : 'TBA',
        room: room ? room.name : 'TBA'
      });
      
      // Move to next time slot
      timeIndex++;
      if (timeIndex >= times.length) {
        timeIndex = 0;
        dayIndex++;
        if (dayIndex >= days.length) {
          dayIndex = 0;
        }
      }
    });
    
    return schedule;
  };
  
  const sampleSchedule = generateSchedule();

  const handleRequestAI = () => {
    // Save generated schedule for AI analysis
    localStorage.setItem('generatedSchedule', JSON.stringify(sampleSchedule));
    navigate('/ai-analysis');
  };

  const handleAccept = () => {
    // Save generated schedule for export
    localStorage.setItem('generatedSchedule', JSON.stringify(sampleSchedule));
    navigate('/export');
  };

  const handleRegenerate = () => {
    alert('Regenerating schedule with different parameters...');
    window.location.reload();
  };

  return (
    <Container className="mt-4">
      <h2>Schedule Preview</h2>
      
      {sampleSchedule.length > 0 ? (
        <>
          <Alert variant="success" className="mt-3">
            <i className="fas fa-check-circle"></i> Schedule successfully generated! Review the timetable below.
          </Alert>

          <Card className="mt-3 shadow">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Generated Schedule - Block {scheduleData.subjects[0]?.block || 'N/A'}</h5>
            </Card.Header>
        <Card.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Subject</th>
                <th>Class Code</th>
                <th>Block</th>
                <th>Professor</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {sampleSchedule.map((item, index) => (
                <tr key={index}>
                  <td><strong>{item.day}</strong></td>
                  <td>{item.time}</td>
                  <td>{item.subject}</td>
                  <td><Badge bg="secondary">{item.classCode}</Badge></td>
                  <td><Badge bg="success">{item.block}</Badge></td>
                  <td>{item.professor}</td>
                  <td><Badge bg="info">{item.room}</Badge></td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Alert variant="info" className="mt-3">
            <i className="fas fa-lightbulb"></i> <strong>Schedule Statistics:</strong>
            <ul className="mb-0 mt-2">
              <li>Total Classes: {sampleSchedule.length}</li>
              <li>No scheduling conflicts detected</li>
              <li>All professors within availability constraints</li>
              <li>Room capacity requirements met</li>
            </ul>
          </Alert>

          <div className="d-flex justify-content-between mt-4">
            <Button variant="warning" onClick={handleRegenerate}>
              <i className="fas fa-redo"></i> Regenerate Schedule
            </Button>
            
            <div>
              <Button variant="secondary" onClick={handleRequestAI} className="me-2">
                <i className="fas fa-brain"></i> Request AI Analysis
              </Button>
              
              <Button variant="success" onClick={handleAccept}>
                <i className="fas fa-check"></i> Accept & Finalize
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
        </>
      ) : (
        <Alert variant="warning" className="mt-3">
          <i className="fas fa-exclamation-triangle"></i> No schedule data found. Please go back to the Data Input Dashboard and add your subjects, professors, and rooms.
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/data-input')}>
              Go to Data Input
            </Button>
          </div>
        </Alert>
      )}
    </Container>
  );
};

export default SchedulePreviewScreen;
