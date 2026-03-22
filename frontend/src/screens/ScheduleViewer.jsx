import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Form, Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AIMISuggestionsModal from '../components/AIMISuggestionsModal';
import AIMIChat from '../components/AIMIChat';
import { apiFetch } from '../apiClient';

const ScheduleViewer = ()=>{
  const navigate = useNavigate();
  const [view, setView] = useState('block');
  const [entries, setEntries] = useState([]);
  
  // Hierarchical Filter States
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubDept, setSelectedSubDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const [profs, setProfs] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [showAIMIModal, setShowAIMIModal] = useState(false);
  const [showAIMIChat, setShowAIMIChat] = useState(false);

  // Initial Data Fetch
  useEffect(()=>{ 
    apiFetch('/api/schedule-entries/').then(r=>r.ok? r.json():[]).then(j=>{
      const data = Array.isArray(j) ? j : (j.results || []);
      setEntries(data);
    }).catch(()=>setEntries([]));

    apiFetch('/api/departments/').then(r=>r.ok? r.json():[]).then(j=>{
      setDepartments(Array.isArray(j) ? j : (j.results || []));
    });

    apiFetch('/api/professors/').then(r=>r.ok? r.json():[]).then(j=>{
      const data = Array.isArray(j) ? j : (j.results || []);
      setProfs(data.sort((a,b)=>String(a.name).localeCompare(String(b.name))));
    });

    apiFetch('/api/rooms/').then(r=>r.ok? r.json():[]).then(j=>{
      const data = Array.isArray(j) ? j : (j.results || []);
      setRooms(data.sort((a,b)=>String(a.name).localeCompare(String(b.name))));
    });
  },[]);

  // Fetch Sub-Departments when Dept changes
  useEffect(() => {
    if (selectedDept) {
      apiFetch(`/api/subdepartments/?department=${selectedDept}`).then(r=>r.ok? r.json():[]).then(j=>{
        setSubDepartments(Array.isArray(j) ? j : (j.results || []));
      });
    } else {
      setSubDepartments([]);
    }
    setSelectedSubDept('');
    setBlocks([]);
    setSelectedId('');
  }, [selectedDept]);

  // Fetch Blocks when Sub-Dept or Year changes
  useEffect(() => {
    if (selectedSubDept) {
      let url = `/api/blocks/?sub_department=${selectedSubDept}`;
      if (selectedYear) url += `&year=${selectedYear}`;
      apiFetch(url).then(r=>r.ok? r.json():[]).then(j=>{
        setBlocks(Array.isArray(j) ? j : (j.results || []));
      });
    } else {
      setBlocks([]);
    }
    setSelectedId('');
  }, [selectedSubDept, selectedYear]);

  const getLabel = (view) => {
    if(view==='block') return 'Block';
    if(view==='prof') return 'Professor';
    if(view==='room') return 'Room';
    return '';
  };

  const filteredEntries = selectedId ? entries.filter(e => {
    if(view === 'block') {
      const blockId = typeof e.block === 'object' ? e.block.id : e.block;
      return blockId == selectedId;
    }
    if(view === 'prof') return e.professor && e.professor.id == selectedId;
    if(view === 'room') return e.room && e.room.id == selectedId;
    return false;
  }) : [];

  const handleApplySuggestion = (proposal) => {
    alert(`Proposal: ${proposal.title}\n\nChanges:\n${proposal.changes?.map(c => `${c.from} → ${c.to}`).join('\n')}`);
  };

  return (<Container className="mt-4">
    <div className="mb-3"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back to Admin</Button></div>
    <h3>Schedule Viewer</h3>
    
    <div className="mb-3">
      <div className="mb-2"><strong>View by:</strong>{' '}
        <Button size="sm" variant={view==='block'? 'primary': 'secondary'} onClick={()=> {setView('block'); setSelectedId('');}} >BLOCK</Button>{' '}
        <Button size="sm" variant={view==='prof'? 'primary': 'secondary'} onClick={()=> {setView('prof'); setSelectedId('');}} >PROFESSOR</Button>{' '}
        <Button size="sm" variant={view==='room'? 'primary': 'secondary'} onClick={()=> {setView('room'); setSelectedId('');}}>ROOM</Button>
      </div>
      
      <div className="bg-light p-3 border rounded">
        {view === 'block' ? (
          <Row className="g-2">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small mb-1 text-muted">Department</Form.Label>
                <Form.Select size="sm" value={selectedDept} onChange={e=>setSelectedDept(e.target.value)}>
                  <option value="">Select Department</option>
                  {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small mb-1 text-muted">Sub-Department</Form.Label>
                <Form.Select size="sm" value={selectedSubDept} onChange={e=>setSelectedSubDept(e.target.value)} disabled={!selectedDept}>
                  <option value="">Select Sub-Department</option>
                  {subDepartments.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small mb-1 text-muted">Year Level</Form.Label>
                <Form.Control 
                  size="sm" 
                  type="number" 
                  placeholder="e.g. 1" 
                  value={selectedYear} 
                  onChange={e=>setSelectedYear(e.target.value)} 
                  disabled={!selectedSubDept}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small mb-1 text-muted">Block</Form.Label>
                <Form.Select size="sm" value={selectedId} onChange={e=>setSelectedId(e.target.value)} disabled={!selectedSubDept}>
                  <option value="">Select Block</option>
                  {blocks.map(b=><option key={b.id} value={b.id}>{b.code || b.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end justify-content-end pb-1">
              <Button size="sm" variant="info" className="me-2" onClick={() => setShowAIMIChat(!showAIMIChat)}>
                <img src="/images/aimi-logo.png" alt="AIMI" style={{ height: '14px', width: '14px', marginRight: '4px' }} />
                Chat
              </Button>
              <Button size="sm" variant="success" onClick={() => setShowAIMIModal(true)}>
                AI-PTIMIZE
              </Button>
            </Col>
          </Row>
        ) : (
          <Row>
            <Col md={6}>
              <Form.Select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="w-100">
                <option value="">Select {getLabel(view)}</option>
                {(view==='prof'? profs : rooms).map(opt=><option key={opt.id} value={opt.id}>{opt.name}</option>)}
              </Form.Select>
            </Col>
            <Col md={6} className="text-end">
              <Button size="sm" variant="info" className="me-2" onClick={() => setShowAIMIChat(!showAIMIChat)}>
                <img src="/images/aimi-logo.png" alt="AIMI" style={{ height: '14px', width: '14px', marginRight: '4px' }} />
                AIMI Chat
              </Button>
              <Button size="sm" variant="success" onClick={() => setShowAIMIModal(true)}>
                ✨ AI-PTIMIZE
              </Button>
            </Col>
          </Row>
        )}
      </div>
    </div>

    {showAIMIChat && (
      <div className="mb-3">
        <AIMIChat />
      </div>
    )}

    {entries.length === 0 && <Alert variant="info">No schedule data available. Generate a schedule in the Admin Dashboard.</Alert>}
    {entries.length > 0 && !selectedId && <Alert variant="warning">Select a {getLabel(view).toLowerCase()} to view their schedule.</Alert>}
    {entries.length > 0 && selectedId && filteredEntries.length === 0 && <Alert variant="warning">No schedule entries for this {getLabel(view).toLowerCase()}.</Alert>}
    
    <Table striped hover size="sm">
      <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Room</th><th>Professor</th></tr></thead>
      <tbody>{filteredEntries.map(e=>(<tr key={e.id}>
        <td>{e.time_slot? e.time_slot.day: '-'}</td>
        <td>{e.time_slot? (e.time_slot.start_time+'-'+e.time_slot.end_time): '-'}</td>
        <td>{e.course? e.course.code: '-'}</td>
        <td>{e.room? e.room.name: '-'}</td>
        <td>{e.professor? e.professor.name: '-'}</td>
      </tr>))}</tbody>
    </Table>

    <AIMISuggestionsModal show={showAIMIModal} onHide={() => setShowAIMIModal(false)} onApplySuggestion={handleApplySuggestion} />
  </Container>);
};
export default ScheduleViewer;
