import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const DepartmentsScreen = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{
    fetch('/api/departments/').then(r=>r.ok? r.json(): []).then(json=>setList(json)).catch(()=>{});
  },[]);

  const add = async (e)=>{ e.preventDefault(); const resp = await fetch('/api/departments/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name})}); if (resp.ok) { setList(await resp.json().then(j=>[...list,j])); setName(''); } };

  return (
    <div>
      <h3>Departments</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Department name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th></tr></thead>
        <tbody>{list.map(d=> (<tr key={d.id}><td>{d.name}</td></tr>))}</tbody>
      </Table>
    </div>
  );
};

export default DepartmentsScreen;
