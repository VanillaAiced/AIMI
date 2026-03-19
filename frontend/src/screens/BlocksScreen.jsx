import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BlocksScreen = ()=>{
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [year, setYear] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);
  const [deptId, setDeptId] = useState('');
  const [subdeptId, setSubdeptId] = useState('');
  const [editingBlock, setEditingBlock] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [editYear, setEditYear] = useState(1);
  const [editDeptId, setEditDeptId] = useState('');
  const [editSubdeptId, setEditSubdeptId] = useState('');
  const navigate = useNavigate();

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

  useEffect(()=>{
    if(editDeptId){ const first = subdepartments.find(s=> String(s.department)===String(editDeptId)); if(first) setEditSubdeptId(first.id); }
  },[editDeptId, subdepartments]);

  const add = async (e)=>{ e.preventDefault(); const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch('/api/blocks/',{method:'POST', headers, body: JSON.stringify({code, sub_department: subdeptId, year})}); if(resp.ok){ const j=await resp.json(); setList(s=>[...s,j]); setCode(''); } };
  const remove = async (id)=>{ if(!window.confirm('Delete block?')) return; const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const r = await fetch(`/api/blocks/${id}/`,{method:'DELETE', headers}); if(r.ok) setList(s=>s.filter(b=>b.id!==id)); };

  const openEdit = (b)=>{
    setEditingBlock(b);
    setEditCode(b.code||'');
    setEditYear(b.year||1);
    // find subdepartment to derive department
    const sub = subdepartments.find(s=> String(s.id)===String(b.sub_department));
    if(sub){ setEditDeptId(sub.department||''); setEditSubdeptId(sub.id||''); }
    else { setEditDeptId(''); setEditSubdeptId(b.sub_department||''); }
  };

  const saveEdit = async ()=>{
    if(!editingBlock) return;
    const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`;
    const payload = { code: editCode, year: editYear, sub_department: editSubdeptId };
    const resp = await fetch(`/api/blocks/${editingBlock.id}/`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    if(resp.ok){ const j = await resp.json(); setList(ls=>ls.map(x=> x.id===j.id?j:x)); setEditingBlock(null); setEditCode(''); setEditYear(1); setEditDeptId(''); setEditSubdeptId(''); }
  };

  return (
    <div>
      <Row className="align-items-center mb-3">
        <Col xs="auto"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button></Col>
        <Col><h3 className="text-center mb-0">Blocks (Sections)</h3></Col>
        <Col xs="auto" />
      </Row>
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
        <tbody>{list.map(b=> (
          <tr key={b.id}><td>{b.code}</td><td>{b.sub_department_name||b.sub_department}</td><td>{b.year}</td><td>
            <Button size="sm" variant="outline-primary" onClick={()=>openEdit(b)} style={{marginRight:6}}>Edit</Button>
            <Button size="sm" variant="danger" onClick={()=>remove(b.id)}>Delete</Button>
          </td></tr>
        ))}</tbody>
      </Table>

      <Modal show={!!editingBlock} onHide={()=>{ setEditingBlock(null); setEditCode(''); setEditYear(1); setEditDeptId(''); setEditSubdeptId(''); }} centered>
        <Modal.Header closeButton><Modal.Title>Edit Block</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{ e.preventDefault(); await saveEdit(); }}>
            <Form.Group className="mb-2"><Form.Label>Code</Form.Label><Form.Control value={editCode} onChange={e=>setEditCode(e.target.value)} required /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Year</Form.Label><Form.Control type="number" value={editYear} min={1} onChange={e=>setEditYear(parseInt(e.target.value)||1)} required /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Department</Form.Label>
              <Form.Select value={editDeptId||''} onChange={(e)=>setEditDeptId(e.target.value)}>
                <option value="">Select department</option>
                {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2"><Form.Label>Sub-department</Form.Label>
              <Form.Select value={editSubdeptId||''} onChange={(e)=>setEditSubdeptId(e.target.value)}>
                <option value="">Select sub-department</option>
                {subdepartments.filter(s=>!editDeptId||String(s.department)===String(editDeptId)).map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end"><Button type="submit">Save</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BlocksScreen;
