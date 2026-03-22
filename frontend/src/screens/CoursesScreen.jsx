import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { apiFetch } from '../apiClient';

const CoursesScreen = () => {
  const [list, setList] = useState([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [manualCode, setManualCode] = useState(false);
  const [duration, setDuration] = useState(90);
  const [frequency, setFrequency] = useState(1);
  const [units, setUnits] = useState(3);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomRequirement, setRoomRequirement] = useState('');
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);
  const [profDept, setProfDept] = useState('');
  const [profSubdept, setProfSubdept] = useState('');
  const [allowAnyProf, setAllowAnyProf] = useState(false);
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const [coursesR, rtR, depsR, subsR] = await Promise.all([
          apiFetch('/api/courses/', { headers }),
          apiFetch('/api/room-types/', { headers }),
          apiFetch('/api/departments/', { headers }),
          apiFetch('/api/subdepartments/', { headers })
        ]);
        const coursesJ = coursesR.ok? await coursesR.json() : [];
        setList(Array.isArray(coursesJ)?coursesJ:(coursesJ.results||[]));
        const rtJ = rtR.ok? await rtR.json() : [];
        setRoomTypes(Array.isArray(rtJ)?rtJ:(rtJ.results||[]));
        const depsJ = depsR.ok? await depsR.json() : [];
        setDepartments(Array.isArray(depsJ)?depsJ:(depsJ.results||[]));
        const subsJ = subsR.ok? await subsR.json() : [];
        setSubdepartments(Array.isArray(subsJ)?subsJ:(subsJ.results||[]));
      }catch(e){}
    })();
  },[]);

  const add = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const payload = {
        code,
        name,
        duration_minutes: Number(duration) || 0,
        frequency_per_week: Number(frequency) || 1,
        units: Number(units) || 0,
        room_requirement: roomRequirement || null,
        professor_requirement: allowAnyProf ? null : (profSubdept || null),
        allow_any_professor: !!allowAnyProf,
      };
      const resp = await apiFetch('/api/courses/', { method: 'POST', headers, body: JSON.stringify(payload) });
      if (resp.ok) {
        const data = await resp.json();
        setList((l) => [...l, data]);
        setCode('');
        setName('');
        setManualCode(false);
        setDuration(90);
        setFrequency(1);
        setUnits(3);
        setRoomRequirement('');
        setProfDept('');
        setProfSubdept('');
        setAllowAnyProf(false);
        notify({ text: `Course "${data.name}" created successfully`, variant: 'success' });
      } else {
        let errorMsg = 'Failed to create course';
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

  // Auto-generate code from name unless user has manually edited the code field
  useEffect(()=>{
    if(manualCode) return;
    if(!name) { setCode(''); return; }
    const initials = name.split(/\s+/).filter(Boolean).map(w=>w.replace(/[^a-z0-9]/gi,'')[0]||'').join('').toUpperCase().slice(0,4) || name.replace(/[^a-z0-9]/gi,'').slice(0,4).toUpperCase();
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

  const onCodeChange = (v) => { setManualCode(true); setCode(v); };

  const remove = async (id) => {
    if(!window.confirm('Delete this course?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await fetch(`/api/courses/${id}/`, { method: 'DELETE', headers });
      if(resp.ok){
        setList(l => l.filter(c => c.id !== id));
        notify({ text: 'Course deleted successfully', variant: 'success' });
      } else {
        let errorMsg = 'Failed to delete course';
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
  };

  return (
    <div>
      <div className="mb-2">
        <Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button>
      </div>
      <h3>Courses</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Course Name</Form.Label>
          <Form.Control
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Enter course name"
            required
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Course Code</Form.Label>
          <Form.Control
            value={code}
            onChange={e=>onCodeChange(e.target.value)}
            placeholder="Auto-generated or custom"
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Duration (minutes)</Form.Label>
          <Form.Control
            type="number"
            value={duration}
            onChange={e=>setDuration(e.target.value)}
            placeholder="e.g., 90"
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Frequency per Week</Form.Label>
          <Form.Control
            type="number"
            value={frequency}
            onChange={e=>setFrequency(e.target.value)}
            placeholder="e.g., 1"
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Units</Form.Label>
          <Form.Control
            type="number"
            value={units}
            onChange={e=>setUnits(e.target.value)}
            placeholder="e.g., 3"
          />
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Room Requirement (Optional)</Form.Label>
          <Form.Select value={roomRequirement} onChange={e=>setRoomRequirement(e.target.value)}>
            <option value="">-- No specific room type --</option>
            {roomTypes.map(r=> <option key={r.id} value={r.id}>{r.name}</option>)}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-2">
          <Form.Label>Professor Department (Optional)</Form.Label>
          <Form.Select
            value={profDept}
            onChange={e=>{
              setProfDept(e.target.value);
              setProfSubdept('');
              setAllowAnyProf(false);
            }}
          >
            <option value="">-- No specific professor --</option>
            {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </Form.Select>
        </Form.Group>

        {profDept && (
          <>
            <Form.Group className="mb-2">
              <Form.Check
                type="checkbox"
                id="any-prof"
                label="Any professor in this department"
                checked={allowAnyProf}
                onChange={e=>{
                  setAllowAnyProf(e.target.checked);
                  if(e.target.checked) setProfSubdept('');
                }}
              />
            </Form.Group>

            {!allowAnyProf && (
              <Form.Group className="mb-2">
                <Form.Label>Specific Sub-Department</Form.Label>
                <Form.Select
                  value={profSubdept}
                  onChange={e=>{
                    setProfSubdept(e.target.value);
                    setAllowAnyProf(false);
                  }}
                >
                  <option value="">-- Any sub-department --</option>
                  {subdepartments.filter(s=> String(s.department) === String(profDept) || (s.department && String(s.department.id) === String(profDept))).map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            )}
          </>
        )}

        <Button type="submit">Create</Button>
      </Form>

      <Table striped>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Room</th>
            <th>Professor</th>
            <th>Duration</th>
            <th>Frequency</th>
            <th>Units</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(c=>(
            <tr key={c.id}>
              <td>{c.code}</td>
              <td>{c.name}</td>
              <td>{c.room_requirement_name || (c.room_requirement || '')}</td>
              <td>{c.allow_any_professor ? ('Any (' + (c.professor_requirement_department_name || '') + ')') : (c.professor_requirement_name || c.professor_requirement || '')}</td>
              <td>{c.duration_minutes || ''}</td>
              <td>{c.frequency_per_week || ''}</td>
              <td>{c.units || ''}</td>
              <td>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={()=>remove(c.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default CoursesScreen;
