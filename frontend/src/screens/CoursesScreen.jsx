import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const CoursesScreen = () => {
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [manualCode, setManualCode] = useState(false);
  useEffect(()=>{ (async ()=>{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; fetch('/api/courses/',{ headers }).then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); })(); },[]);
  const add = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // supply minimal required fields so backend validation passes
    const payload = {
      code,
      name,
      duration_minutes: 90,
      frequency_per_week: 1,
      units: 3,
    };
    const resp = await fetch('/api/courses/', { method: 'POST', headers, body: JSON.stringify(payload) });
    if (resp.ok) {
      const data = await resp.json();
      setList((l) => [...l, data]);
      setCode('');
      setName('');
    } else {
      // try to surface backend validation error to console for quick debugging
      try { const j = await resp.json(); console.error('Course create error', j); } catch (err) { console.error('Course create failed', err); }
    }
  };

  // Auto-generate code from name unless user has manually edited the code field
  useEffect(()=>{
    if(manualCode) return;
    if(!name) { setCode(''); return; }
    // create a short prefix from initials (max 4 chars)
    const initials = name.split(/\s+/).filter(Boolean).map(w=>w.replace(/[^a-z0-9]/gi,'')[0]||'').join('').toUpperCase().slice(0,4) || name.replace(/[^a-z0-9]/gi,'').slice(0,4).toUpperCase();
    // find existing codes that start with the prefix and extract numeric suffix
    const matching = (list || []).map(c=>c.code).filter(Boolean).filter(c=> c.toUpperCase().startsWith(initials));
    let maxNum = 0;
    matching.forEach(c=>{
      const tail = c.slice(initials.length).replace(/[^0-9]/g,'');
      const n = parseInt(tail||'0',10);
      if(!isNaN(n) && n>maxNum) maxNum = n;
    });
    const next = maxNum + 1;
    setCode(`${initials}${next}`);
  }, [name, list, manualCode]);

  // if user types in the code field, treat it as manual to avoid overwriting
  const onCodeChange = (v) => { setManualCode(true); setCode(v); };
  return (
    <div>
      <h3>Courses</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="mb-2" required />
        <Form.Control value={code} readOnly placeholder="Code preview" />
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
