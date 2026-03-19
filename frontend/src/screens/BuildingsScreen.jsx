import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const BuildingsScreen = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');

  useEffect(()=>{ fetch('/api/buildings/').then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); },[]);

  const add = async (e)=>{ e.preventDefault(); const resp = await fetch('/api/buildings/', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name})}); if (resp.ok){ const json=await resp.json(); setList(list=>[...list,json]); setName(''); } };

  return (
    <div>
      <h3>Buildings</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Building name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th><th></th></tr></thead>
        <tbody>{list.map(b=>(<tr key={b.id}><td>{b.name}</td><td><Button size="sm" variant="outline-danger" onClick={async ()=>{ await fetch(`/api/buildings/${b.id}/`,{method:'DELETE'}); setList(list.filter(x=>x.id!==b.id));}}>Delete</Button></td></tr>))}</tbody>
      </Table>
    </div>
  );
};

export default BuildingsScreen;
