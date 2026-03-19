import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const DepartmentsScreen = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{
    (async ()=>{
      try{
        const resp = await fetch('/api/departments/');
        if(!resp.ok) return;
        const json = await resp.json();
        const data = Array.isArray(json) ? json : (json.results || json);
        setList(data);
      }catch(e){}
    })();
  },[]);

  const navigate = useNavigate();

  const add = async (e)=>{
    e.preventDefault();
    const resp = await fetch('/api/departments/', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({name})});
    if (resp.ok) {
      const j = await resp.json();
      setList((s)=>[...s,j]);
      setName('');
    }
  };

  const remove = async (id)=>{
    if (!confirm('Delete this department?')) return;
    const resp = await fetch(`/api/departments/${id}/`, { method: 'DELETE' });
    if (resp.ok) setList((s)=>s.filter(d=>d.id!==id));
  };

  const openSubDepartments = (deptId)=>{
    navigate(`/admin/subdepartments?dept=${deptId}`);
  };

  return (
    <div>
      <h3>Departments</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Department name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th><th></th></tr></thead>
        <tbody>{list.map(d=> (
          <tr key={d.id}>
            <td>{d.name}</td>
            <td>
              <Button size="sm" variant="secondary" onClick={()=>openSubDepartments(d.id)}>Sub-departments</Button>{' '}
              <Button size="sm" variant="danger" onClick={()=>remove(d.id)}>Delete</Button>
            </td>
          </tr>
        ))}</tbody>
      </Table>
    </div>
  );
};

export default DepartmentsScreen;
