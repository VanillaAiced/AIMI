import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

function useQuery(){
  return new URLSearchParams(useLocation().search);
}

const SubDepartmentsScreen = ()=>{
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState([]);
  const query = useQuery();
  const deptFilter = query.get('dept');

  useEffect(()=>{
    (async ()=>{
      try{
        const resp = await fetch('/api/subdepartments/');
        if(!resp.ok) return;
        const json = await resp.json();
        const data = Array.isArray(json) ? json : (json.results || json);
        setList(data.filter(s=> !deptFilter || (s.department && String(s.department)===String(deptFilter))));
      }catch(e){}
    })();
    (async ()=>{
      try{
        const r = await fetch('/api/departments/');
        if(!r.ok) return;
        const j = await r.json();
        const d = Array.isArray(j)?j:(j.results||j);
        setDepartments(d);
      }catch(e){}
    })();
  },[deptFilter]);

  const add = async (e)=>{
    e.preventDefault();
    if(!name) return;
    const dept = deptFilter || (departments[0] && departments[0].id);
    if(!dept) return;
    const resp = await fetch('/api/subdepartments/', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, department: dept})});
    if(resp.ok){ const j = await resp.json(); setList(s=>[...s,j]); setName(''); }
  };

  const remove = async (id)=>{ if(!confirm('Delete sub-department?')) return; const resp=await fetch(`/api/subdepartments/${id}/`,{method:'DELETE'}); if(resp.ok) setList(s=>s.filter(x=>x.id!==id)); };

  return (
    <div>
      <h3>Sub-departments</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Select value={deptFilter||''} onChange={()=>{}} disabled={!!deptFilter} className="mb-2">
          {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
        </Form.Select>
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Sub-department name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>

      <Table striped>
        <thead><tr><th>Name</th><th>Department</th><th></th></tr></thead>
        <tbody>{list.map(s=> (
          <tr key={s.id}><td>{s.name}</td><td>{s.department_name||s.department}</td><td><Button size="sm" variant="danger" onClick={()=>remove(s.id)}>Delete</Button></td></tr>
        ))}</tbody>
      </Table>
    </div>
  );
};

export default SubDepartmentsScreen;
