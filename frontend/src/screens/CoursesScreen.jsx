import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const CoursesScreen = () => {
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  useEffect(()=>{ fetch('/api/courses/').then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); },[]);
  const add = async (e) => {
    e.preventDefault();
    const resp = await fetch('/api/courses/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name }) });
    if (resp.ok) {
      const data = await resp.json();
      setList((l) => [...l, data]);
      setCode('');
      setName('');
    }
  };
  return (
    <div>
      <h3>Courses</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Code" required />
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="mt-2" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Code</th><th>Name</th></tr></thead>
        <tbody>{list.map(c=>(<tr key={c.id}><td>{c.code}</td><td>{c.name}</td></tr>))}</tbody>
      </Table>
    </div>
  );
};
export default CoursesScreen;
