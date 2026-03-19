import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const TimeSlotsScreen = () => {
  const [list, setList] = useState([]);
  const [day, setDay] = useState('MONDAY');
  const [start, setStart] = useState('07:00');
  const [end, setEnd] = useState('08:30');

  useEffect(()=>{ fetch('/api/timeslots/').then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); },[]);
  const add=async(e)=>{ e.preventDefault(); const resp=await fetch('/api/timeslots/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day,start_time:start,end_time:end})}); if(resp.ok){ const json=await resp.json(); setList(l=>[...l,json]); } };

  return (
    <div>
      <h3>Time Slots</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Select value={day} onChange={(e)=>setDay(e.target.value)}>
          <option>MONDAY</option><option>TUESDAY</option><option>WEDNESDAY</option><option>THURSDAY</option><option>FRIDAY</option>
        </Form.Select>
        <Form.Control type="time" value={start} onChange={(e)=>setStart(e.target.value)} className="mt-2" />
        <Form.Control type="time" value={end} onChange={(e)=>setEnd(e.target.value)} className="mt-2" />
        <Button className="mt-2" type="submit">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Day</th><th>Start</th><th>End</th></tr></thead>
        <tbody>{list.map(t=>(<tr key={t.id}><td>{t.day}</td><td>{t.start_time}</td><td>{t.end_time}</td></tr>))}</tbody>
      </Table>
    </div>
  );
};

export default TimeSlotsScreen;
