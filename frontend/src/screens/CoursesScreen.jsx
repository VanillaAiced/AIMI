import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal, Row, Col } from 'react-bootstrap';

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
  const [editingCourse, setEditingCourse] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  useEffect(()=>{ (async ()=>{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; try{ const [coursesR, rtR, depsR, subsR] = await Promise.all([ fetch('/api/courses/',{ headers }), fetch('/api/room-types/',{ headers }), fetch('/api/departments/',{ headers }), fetch('/api/subdepartments/',{ headers }) ]);
        const coursesJ = coursesR.ok? await coursesR.json() : [];
        setList(Array.isArray(coursesJ)?coursesJ:(coursesJ.results||[]));
        const rtJ = rtR.ok? await rtR.json() : [];
        setRoomTypes(Array.isArray(rtJ)?rtJ:(rtJ.results||[]));
        const depsJ = depsR.ok? await depsR.json() : [];
        setDepartments(Array.isArray(depsJ)?depsJ:(depsJ.results||[]));
        const subsJ = subsR.ok? await subsR.json() : [];
        setSubdepartments(Array.isArray(subsJ)?subsJ:(subsJ.results||[]));
      }catch(e){} })(); },[]);
  const add = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // supply minimal required fields so backend validation passes
    const payload = {
      code,
      name,
      duration_minutes: Number(duration) || 0,
      frequency_per_week: Number(frequency) || 1,
      units: Number(units) || 0,
      room_requirement: roomRequirement || null,
      // professor requirement: if allowAnyProf true, set professor_requirement=null and allow_any_professor=true
      professor_requirement: allowAnyProf ? null : (profSubdept || null),
      allow_any_professor: !!allowAnyProf,
    };
    const resp = await fetch('/api/courses/', { method: 'POST', headers, body: JSON.stringify(payload) });
    if (resp.ok) {
      const data = await resp.json();
      setList((l) => [...l, data]);
      setCode('');
      setName('');
        setDuration(90); setFrequency(1); setUnits(3); setRoomRequirement(''); setProfDept(''); setProfSubdept(''); setAllowAnyProf(false);
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
  const openEdit = (c) => {
    setEditingCourse(c);
    setShowEditModal(true);
    setCode(c.code||''); setName(c.name||'');
    setDuration(c.duration_minutes||90); setFrequency(c.frequency_per_week||1); setUnits(c.units||0);
    setRoomRequirement(c.room_requirement || (c.room_requirement && c.room_requirement.id) || '');
    // professor requirement may be null or id
    setAllowAnyProf(!!c.allow_any_professor);
    setProfSubdept(c.professor_requirement || (c.professor_requirement && c.professor_requirement.id) || '');
    // infer department from subdepartments list
    const s = subdepartments.find(s=>s.id=== (c.professor_requirement || (c.professor_requirement && c.professor_requirement.id) || null));
    setProfDept(s? s.department : '');
  };

  const saveEdit = async () => {
    if(!editingCourse) return;
    const token = localStorage.getItem('accessToken');
    const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`;
    const payload = {
      code, name,
      duration_minutes: Number(duration)||0,
      frequency_per_week: Number(frequency)||1,
      units: Number(units)||0,
      room_requirement: roomRequirement || null,
      professor_requirement: allowAnyProf? null : (profSubdept || null),
      allow_any_professor: !!allowAnyProf,
    };
    const r = await fetch(`/api/courses/${editingCourse.id}/`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    if(r.ok){ const j = await r.json(); setList(ls=> ls.map(x=> x.id===j.id? j : x)); setShowEditModal(false); setEditingCourse(null); }
    else { try{ console.error('Edit failed', await r.json()); }catch(e){ console.error(e); } }
  };
  return (
    <div>
      <h3>Courses</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Name" className="mb-2" required />
        <Row className="mb-2">
          <Col><Form.Control value={code} onChange={e=>onCodeChange(e.target.value)} placeholder="Code"/></Col>
          <Col md="auto"><Form.Control type="number" value={duration} onChange={e=>setDuration(e.target.value)} placeholder="Duration (min)"/></Col>
          <Col md="auto"><Form.Control type="number" value={frequency} onChange={e=>setFrequency(e.target.value)} placeholder="Freq/wk"/></Col>
          <Col md="auto"><Form.Control type="number" value={units} onChange={e=>setUnits(e.target.value)} placeholder="Units"/></Col>
        </Row>
        <Row className="mb-2">
          <Col md={4}>
            <Form.Select value={roomRequirement} onChange={e=>setRoomRequirement(e.target.value)}>
              <option value="">Room requirement (optional)</option>
              {roomTypes.length === 0 ? (
                <option value="" disabled>No room types defined</option>
              ) : roomTypes.map(r=> (<option key={r.id} value={r.id}>{r.name}</option>))}
            </Form.Select>
          </Col>
          <Col md={6}>
            <Form.Select value={profDept} onChange={e=>{ setProfDept(e.target.value); setProfSubdept(''); setAllowAnyProf(false); }}>
              <option value="">Assign professor from Department (optional)</option>
              {departments.map(d=>(<option key={d.id} value={d.id}>{d.name}</option>))}
            </Form.Select>
            {profDept && (
              <div className="mt-2">
                <Form.Check type="checkbox" id="any-prof" label={`Any professor in department`} checked={allowAnyProf} onChange={e=>{ setAllowAnyProf(e.target.checked); if(e.target.checked) setProfSubdept(''); }} />
                <Form.Select value={profSubdept} onChange={e=>{ setProfSubdept(e.target.value); setAllowAnyProf(false); }} className="mt-1">
                  <option value="">Select Sub-Department (specific)</option>
                  {subdepartments.filter(s=> s.department === Number(profDept) || (s.department && s.department.id === Number(profDept))).map(s=> (<option key={s.id} value={s.id}>{s.name}</option>))}
                </Form.Select>
              </div>
            )}
          </Col>
        </Row>
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Code</th><th>Name</th><th>Room REQ</th><th>Prof REQ</th><th>Dur</th><th>Freq</th><th>Units</th><th></th></tr></thead>
        <tbody>{list.map(c=>(<tr key={c.id}><td>{c.code}</td><td>{c.name}</td><td>{c.room_requirement_name || (c.room_requirement || '')}</td><td>{c.allow_any_professor ? ('Any (' + (c.professor_requirement_department_name || '') + ')') : (c.professor_requirement_name || c.professor_requirement || '')}</td><td>{c.duration_minutes||''}</td><td>{c.frequency_per_week||''}</td><td>{c.units||''}</td><td>
          <Button size="sm" variant="outline-primary" onClick={()=>openEdit(c)} className="me-2">Edit</Button>
        </td></tr>))}</tbody>
      </Table>

      <Modal show={showEditModal} onHide={()=>{ setShowEditModal(false); setEditingCourse(null); }} centered>
        <Modal.Header closeButton><Modal.Title>Edit Course</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control value={name} onChange={e=>setName(e.target.value)}/></Form.Group>
            <Row className="mb-2">
              <Col><Form.Label>Code</Form.Label><Form.Control value={code} onChange={e=>onCodeChange(e.target.value)}/></Col>
              <Col md="auto"><Form.Label>Duration</Form.Label><Form.Control type="number" value={duration} onChange={e=>setDuration(e.target.value)}/></Col>
              <Col md="auto"><Form.Label>Frequency</Form.Label><Form.Control type="number" value={frequency} onChange={e=>setFrequency(e.target.value)}/></Col>
              <Col md="auto"><Form.Label>Units</Form.Label><Form.Control type="number" value={units} onChange={e=>setUnits(e.target.value)}/></Col>
            </Row>
            <Form.Group className="mb-2"><Form.Label>Room requirement</Form.Label>
              <Form.Select value={roomRequirement} onChange={e=>setRoomRequirement(e.target.value)}>
                <option value="">None</option>
                {roomTypes.length === 0 ? (
                  <option value="" disabled>No room types defined</option>
                ) : roomTypes.map(r=>(<option key={r.id} value={r.id}>{r.name}</option>))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2"><Form.Label>Professor Requirement</Form.Label><Form.Select value={profDept} onChange={e=>{ setProfDept(e.target.value); setProfSubdept(''); setAllowAnyProf(false); }}><option value="">Select Department (optional)</option>{departments.map(d=>(<option key={d.id} value={d.id}>{d.name}</option>))}</Form.Select>
            {profDept && (<div className="mt-2"><Form.Check type="checkbox" id="any-prof-edit" label={`Any professor in department`} checked={allowAnyProf} onChange={e=>{ setAllowAnyProf(e.target.checked); if(e.target.checked) setProfSubdept(''); }} /><Form.Select value={profSubdept} onChange={e=>{ setProfSubdept(e.target.value); setAllowAnyProf(false); }} className="mt-1"><option value="">Select Sub-Department (specific)</option>{subdepartments.filter(s=> s.department === Number(profDept) || (s.department && s.department.id === Number(profDept))).map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}</Form.Select></div>)}</Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer><Button onClick={saveEdit}>Save</Button><Button variant="secondary" onClick={()=>{ setShowEditModal(false); setEditingCourse(null); }}>Cancel</Button></Modal.Footer>
      </Modal>
    </div>
  );
};
export default CoursesScreen;
