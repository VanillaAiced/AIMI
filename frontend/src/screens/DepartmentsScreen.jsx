import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { apiFetch } from '../apiClient';

const DepartmentsScreen = () => {
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [subdeptCounts, setSubdeptCounts] = useState({});
  const { notify } = useNotification();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await apiFetch('/api/departments/', { headers });
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
        const promises = list.map(d => apiFetch(`/api/subdepartments/?department=${d.id}`, { headers }).then(r=>r.ok? r.json(): []).catch(()=>[]));
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
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await apiFetch('/api/departments/', { method: 'POST', headers, body: JSON.stringify({name})});
      if (resp.ok) {
        const j = await resp.json();
        setList((s)=>[...s,j]);
        setSubdeptCounts(prev=>({...prev, [j.id]: 0}));
        setName('');
        notify({ text: `Department "${j.name}" created successfully`, variant: 'success' });
      } else {
        let errorMsg = 'Failed to create department';
        let errText = '';
        try {
          errText = await resp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              // Handle DRF error responses
              if (errJson.detail) {
                errorMsg = errJson.detail;
              } else if (errJson.name) {
                // Handle field-specific errors
                const nameErrors = Array.isArray(errJson.name) ? errJson.name.join(', ') : errJson.name;
                errorMsg = `Name: ${nameErrors}`;
              } else if (errJson.non_field_errors) {
                const errors = Array.isArray(errJson.non_field_errors) ? errJson.non_field_errors.join(', ') : errJson.non_field_errors;
                errorMsg = errors;
              } else if (typeof errJson === 'string') {
                errorMsg = errJson;
              }
            } catch (parseErr) {
              // If not JSON, use text as-is
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
    if (!window.confirm('Delete this department?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(`/api/departments/${id}/`, { method: 'DELETE', headers });
      if (resp.ok) {
        setList((s)=>s.filter(d=>d.id!==id));
        notify({ text: 'Department deleted successfully', variant: 'success' });
      } else {
        const errMsg = await resp.text();
        notify({ text: `Failed to delete department: ${errMsg}`, variant: 'danger' });
      }
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
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
