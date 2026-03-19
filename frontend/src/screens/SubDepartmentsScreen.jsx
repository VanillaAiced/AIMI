import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal, Row, Col } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

function useQuery(){
  return new URLSearchParams(useLocation().search);
}

const SubDepartmentsScreen = ()=>{
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockCounts, setBlockCounts] = useState({});
  const [editingSub, setEditingSub] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState(null);
  const [managingSub, setManagingSub] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [blockYear, setBlockYear] = useState(2);
  const [blockNumber, setBlockNumber] = useState('1');
  const [editingBlock, setEditingBlock] = useState(null);
  const [editBlockCode, setEditBlockCode] = useState('');
  const [editBlockYear, setEditBlockYear] = useState(2);
  const query = useQuery();
  const deptFilter = query.get('dept');
  const navigate = useNavigate();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = {'Content-Type':'application/json'};
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await fetch('/api/subdepartments/', { headers });
        if(!resp.ok) return;
        const json = await resp.json();
        const data = Array.isArray(json) ? json : (json.results || json);
        const filtered = data.filter(s=> !deptFilter || (s.department && String(s.department)===String(deptFilter)));
        setList(filtered);
        // prefetch block counts for visible sub-departments
        if(filtered.length){
          const promises = filtered.map(s => fetch(`/api/blocks/?sub_department=${s.id}`, { headers }).then(r=>r.ok? r.json(): []).catch(()=>[]));
          const results = await Promise.all(promises);
          const counts = {};
          for(let i=0;i<filtered.length;i++) counts[filtered[i].id] = Array.isArray(results[i]) ? results[i].length : (results[i].results?results[i].results.length:0);
          setBlockCounts(counts);
        } else {
          setBlockCounts({});
        }
      }catch(e){}
    })();
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = {'Content-Type':'application/json'};
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const r = await fetch('/api/departments/', { headers });
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
    const token = localStorage.getItem('accessToken');
    const headers = {'Content-Type':'application/json'};
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const resp = await fetch('/api/subdepartments/', { method: 'POST', headers, body: JSON.stringify({name, department: dept})});
    if(resp.ok){ const j = await resp.json(); setList(s=>[...s,j]); setBlockCounts(prev=>({...prev, [j.id]: 0})); setName(''); }
  };

  const remove = async (id)=>{ if(!window.confirm('Delete sub-department?')) return; const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp=await fetch(`/api/subdepartments/${id}/`,{method:'DELETE', headers}); if(resp.ok){ setList(s=>s.filter(x=>x.id!==id)); setBlockCounts(prev=>{ const copy={...prev}; delete copy[id]; return copy; }); } };

  const openEdit = (s)=>{ setEditingSub(s); setEditName(s.name||''); setEditDept(s.department||null); };

  const saveEdit = async ()=>{ if(!editingSub) return; const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch(`/api/subdepartments/${editingSub.id}/`, { method: 'PATCH', headers, body: JSON.stringify({ name: editName, department: editDept }) }); if(resp.ok){ const j = await resp.json(); setList(ls=>ls.map(x=> x.id===j.id?j:x)); setEditingSub(null); setEditName(''); setEditDept(null); } };

  return (
    <div>
      <div className="mb-2">
        <Button size="sm" variant="secondary" onClick={()=>navigate('/admin/departments')}>Back</Button>
      </div>
      <h3>Sub-departments</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Select value={deptFilter||''} onChange={()=>{}} disabled={!!deptFilter} className="mb-2">
          {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
        </Form.Select>
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Sub-department name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>

      <Table striped>
        <thead><tr><th>Name</th><th>Department</th><th>Blocks</th><th></th></tr></thead>
        <tbody>{list.map(s=> (
          <tr key={s.id}><td>{s.name}</td><td>{s.department_name||s.department}</td><td style={{width:100, textAlign:'center'}}>{blockCounts[s.id]||0}</td><td>
            <Button size="sm" variant="secondary" onClick={async ()=>{ setManagingSub(s); try{ const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const r = await fetch(`/api/blocks/?sub_department=${s.id}`, { headers }); if(!r.ok) return setBlocks([]); const j = await r.json(); const data = Array.isArray(j)?j:(j.results||j); setBlocks(data); }catch(e){ setBlocks([]); } }}>Blocks</Button>{' '}
            <Button size="sm" variant="danger" onClick={()=>remove(s.id)}>Delete</Button>{' '}
            <Button size="sm" variant="outline-primary" onClick={()=>openEdit(s)}>Edit</Button>
          </td></tr>
        ))}</tbody>
      </Table>

      <Modal show={!!editingSub} onHide={()=>{ setEditingSub(null); setEditName(''); setEditDept(null); }} centered>
        <Modal.Header closeButton><Modal.Title>Edit Sub-department</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{ e.preventDefault(); await saveEdit(); }}>
            <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control value={editName} onChange={(e)=>setEditName(e.target.value)} required/></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Department</Form.Label>
              <Form.Select value={editDept||''} onChange={(e)=>setEditDept(e.target.value)}>
                <option value="">Select department</option>
                {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end"><Button type="submit">Save</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Blocks manager modal */}
      <Modal show={!!managingSub} onHide={()=>{ setManagingSub(null); setBlocks([]); setBlockYear(2); setBlockNumber('1'); }} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Blocks for {managingSub?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{ e.preventDefault(); if(!managingSub) return; const code = `${blockYear}0${blockNumber}`; const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch('/api/blocks/', { method:'POST', headers, body: JSON.stringify({ code, sub_department: managingSub.id, year: blockYear }) }); if(resp.ok){ const j = await resp.json(); setBlocks(bs=>[...bs,j]); setBlockCounts(prev=>({...prev, [managingSub.id]: (prev[managingSub.id]||0)+1})); setBlockNumber('1'); } }} className="mb-3">
            <Row>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Sub-department</Form.Label>
                  <Form.Control readOnly value={`${managingSub?.department_name||''} / ${managingSub?.name||''}`} />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Year Level</Form.Label>
                  <Form.Control type="number" value={blockYear} min={1} onChange={e=>setBlockYear(parseInt(e.target.value)||1)} placeholder="e.g. 2 for 2nd year" />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group>
                  <Form.Label>Number</Form.Label>
                  <Form.Control value={blockNumber} onChange={e=>setBlockNumber(e.target.value)} placeholder="e.g. 1" />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Block Code Preview</Form.Label>
                  <Form.Control readOnly value={`${blockYear}0${blockNumber}`} />
                </Form.Group>
              </Col>
              <Col md={1} className="d-flex align-items-end">
                <Button type="submit">Create</Button>
              </Col>
            </Row>
          </Form>
          <Table striped>
            <thead><tr><th>Code</th><th>Year</th><th></th></tr></thead>
            <tbody>{blocks.map(b=> (
              <tr key={b.id}><td>{b.code}</td><td>{b.year}</td><td>
                <Button size="sm" variant="outline-primary" onClick={()=>{ setEditingBlock(b); setEditBlockCode(b.code||''); setEditBlockYear(b.year||2); }} style={{marginRight:6}}>Edit</Button>
                <Button size="sm" variant="danger" onClick={async ()=>{ if(!window.confirm('Delete block?')) return; const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const r = await fetch(`/api/blocks/${b.id}/`, { method:'DELETE', headers }); if(r.ok){ setBlocks(bs=>bs.filter(x=>x.id!==b.id)); setBlockCounts(prev=>({...prev, [managingSub.id]: Math.max(0,(prev[managingSub.id]||0)-1)})); } }}>Delete</Button>
              </td></tr>
            ))}</tbody>
          </Table>
          {/* Edit block modal */}
          <Modal show={!!editingBlock} onHide={()=>{ setEditingBlock(null); setEditBlockCode(''); setEditBlockYear(2); }} centered>
            <Modal.Header closeButton><Modal.Title>Edit Block</Modal.Title></Modal.Header>
            <Modal.Body>
              <Form onSubmit={async (e)=>{ e.preventDefault(); if(!editingBlock) return; const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization'] = `Bearer ${token}`; const payload = { code: editBlockCode, year: editBlockYear, sub_department: managingSub.id }; const resp = await fetch(`/api/blocks/${editingBlock.id}/`, { method: 'PATCH', headers, body: JSON.stringify(payload) }); if(resp.ok){ const j = await resp.json(); setBlocks(bs=>bs.map(x=> x.id===j.id?j:x)); setEditingBlock(null); setEditBlockCode(''); setEditBlockYear(2); } }}>
                <Form.Group className="mb-2"><Form.Label>Code</Form.Label><Form.Control value={editBlockCode} onChange={e=>setEditBlockCode(e.target.value)} required /></Form.Group>
                <Form.Group className="mb-2"><Form.Label>Year</Form.Label><Form.Control type="number" value={editBlockYear} min={1} onChange={e=>setEditBlockYear(parseInt(e.target.value)||1)} required /></Form.Group>
                <div className="d-flex justify-content-end"><Button type="submit">Save</Button></div>
              </Form>
            </Modal.Body>
          </Modal>
        </Modal.Body>
        <Modal.Footer><Button onClick={()=>{ setManagingSub(null); setBlocks([]); }}>Close</Button></Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubDepartmentsScreen;
