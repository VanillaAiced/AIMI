import React, { useEffect, useState } from 'react';
import { Table, Button } from 'react-bootstrap';

const ScheduleViewer = ()=>{
  const [view, setView] = useState('block');
  const [entries, setEntries] = useState([]);
  useEffect(()=>{ fetch('/api/schedule-entries/').then(r=>r.ok? r.json():[]).then(j=>setEntries(j)).catch(()=>{}); },[]);
  return (<div><h3>Schedule Viewer</h3>
    <div className="mb-2">View by: <Button size="sm" onClick={()=>setView('block')}>Block</Button>{' '}<Button size="sm" onClick={()=>setView('prof')}>Professor</Button>{' '}<Button size="sm" onClick={()=>setView('room')}>Room</Button></div>
    <Table striped>
      <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Room</th><th>Professor</th></tr></thead>
      <tbody>{entries.map(e=>(<tr key={e.id}><td>{e.timeslot? e.timeslot.day: ''}</td><td>{e.timeslot? (e.timeslot.start_time+'-'+e.timeslot.end_time): ''}</td><td>{e.course_offering? (e.course_offering.course? e.course_offering.course.code: ''): ''}</td><td>{e.room? e.room.name: ''}</td><td>{e.professor? e.professor.name: ''}</td></tr>))}</tbody>
    </Table>
  </div>);
};
export default ScheduleViewer;
