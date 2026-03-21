import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { useNotification } from '../components/NotificationProvider';

const CurriculumScreen = () => {
  const { notify } = useNotification();
  const ordinal = (n) => {
    const num = Number(n);
    if (isNaN(num)) return n;
    const mod100 = num % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
    switch (num % 10) {
      case 1: return `${num}st`;
      case 2: return `${num}nd`;
      case 3: return `${num}rd`;
      default: return `${num}th`;
    }
  };
  const [curricula, setCurricula] = useState([]);
  const [courses, setCourses] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);

  const [deptId, setDeptId] = useState('');
  const [subdeptId, setSubdeptId] = useState('');
  const [yearSelected, setYearSelected] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      try {
        const [depsR, subsR, curR, blR, coursesR] = await Promise.all([
          fetch('/api/departments/'),
          fetch('/api/subdepartments/'),
          fetch('/api/curricula/'),
          fetch('/api/blocks/'),
          fetch('/api/courses/'),
        ]);
        if (depsR.ok) {
          const dv = await depsR.json();
          setDepartments(Array.isArray(dv) ? dv : (dv.results || []));
        }
        if (subsR.ok) {
          const sv = await subsR.json();
          setSubdepartments(Array.isArray(sv) ? sv : (sv.results || []));
        }
        if (curR.ok) {
          const cv = await curR.json();
          setCurricula(Array.isArray(cv) ? cv : (cv.results || []));
        }
        // year-levels not used; years derived from blocks
        if (blR.ok) {
          const bv = await blR.json();
          setBlocks(Array.isArray(bv) ? bv : (bv.results || []));
        }
        if (coursesR.ok) {
          const cj = await coursesR.json();
          setCourses(Array.isArray(cj) ? cj : (cj.results || []));
        }
      } catch (e) { /* ignore */ }
    };
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!deptId || !subdeptId || yearSelected === '') return;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // ensure a Curriculum exists for this sub-department
    let curriculum = curricula.find(c => c.sub_department === Number(subdeptId) || (c.sub_department && c.sub_department.id === Number(subdeptId)) );
    try {
      if (!curriculum) {
        // create curriculum with a sensible default name
        const resp = await fetch('/api/curricula/', { method: 'POST', headers, body: JSON.stringify({ name: 'Curriculum', sub_department: Number(subdeptId) }) });
        if (!resp.ok) {
          const errMsg = await resp.text();
          notify({ text: `Failed to create curriculum: ${errMsg}`, variant: 'danger' });
          return;
        }
        curriculum = await resp.json();
        setCurricula((c) => [...c, curriculum]);
      }

      // link all blocks for this sub-department+year to the curriculum
      const yearNum = Number(yearSelected);
      const blocksToLink = blocks.filter(b => (b.sub_department === Number(subdeptId) || (b.sub_department && (b.sub_department.id || b.sub_department) === Number(subdeptId))) && Number(b.year) === yearNum).map(b => (typeof b.id === 'number' ? b.id : Number(b.id)));
      if (blocksToLink.length > 0) {
        // update curriculum.blocks via PATCH
        const patch = await fetch(`/api/curricula/${curriculum.id}/`, { method: 'PATCH', headers, body: JSON.stringify({ blocks: blocksToLink }) });
        if (!patch.ok) { 
          const errMsg = await patch.text();
          notify({ text: `Failed to attach blocks to curriculum: ${errMsg}`, variant: 'danger' });
          return;
        }
      }
      setYearSelected('');
      notify({ text: 'Curriculum updated successfully', variant: 'success' });
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
  };

  const handleDelete = async (curriculumId) => {
    if (!window.confirm('Delete this curriculum?')) return;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const r = await fetch(`/api/curricula/${curriculumId}/`, { method: 'DELETE', headers });
      if (r.ok) {
        setCurricula(c => c.filter(x => x.id !== curriculumId));
        notify({ text: 'Curriculum deleted successfully', variant: 'success' });
      } else {
        const errMsg = await r.text();
        notify({ text: `Failed to delete curriculum: ${errMsg}`, variant: 'danger' });
      }
    } catch (e) { 
      notify({ text: `Error: ${e.message}`, variant: 'danger' });
    }
  };

  const handleEdit = async (curr) => {
    // open inline editor
    setEditingCurriculum(curr);
    // prefill editing fields
    const subId = (curr.sub_department && typeof curr.sub_department === 'object') ? curr.sub_department.id : curr.sub_department;
    setEditingDeptId(subId ? (subdepartments.find(s=>s.id===subId)||{}).department : '');
    setEditingSubdeptId(subId || '');
    // prefill year from linked blocks if any
    const cBlockIds = Array.isArray(curr.blocks) ? curr.blocks.map(b => (typeof b === 'number' ? b : (b && b.id ? b.id : null))).filter(Boolean) : [];
    const linkedBlocks = blocks.filter(b => cBlockIds.includes(typeof b.id === 'number' ? b.id : Number(b.id)));
    const years = Array.from(new Set(linkedBlocks.map(b => Number(b.year)))).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
    setEditingYear(years.length?years[0]: '');
  };

  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [editingDeptId, setEditingDeptId] = useState('');
  const [editingSubdeptId, setEditingSubdeptId] = useState('');
  const [editingYear, setEditingYear] = useState('');

  // Courses modal state
  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [showCoursesView, setShowCoursesView] = useState(false);
  const [coursesCurriculum, setCoursesCurriculum] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  const cancelEdit = () => {
    setEditingCurriculum(null);
    setEditingDeptId(''); setEditingSubdeptId(''); setEditingYear('');
  };

  const saveEdit = async () => {
    if (!editingCurriculum) return;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      // find blocks for selected subdept+year
      const yearNum = Number(editingYear);
      const blocksToLink = blocks.filter(b => {
        const bSub = (b.sub_department && typeof b.sub_department === 'object') ? b.sub_department.id : b.sub_department;
        return bSub && editingSubdeptId && Number(bSub) === Number(editingSubdeptId) && Number(b.year) === yearNum;
      }).map(b => (typeof b.id === 'number' ? b.id : Number(b.id)));

      // auto-generate name: SubDeptName + ordinal year
      const sub = subdepartments.find(s=>s.id===Number(editingSubdeptId));
      const newName = sub ? `${sub.name} ${ordinal(yearNum)} Year` : (editingCurriculum.name || 'Curriculum');

      const body = { name: newName, sub_department: Number(editingSubdeptId), blocks: blocksToLink };
      const r = await fetch(`/api/curricula/${editingCurriculum.id}/`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (r.ok) {
        const updated = await r.json();
        setCurricula(list => list.map(x => x.id === updated.id ? updated : x));
        cancelEdit();
      } else {
        console.error('Failed to update curriculum', await r.text());
      }
    } catch (e) { console.error(e); }
  };

  const openCourses = async (curr) => {
    // ensure courses list is loaded (already fetched on page load usually)
    if (!courses || courses.length === 0) {
      try {
        const r = await fetch('/api/courses/');
        if (r.ok) {
          const j = await r.json();
          setCourses(Array.isArray(j) ? j : (j.results || []));
        }
      } catch (e) { /* ignore */ }
    }
    setCoursesCurriculum(curr);
    const courseIds = Array.isArray(curr.courses) ? curr.courses.map(x => (typeof x === 'number' ? x : (x && x.id ? x.id : null))).filter(Boolean) : [];
    setSelectedCourseIds(courseIds);
    // show view-only modal first; user can click Manage to open the add/remove layer
    setShowCoursesView(true);
  };

  const toggleCourse = (id) => {
    setSelectedCourseIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const saveCourses = async () => {
    if (!coursesCurriculum) return;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const r = await fetch(`/api/curricula/${coursesCurriculum.id}/`, { method: 'PATCH', headers, body: JSON.stringify({ courses: selectedCourseIds }) });
      if (r.ok) {
        const updated = await r.json();
        setCurricula(list => list.map(x => x.id === updated.id ? updated : x));
        setShowCoursesModal(false);
        setCoursesCurriculum(null);
        setSelectedCourseIds([]);
      } else {
        console.error('Failed to save curriculum courses', await r.text());
      }
    } catch (e) { console.error(e); }
  };

  const totalUnits = () => {
    if (!selectedCourseIds || selectedCourseIds.length === 0) return 0;
    const byId = {};
    (courses || []).forEach(c => { byId[c.id] = c; });
    return selectedCourseIds.reduce((s, id) => s + (byId[id] ? (Number(byId[id].units) || 0) : 0), 0);
  };

  // helper: subdepartments filtered by selected department
  const subsForDept = deptId ? subdepartments.filter(s => s.department === Number(deptId) || (s.department && s.department.id === Number(deptId))) : [];

  // available curricula and blocks for the selected sub-department
  const curriculaForSub = deptId && subdeptId ? curricula.filter(c => c.sub_department === Number(subdeptId) || (c.sub_department && c.sub_department === Number(subdeptId)) || (c.sub_department && c.sub_department.id === Number(subdeptId))) : curricula.filter(c => c.sub_department === Number(subdeptId) || (c.sub_department && c.sub_department.id === Number(subdeptId)) );
  const curIdsForSub = curriculaForSub.map(c=>c.id);
  // blocks that belong to selected sub-department
  const blocksForSubdept = subdeptId ? blocks.filter(b => b.sub_department === Number(subdeptId) || (b.sub_department && b.sub_department === Number(subdeptId)) || (b.sub_department && b.sub_department.id === Number(subdeptId))) : [];
  const blockIdsForSub = blocksForSubdept.map(b => (typeof b.id === 'number' ? b.id : Number(b.id)));

  // derive available numeric years from blocks in this sub-department
  const yearOptions = Array.from(new Set(blocksForSubdept.map(b => Number(b.year)))).filter(n => !isNaN(n)).sort((a,b)=>a-b);

  // no year-level model used on frontend; years are derived from blocks

  // build display rows: join curricula with their year levels
  const rows = [];
  curricula.forEach(c => {
    // resolve sub-department from curriculum.sub_department (may be id or object)
    const subId = (c.sub_department && typeof c.sub_department === 'object') ? c.sub_department.id : c.sub_department;
    const sub = subdepartments.find(s => s.id === subId) || (c.sub_department && c.sub_department) || null;
    // resolve department from the sub-department object
    let dept = null;
    if (sub) {
      const depId = (sub.department && typeof sub.department === 'object') ? sub.department.id : sub.department;
      dept = departments.find(d => d.id === depId) || null;
    }

    // derive years from blocks that belong to this curriculum's sub-department
    const linkedBlocks = blocks.filter(b => {
      const bSub = (b.sub_department && typeof b.sub_department === 'object') ? b.sub_department.id : b.sub_department;
      return bSub && subId && Number(bSub) === Number(subId);
    });
    if (linkedBlocks.length === 0) {
      rows.push({ curriculum: c, years: [], department: dept, subdepartment: sub });
    } else {
      const years = Array.from(new Set(linkedBlocks.map(b => Number(b.year)))).filter(n=>!isNaN(n)).sort((a,b)=>a-b);
      rows.push({ curriculum: c, years, department: dept, subdepartment: sub });
    }
  });

  return (
    <div>
      <h3>Curricula</h3>
      <Form onSubmit={add} className="mb-3">
        <Row>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Department</Form.Label>
              <Form.Select value={deptId} onChange={e=>{ setDeptId(e.target.value); setSubdeptId(''); }} aria-label="Department">
                <option value="">Select Department</option>
                {departments.map(d=>(<option key={d.id} value={d.id}>{d.name}</option>))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Sub-Department</Form.Label>
              <Form.Select value={subdeptId} onChange={e=>setSubdeptId(e.target.value)} aria-label="Sub-department">
                <option value="">Select Sub-Department</option>
                {subsForDept.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Year Level</Form.Label>
              {yearOptions.length > 0 ? (
                <Form.Select value={yearSelected} onChange={e=>setYearSelected(e.target.value)} required>
                  <option value="">Select Year</option>
                  {yearOptions.map(y=>(<option key={y} value={y}>{ordinal(y)} Year</option>))}
                </Form.Select>
              ) : (
                <Form.Control 
                  type="number" 
                  value={yearSelected} 
                  onChange={e=>setYearSelected(e.target.value)} 
                  placeholder="Enter year (e.g., 1, 2, 3)" 
                  min="1"
                  required
                />
              )}
            </Form.Group>
          </Col>
          <Col md={2} className="d-flex align-items-end">
            <Button type="submit" className="w-100">Create</Button>
          </Col>
        </Row>
      </Form>
      <Modal show={!!editingCurriculum} onHide={cancelEdit} centered>
        <Modal.Header closeButton><Modal.Title>Edit Curriculum</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{ e.preventDefault(); await saveEdit(); }}>
            <Form.Group className="mb-2">
              <Form.Label>Department</Form.Label>
              <Form.Select value={editingDeptId} onChange={e=>{ setEditingDeptId(e.target.value); setEditingSubdeptId(''); }}>
                <option value="">Select Department</option>
                {departments.map(d=>(<option key={d.id} value={d.id}>{d.name}</option>))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Sub-Department</Form.Label>
              <Form.Select value={editingSubdeptId} onChange={e=>setEditingSubdeptId(e.target.value)}>
                <option value="">Select Sub-Department</option>
                {(editingDeptId? subdepartments.filter(s=> (s.department===Number(editingDeptId) || (s.department && s.department.id===Number(editingDeptId)))) : []).map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Year</Form.Label>
              <Form.Select value={editingYear} onChange={e=>setEditingYear(e.target.value)}>
                <option value="">Select Year</option>
                {Array.from(new Set(blocks.filter(b=> (b.sub_department===Number(editingSubdeptId) || (b.sub_department && b.sub_department.id===Number(editingSubdeptId)))).map(b=>Number(b.year)))).filter(n=>!isNaN(n)).sort((a,b)=>a-b).map(y=>(<option key={y} value={y}>{ordinal(y)} Year</option>))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end"><Button type="submit">Save</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      <Table striped>
        <thead><tr><th>Department</th><th>Sub-Department</th><th>Year</th><th>Actions</th></tr></thead>
        <tbody>
          {rows.map((r, idx)=>(
            <tr key={idx}>
              <td>{r.department? (r.department.name || r.department) : ''}</td>
              <td>{r.subdepartment? (r.subdepartment.name || r.subdepartment) : ''}</td>
              <td>{Array.isArray(r.years) && r.years.length ? r.years.map(y=> `${ordinal(y)} Year`).join(', ') : ''}</td>
              <td>
                <button className="btn btn-sm btn-outline-secondary me-2" onClick={()=>openCourses(r.curriculum)}>Courses</button>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>handleEdit(r.curriculum)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>handleDelete(r.curriculum.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showCoursesModal} onHide={()=>{ setShowCoursesModal(false); setCoursesCurriculum(null); setSelectedCourseIds([]); }} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Manage Courses</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-2">Select courses to include in this curriculum.</div>
          <div className="d-flex justify-content-between mb-2">
            <div />
            <div>
              <Button size="sm" variant="outline-secondary" className="me-2" onClick={()=> setSelectedCourseIds((courses||[]).map(c=>c.id))}>Select All</Button>
              <Button size="sm" variant="outline-secondary" onClick={()=> setSelectedCourseIds([])}>Clear</Button>
            </div>
          </div>
          <Table striped>
            <thead><tr><th></th><th>Code</th><th>Name</th><th>Units</th><th></th></tr></thead>
            <tbody>
              {(courses || []).map(c => (
                <tr key={c.id}>
                  <td style={{width:30}}><Form.Check type="checkbox" checked={selectedCourseIds.includes(c.id)} onChange={()=>toggleCourse(c.id)} /></td>
                  <td>{c.code}</td>
                  <td>{c.name}</td>
                  <td>{c.units || 0}</td>
                  <td style={{width:120}}>
                    {selectedCourseIds.includes(c.id) ? (
                      <Button size="sm" variant="outline-danger" onClick={()=>toggleCourse(c.id)}>Remove</Button>
                    ) : (
                      <Button size="sm" variant="outline-primary" onClick={()=>toggleCourse(c.id)}>Add</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          <div className="mt-2 text-end"><strong>Total Units: {totalUnits()}</strong></div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={saveCourses}>Save</Button>
          <Button variant="secondary" onClick={()=>{ setShowCoursesModal(false); setCoursesCurriculum(null); setSelectedCourseIds([]); }}>Cancel</Button>
        </Modal.Footer>
      </Modal>
      
      {/* View-only Courses modal: shows current courses in the curriculum */}
      <Modal show={showCoursesView} onHide={()=>{ setShowCoursesView(false); setCoursesCurriculum(null); setSelectedCourseIds([]); }} centered size="lg">
        <Modal.Header closeButton><Modal.Title>Courses in Curriculum</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-2">These courses are currently assigned to this curriculum.</div>
          <Table striped>
            <thead><tr><th>Code</th><th>Name</th><th>Units</th></tr></thead>
            <tbody>
              {coursesCurriculum && Array.isArray(coursesCurriculum.courses) && coursesCurriculum.courses.length ? (
                coursesCurriculum.courses.map(ci => {
                  // ci may be PK or object
                  const id = typeof ci === 'number' ? ci : (ci && ci.id ? ci.id : null);
                  const courseObj = (courses || []).find(c => c.id === id) || (typeof ci === 'object' ? ci : null);
                  return courseObj ? (
                    <tr key={id}><td>{courseObj.code}</td><td>{courseObj.name}</td><td>{courseObj.units || 0}</td></tr>
                  ) : null;
                })
              ) : (
                <tr><td colSpan={3}>No courses assigned</td></tr>
              )}
            </tbody>
          </Table>
          <div className="mt-2 text-end"><strong>Total Units: {coursesCurriculum ? (Array.isArray(coursesCurriculum.courses) ? coursesCurriculum.courses.reduce((s, ci) => { const id = typeof ci === 'number' ? ci : (ci && ci.id ? ci.id : null); const c = (courses||[]).find(x=>x.id===id); return s + (c ? (Number(c.units)||0) : 0); }, 0) : 0) : 0}</strong></div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={()=>{ setShowCoursesView(false); setShowCoursesModal(true); /* ensure selectedCourseIds already set */ }}>Manage</Button>
          <Button variant="secondary" onClick={()=>{ setShowCoursesView(false); setCoursesCurriculum(null); setSelectedCourseIds([]); }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CurriculumScreen;
