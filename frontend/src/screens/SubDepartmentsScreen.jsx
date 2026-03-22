import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import Loader from '../components/Loader';
import { apiFetch } from '../apiClient';

function useQuery(){
  return new URLSearchParams(useLocation().search);
}

const SubDepartmentsScreen = ()=>{
  const [list, setList] = useState([]);
  const [name, setName] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockCounts, setBlockCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [managingSub, setManagingSub] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const [blockCreating, setBlockCreating] = useState(false);
  const [blockDeleting, setBlockDeleting] = useState(null);
  const [blockYear, setBlockYear] = useState(1);
  const [blockNumber, setBlockNumber] = useState('01');
  const query = useQuery();
  const deptFilter = query.get('dept');
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(()=>{
    (async ()=>{
      try{
        setLoading(true);
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const resp = await apiFetch('/api/subdepartments/', { headers });
        if(!resp.ok) return;
        const json = await resp.json();
        const data = Array.isArray(json) ? json : (json.results || json);
        const filtered = data.filter(s=> !deptFilter || (s.department && String(s.department)===String(deptFilter)));
        setList(filtered);
        // prefetch block counts for visible sub-departments
        if(filtered.length){
          const promises = filtered.map(s => apiFetch(`/api/blocks/?sub_department=${s.id}`, { headers }).then(r=>r.ok? r.json(): []).catch(()=>[]));
          const results = await Promise.all(promises);
          const counts = {};
          for(let i=0;i<filtered.length;i++) counts[filtered[i].id] = Array.isArray(results[i]) ? results[i].length : (results[i].results?results[i].results.length:0);
          setBlockCounts(counts);
        } else {
          setBlockCounts({});
        }
      }catch(e){}
      finally {
        setLoading(false);
      }
    })();
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const r = await apiFetch('/api/departments/', { headers });
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
    try {
      setCreating(true);
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await apiFetch('/api/subdepartments/', { method: 'POST', headers, body: JSON.stringify({name, department: dept})});
      if(resp.ok){
        const j = await resp.json();
        setList(s => [...s, j]);
        setBlockCounts(prev => ({...prev, [j.id]: 0}));
        setName('');
        notify({ text: `Sub-department "${j.name}" created successfully`, variant: 'success' });
      } else {
        let errorMsg = 'Failed to create sub-department';
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
    finally {
      setCreating(false);
    }
  };

  const remove = async (id) => {
    if(!window.confirm('Delete this sub-department?')) return;
    try {
      setDeleting(id);
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await apiFetch(`/api/subdepartments/${id}/`, {method: 'DELETE', headers});
      if(resp.ok){
        setList(s => s.filter(x => x.id !== id));
        setBlockCounts(prev => { const copy = {...prev}; delete copy[id]; return copy; });
        notify({ text: 'Sub-department deleted successfully', variant: 'success' });
      } else {
        let errorMsg = 'Failed to delete sub-department';
        try {
          const errText = await resp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              if (errJson.detail) errorMsg = errJson.detail;
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
    finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="mb-2">
        <Button size="sm" variant="secondary" onClick={()=>navigate('/admin/departments')}>Back</Button>
      </div>
      <h3>Sub-Departments</h3>
      {loading ? (
        <Loader message="Loading sub-departments..." />
      ) : (
        <>
          <Form onSubmit={add} className="mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Department</Form.Label>
              <Form.Control
                as="select"
                disabled={!!deptFilter || creating}
                className="form-select"
              >
                {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
              </Form.Control>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Sub-Department Name</Form.Label>
              <Form.Control
                value={name}
                onChange={(e)=>setName(e.target.value)}
                placeholder="Enter sub-department name"
                required
                disabled={creating}
              />
            </Form.Group>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </Form>

          <Table striped>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Blocks</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(s=>(
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.department_name || s.department}</td>
                  <td style={{width: 100, textAlign: 'center'}}>{blockCounts[s.id] || 0}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={async ()=>{
                        setManagingSub(s);
                        try{
                          setBlockLoading(true);
                          const token = localStorage.getItem('accessToken');
                          const headers = { 'Content-Type': 'application/json' };
                          if(token) headers['Authorization'] = `Bearer ${token}`;
                          const r = await apiFetch(`/api/blocks/?sub_department=${s.id}`, { headers });
                          if(!r.ok) return setBlocks([]);
                          const j = await r.json();
                          const data = Array.isArray(j)?j:(j.results||j);
                          setBlocks(data);
                        }catch(e){
                          setBlocks([]);
                        }
                        finally {
                          setBlockLoading(false);
                        }
                      }}
                      disabled={deleting !== null}
                      className="me-2"
                    >
                      Blocks
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={()=>remove(s.id)}
                      disabled={deleting !== null}
                    >
                      {deleting === s.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {/* Blocks Manager Modal */}
      <Modal show={!!managingSub} onHide={()=>{ setManagingSub(null); setBlocks([]); setBlockYear(1); setBlockNumber('01'); }} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Blocks for {managingSub?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {blockLoading ? (
            <Loader message="Loading blocks..." />
          ) : (
            <>
              <div className="mb-4">
                <h5>Create New Block</h5>
                <Form onSubmit={async (e)=>{
                  e.preventDefault();
                  if(!managingSub || !blockYear || !blockNumber) return;
                  const paddedNumber = String(blockNumber).padStart(2, '0');
                  const generatedCode = `${blockYear}${paddedNumber}`;
                  try {
                    setBlockCreating(true);
                    const token = localStorage.getItem('accessToken');
                    const headers = { 'Content-Type': 'application/json' };
                    if(token) headers['Authorization'] = `Bearer ${token}`;
                    const resp = await apiFetch('/api/blocks/', { method: 'POST', headers, body: JSON.stringify({code: generatedCode, sub_department: managingSub.id, year: blockYear}) });
                    if(resp.ok){
                      const j = await resp.json();
                      setBlocks(bs => [...bs, j]);
                      setBlockCounts(prev => ({...prev, [managingSub.id]: (prev[managingSub.id] || 0) + 1}));
                      setBlockYear(1);
                      setBlockNumber('01');
                      notify({ text: `Block "${j.code}" created successfully`, variant: 'success' });
                    } else {
                      let errorMsg = 'Failed to create block';
                      try {
                        const errText = await resp.text();
                        if (errText) {
                          try {
                            const errJson = JSON.parse(errText);
                            if (errJson.detail) errorMsg = errJson.detail;
                            else if (errJson.code) {
                              const codeErrors = Array.isArray(errJson.code) ? errJson.code.join(', ') : errJson.code;
                              errorMsg = `Code: ${codeErrors}`;
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
                  finally {
                    setBlockCreating(false);
                  }
                }} className="mb-3">
                  <Form.Group className="mb-2">
                    <Form.Label>Year Level</Form.Label>
                    <Form.Control
                      type="number"
                      value={blockYear}
                      min={1}
                      onChange={(e)=>setBlockYear(parseInt(e.target.value)||1)}
                      required
                      disabled={blockCreating}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Block Number</Form.Label>
                    <Form.Control
                      value={blockNumber}
                      onChange={(e)=>setBlockNumber(e.target.value)}
                      placeholder="e.g., 01, 02, 03"
                      maxLength="2"
                      required
                      disabled={blockCreating}
                    />
                  </Form.Group>
                  <Form.Group className="mb-2">
                    <Form.Label>Generated Block Code</Form.Label>
                    <Form.Control
                      type="text"
                      value={`${blockYear}${String(blockNumber).padStart(2, '0')}`}
                      disabled
                      className="bg-light"
                    />
                  </Form.Group>
                  <Button type="submit" size="sm" disabled={blockCreating}>
                    {blockCreating ? 'Creating...' : 'Create Block'}
                  </Button>
                </Form>
                <hr />
              </div>
              
              <h5>Existing Blocks</h5>
              <Table striped>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Year</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map(b=>(
                    <tr key={b.id}>
                      <td>{b.code}</td>
                      <td>{b.year}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={blockDeleting !== null}
                          onClick={async ()=>{
                            if(!window.confirm('Delete block?')) return;
                            try {
                              setBlockDeleting(b.id);
                              const token = localStorage.getItem('accessToken');
                              const headers = { 'Content-Type': 'application/json' };
                              if(token) headers['Authorization'] = `Bearer ${token}`;
                              const r = await apiFetch(`/api/blocks/${b.id}/`, { method: 'DELETE', headers });
                              if(r.ok){
                                setBlocks(bs => bs.filter(x => x.id !== b.id));
                                setBlockCounts(prev => ({...prev, [managingSub.id]: Math.max(0, (prev[managingSub.id] || 0) - 1)}));
                                notify({ text: 'Block deleted successfully', variant: 'success' });
                              } else {
                                let errorMsg = 'Failed to delete block';
                                try {
                                  const errText = await r.text();
                                  if (errText) {
                                    try {
                                      const errJson = JSON.parse(errText);
                                      if (errJson.detail) errorMsg = errJson.detail;
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
                            finally {
                              setBlockDeleting(null);
                            }
                          }}
                        >
                          {blockDeleting === b.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>{ setManagingSub(null); setBlocks([]); }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SubDepartmentsScreen;
