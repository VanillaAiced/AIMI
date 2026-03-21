import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Form } from 'react-bootstrap';

const ScheduleViewer = ()=>{
  const [view, setView] = useState('block');
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState('');

  useEffect(()=>{ 
    fetch('/api/schedule-entries/').then(r=>r.ok? r.json():[]).then(j=>setEntries(j)).catch(()=>setEntries([])); 
  },[]);

  // Get unique blocks, professors, rooms from entries
  const blocks = [...new Set(entries.filter(e=>e.block).map(e=>e.block))].map(id=>({id, name: `Block ${id}`})).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const profs = [...new Set(entries.filter(e=>e.professor).map(e=>JSON.stringify({id: e.professor.id, name: e.professor.name})))].map(JSON.parse).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  const rooms = [...new Set(entries.filter(e=>e.room).map(e=>JSON.stringify({id: e.room.id, name: e.room.name})))].map(JSON.parse).sort((a,b)=>String(a.name).localeCompare(String(b.name)));

  const getLabel = (view) => {
    if(view==='block') return 'Block';
    if(view==='prof') return 'Professor';
    if(view==='room') return 'Room';
    return '';
  };

  const getOptions = () => {
    if(view==='block') return blocks;
    if(view==='prof') return profs;
    if(view==='room') return rooms;
    return [];
  };

  const filteredEntries = selectedId ? entries.filter(e => {
    if(view === 'block') return e.block == selectedId;
    if(view === 'prof') return e.professor && e.professor.id == selectedId;
    if(view === 'room') return e.room && e.room.id == selectedId;
    return false;
  }) : [];

  return (<div>
    <h3>Schedule Viewer</h3>
    <div className="mb-3">
      <div className="mb-2"><strong>View by:</strong>{' '}
        <Button size="sm" variant={view==='block'? 'primary': 'secondary'} onClick={()=> {setView('block'); setSelectedId('');}} >BLOCK</Button>{' '}
        <Button size="sm" variant={view==='prof'? 'primary': 'secondary'} onClick={()=> {setView('prof'); setSelectedId('');}} >PROFESSOR</Button>{' '}
        <Button size="sm" variant={view==='room'? 'primary': 'secondary'} onClick={()=> {setView('room'); setSelectedId('');}}>ROOM</Button>
      </div>
      <div>
        <Form.Select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="w-25">
          <option value="">Select {getLabel(view)}</option>
          {getOptions().map(opt=><option key={opt.id} value={opt.id}>{opt.name}</option>)}
        </Form.Select>
      </div>
    </div>
    {entries.length === 0 && <Alert variant="info">No schedule data available. Generate a schedule in the Admin Dashboard.</Alert>}
    {entries.length > 0 && !selectedId && <Alert variant="warning">Select a {getLabel(view).toLowerCase()} to view their schedule.</Alert>}
    {entries.length > 0 && selectedId && filteredEntries.length === 0 && <Alert variant="warning">No schedule entries for this {getLabel(view).toLowerCase()}.</Alert>}
    <Table striped hover size="sm">
      <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Room</th><th>Professor</th></tr></thead>
      <tbody>{filteredEntries.map(e=>(<tr key={e.id}>
        <td>{e.time_slot? e.time_slot.day: '-'}</td>
        <td>{e.time_slot? (e.time_slot.start_time+'-'+e.time_slot.end_time): '-'}</td>
        <td>{e.course? e.course.code: '-'}</td>
        <td>{e.room? e.room.name: '-'}</td>
        <td>{e.professor? e.professor.name: '-'}</td>
      </tr>))}</tbody>
    </Table>
  </div>);
};
export default ScheduleViewer;
