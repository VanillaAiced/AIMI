import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { apiFetch } from '../apiClient';

const BlocksScreen = ()=>{
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [year, setYear] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);
  const [deptId, setDeptId] = useState('');
  const [subdeptId, setSubdeptId] = useState('');
  const [subdeptNumber, setSubdeptNumber] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const r = await apiFetch('/api/blocks/', { headers });
        if(!r.ok) return;
        const j = await r.json();
        const data = Array.isArray(j)?j:(j.results||j);
        setList(data);
      }catch(e){}
    })();

    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const r = await apiFetch('/api/departments/', { headers });
        if(!r.ok) return;
        const j=await r.json();
        const d=Array.isArray(j)?j:(j.results||j);
        setDepartments(d);
      }catch(e){}
    })();

    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const r = await apiFetch('/api/subdepartments/', { headers });
        if(!r.ok) return;
        const j=await r.json();
        const d=Array.isArray(j)?j:(j.results||j);
        setSubdepartments(d);
      }catch(e){}
    })();
  },[]);

  useEffect(()=>{
    if(deptId){
      const first = subdepartments.find(s=> String(s.department)===String(deptId));
      if(first) setSubdeptId(first.id);
    }
  },[deptId, subdepartments]);

  useEffect(()=>{
    if(subdeptId){
      const s = subdepartments.find(x=> String(x.id)===String(subdeptId));
      setSubdeptNumber(s? (s.number||'') : '');
    }
  },[subdeptId, subdepartments]);

  const add = async (e)=>{
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {'Content-Type':'application/json'};
      if(token) headers['Authorization']=`Bearer ${token}`;
      const resp = await apiFetch('/api/blocks/',{method:'POST', headers, body: JSON.stringify({code, sub_department: subdeptId, year})});
      if(resp.ok){
        const j = await resp.json();
        setList(s=>[...s,j]);
        setCode('');
        setYear(1);
        setDeptId('');
        setSubdeptId('');
        setSubdeptNumber('');
        notify({ text: `Block "${j.code}" created successfully`, variant: 'success' });

        // if user provided/changed subdepartment number, patch subdepartment
        if(subdeptId){
          const s = subdepartments.find(x=> String(x.id)===String(subdeptId));
          const original = s? (s.number||'') : '';
          const newVal = subdeptNumber===null? '': subdeptNumber;
          if(String(original) !== String(newVal)){
            const subPayload = { number: newVal };
            await apiFetch(`/api/subdepartments/${subdeptId}/`, { method: 'PATCH', headers, body: JSON.stringify(subPayload) });
            setSubdepartments(sd=> sd.map(x=> String(x.id)===String(subdeptId)? {...x, number: newVal} : x));
          }
        }
      } else {
        let errorMsg = 'Failed to create block';
        try {
          const errText = await resp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              if (errJson.detail) {
                errorMsg = errJson.detail;
              } else if (errJson.code) {
                const codeErrors = Array.isArray(errJson.code) ? errJson.code.join(', ') : errJson.code;
                errorMsg = `Code: ${codeErrors}`;
              } else if (errJson.non_field_errors) {
                const errors = Array.isArray(errJson.non_field_errors) ? errJson.non_field_errors.join(', ') : errJson.non_field_errors;
                errorMsg = errors;
              }
            } catch (parseErr) {
              errorMsg = errText.substring(0, 200);
            }
          }
        } catch (e) {
          errorMsg = `Error: ${e.message}`;
        }
        notify({ text: errorMsg, variant: 'danger' });
      }
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
  };

  const remove = async (id)=>{
    if(!window.confirm('Delete this block?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {'Content-Type':'application/json'};
      if(token) headers['Authorization']=`Bearer ${token}`;
      const r = await fetch(`/api/blocks/${id}/`,{method:'DELETE', headers});
      if(r.ok) {
        setList(s=>s.filter(b=>b.id!==id));
        notify({ text: 'Block deleted successfully', variant: 'success' });
      } else {
        const errMsg = await r.text();
        notify({ text: `Failed to delete block: ${errMsg}`, variant: 'danger' });
      }
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
  };

  return (
    <div>
      <div className="mb-2">
        <Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button>
      </div>
      <h3>Blocks</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Block Code (e.g., 101)</Form.Label>
          <Form.Control
            value={code}
            onChange={(e)=>setCode(e.target.value)}
            placeholder="Enter block code"
            required
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Year Level</Form.Label>
          <Form.Control
            type="number"
            value={year}
            min={1}
            onChange={(e)=>setYear(parseInt(e.target.value)||1)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Department</Form.Label>
          <Form.Select
            value={deptId}
            onChange={(e)=>setDeptId(e.target.value)}
            required
          >
            <option value="">-- Select Department --</option>
            {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Sub-Department</Form.Label>
          <Form.Select
            value={subdeptId}
            onChange={(e)=>setSubdeptId(e.target.value)}
            required
          >
            <option value="">-- Select Sub-Department --</option>
            {subdepartments.filter(s=>!deptId||String(s.department)===String(deptId)).map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-2">
          <Form.Label>Sub-Department Number (Optional)</Form.Label>
          <Form.Control
            type="text"
            value={subdeptNumber===null? '': subdeptNumber}
            onChange={e=>setSubdeptNumber(e.target.value)}
            placeholder="e.g., 1"
          />
        </Form.Group>
        <Button type="submit">Create</Button>
      </Form>

      <Table striped>
        <thead>
          <tr>
            <th>Code</th>
            <th>Sub-Department</th>
            <th>Number</th>
            <th>Year</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(b=> {
            const s = subdepartments.find(x=> String(x.id)===String(b.sub_department));
            return (
              <tr key={b.id}>
                <td>{b.code}</td>
                <td>{s? s.name : (b.sub_department_name||b.sub_department)}</td>
                <td>{s? (s.number!==undefined && s.number!==null ? s.number : '') : ''}</td>
                <td>{b.year}</td>
                <td>
                  <Button size="sm" variant="danger" onClick={()=>remove(b.id)}>Delete</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
};

export default BlocksScreen;
