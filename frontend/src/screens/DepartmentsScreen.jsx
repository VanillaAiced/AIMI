import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const DepartmentsScreen = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [subdeptCounts, setSubdeptCounts] = useState({});

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch('/api/departments/', { headers });
        if(!resp.ok) return;
        const json = await resp.json();
        const data = Array.isArray(json) ? json : (json.results || json);
        setList(data);
      }catch(e){}
    })();
  },[]);

  // when departments load, prefetch counts of sub-departments per department
  useEffect(()=>{
    if(!list || !list.length) return setSubdeptCounts({});
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const promises = list.map(d => fetch(`/api/subdepartments/?department=${d.id}`, { headers }).then(r=>r.ok? r.json(): []).catch(()=>[]));
        const results = await Promise.all(promises);
        const counts = {};
        for(let i=0;i<list.length;i++) counts[list[i].id] = Array.isArray(results[i]) ? results[i].length : (results[i].results?results[i].results.length:0);
        setSubdeptCounts(counts);
      }catch(e){}
    })();
  },[list]);

  const navigate = useNavigate();

  const add = async (e)=>{
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch('/api/departments/', { method: 'POST', headers, body: JSON.stringify({name})});
    if (resp.ok) {
      const j = await resp.json();
      setList((s)=>[...s,j]);
      setSubdeptCounts(prev=>({...prev, [j.id]: 0}));
      setName('');
    }
  };

  const remove = async (id)=>{
    if (!window.confirm('Delete this department?')) return;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch(`/api/departments/${id}/`, { method: 'DELETE', headers });
    if (resp.ok) setList((s)=>s.filter(d=>d.id!==id));
  };

  const openSubDepartments = (deptId)=>{
    navigate(`/admin/subdepartments?dept=${deptId}`);
  };

  return (
    <div>
      <div className="mb-2">
        <Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button>
      </div>
      <h3>Departments</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Department name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th><th>Sub-departments</th><th></th></tr></thead>
        <tbody>{list.map(d=> (
          <tr key={d.id}>
            <td>{d.name}</td>
            <td style={{width:120, textAlign:'center'}}>{subdeptCounts[d.id]||0}</td>
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
