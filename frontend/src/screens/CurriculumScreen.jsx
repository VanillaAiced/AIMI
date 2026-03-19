import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const CurriculumScreen = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  useEffect(()=>{ fetch('/api/curricula/').then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); },[]);
  const add = async (e) => {
    e.preventDefault();
    const resp = await fetch('/api/curricula/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    if (resp.ok) {
      const data = await resp.json();
      setList((l) => [...l, data]);
      setName('');
    }
  };
  return (
    <div>
      <h3>Curricula</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Curriculum name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th></tr></thead>
        <tbody>{list.map(c=>(<tr key={c.id}><td>{c.name}</td></tr>))}</tbody>
      </Table>
    </div>
  );
};
export default CurriculumScreen;
