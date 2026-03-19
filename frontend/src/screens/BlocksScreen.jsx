import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col } from 'react-bootstrap';

const BlocksScreen = ()=>{
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [year, setYear] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);
  const [deptId, setDeptId] = useState('');
  const [subdeptId, setSubdeptId] = useState('');

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const r = await fetch('/api/blocks/', { headers });
        if(!r.ok) return; const j = await r.json(); const data = Array.isArray(j)?j:(j.results||j); setList(data);
      }catch(e){}
    })();

    (async ()=>{
      try{ const token = localStorage.getItem('accessToken'); const headers = { 'Content-Type': 'application/json' }; if (token) headers['Authorization'] = `Bearer ${token}`; const r = await fetch('/api/departments/', { headers }); if(!r.ok) return; const j=await r.json(); const d=Array.isArray(j)?j:(j.results||j); setDepartments(d); }catch(e){}
    })();

    (async ()=>{
      try{ const token = localStorage.getItem('accessToken'); const headers = { 'Content-Type': 'application/json' }; if (token) headers['Authorization'] = `Bearer ${token}`; const r = await fetch('/api/subdepartments/', { headers }); if(!r.ok) return; const j=await r.json(); const d=Array.isArray(j)?j:(j.results||j); setSubdepartments(d); }catch(e){}
    })();
  },[]);

  useEffect(()=>{
    if(deptId){ const first = subdepartments.find(s=> String(s.department)===String(deptId)); if(first) setSubdeptId(first.id); }
  },[deptId, subdepartments]);

  const add = async (e)=>{ e.preventDefault(); const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch('/api/blocks/',{method:'POST', headers, body: JSON.stringify({code, sub_department: subdeptId, year})}); if(resp.ok){ const j=await resp.json(); setList(s=>[...s,j]); setCode(''); } };
  const remove = async (id)=>{ if(!window.confirm('Delete block?')) return; const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const r = await fetch(`/api/blocks/${id}/`,{method:'DELETE', headers}); if(r.ok) setList(s=>s.filter(b=>b.id!==id)); };

  return (
    <div>
      <h3>Blocks (Sections)</h3>
      <Form onSubmit={add} className="mb-3">
        <Row>
          <Col md={4}><Form.Control value={code} onChange={(e)=>setCode(e.target.value)} placeholder="Block code (e.g. CPE-101)" required/></Col>
          <Col md={2}><Form.Control type="number" value={year} min={1} onChange={(e)=>setYear(parseInt(e.target.value)||1)} /></Col>
          <Col md={3}><Form.Select value={deptId} onChange={(e)=>setDeptId(e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </Form.Select></Col>
          <Col md={3}><Form.Select value={subdeptId} onChange={(e)=>setSubdeptId(e.target.value)}>
            <option value="">Select sub-department</option>
            {subdepartments.filter(s=>!deptId||String(s.department)===String(deptId)).map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </Form.Select></Col>
        </Row>
        <Button className="mt-2" type="submit">Create Block</Button>
      </Form>

      <Table striped>
        <thead><tr><th>Code</th><th>Sub-department</th><th>Year</th><th></th></tr></thead>
        <tbody>{list.map(b=> (<tr key={b.id}><td>{b.code}</td><td>{b.sub_department_name||b.sub_department}</td><td>{b.year}</td><td><Button size="sm" variant="danger" onClick={()=>remove(b.id)}>Delete</Button></td></tr>))}</tbody>
      </Table>
    </div>
  );
};

export default BlocksScreen;
