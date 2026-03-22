import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { apiFetch } from '../apiClient';

const ProfessorsScreen = ()=>{
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await apiFetch('/api/professors/', { headers });
        if(!resp.ok) return;
        const json = await resp.json();
        setList(json);
      }catch(e){}
    })();
  },[]);

  const add = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await apiFetch('/api/professors/', { method: 'POST', headers, body: JSON.stringify({ name }) });
      if (resp.ok) {
        const data = await resp.json();
        setList((l) => [...l, data]);
        setName('');
        notify({ text: `Professor "${data.name}" created successfully`, variant: 'success' });
      } else {
        let errorMsg = 'Failed to create professor';
        try {
          const errText = await resp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              if (errJson.detail) errorMsg = errJson.detail;
              else if (errJson.name) {
                const nameErrors = Array.isArray(errJson.name) ? errJson.name.join(', ') : errJson.name;
                errorMsg = `Name: ${nameErrors}`;
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

  const remove = async (id) => {
    if (!window.confirm('Delete this professor?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(`/api/professors/${id}/`, { method: 'DELETE', headers });
      if (resp.ok) {
        setList((l) => l.filter(p => p.id !== id));
        notify({ text: 'Professor deleted successfully', variant: 'success' });
      } else {
        const errMsg = await resp.text();
        notify({ text: `Failed to delete professor: ${errMsg}`, variant: 'danger' });
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
      <h3>Professors</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Professor Name</Form.Label>
          <Form.Control
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Enter professor name"
            required
          />
        </Form.Group>
        <Button type="submit">Create</Button>
      </Form>
      <Table striped>
        <thead>
          <tr>
            <th>Name</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(p=>(
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                <Button size="sm" variant="danger" onClick={()=>remove(p.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ProfessorsScreen;
