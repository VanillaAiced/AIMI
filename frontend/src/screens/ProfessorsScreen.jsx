import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const ProfessorsScreen = ()=>{
  const [list,setList]=useState([]);
  const [name,setName]=useState('');
  useEffect(()=>{ (async ()=>{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; fetch('/api/professors/',{ headers }).then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); })(); },[]);
  const add = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch('/api/professors/', { method: 'POST', headers, body: JSON.stringify({ name }) });
    if (resp.ok) {
      const data = await resp.json();
      setList((l) => [...l, data]);
      setName('');
    }
  };
  return (<div><h3>Professors</h3><Form onSubmit={add}><Form.Control value={name} onChange={e=>setName(e.target.value)} placeholder="Name" required/><Button className="mt-2" type="submit">Create</Button></Form><Table striped className="mt-3"><thead><tr><th>Name</th></tr></thead><tbody>{list.map(p=>(<tr key={p.id}><td>{p.name}</td></tr>))}</tbody></Table></div>);
};
export default ProfessorsScreen;
