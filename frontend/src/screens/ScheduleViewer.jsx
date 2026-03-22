import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Form, Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AIMISuggestionsModal from '../components/AIMISuggestionsModal';
import AIMIChat from '../components/AIMIChat';
import { apiFetch } from '../apiClient';

const ScheduleViewer = ()=>{
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  
  // Hierarchical Filter States
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubDept, setSelectedSubDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedId, setSelectedId] = useState('');

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

  const filteredEntries = selectedId ? entries.filter(e => {
    const blockId = typeof e.block === 'object' ? e.block.id : e.block;
    return String(blockId) === String(selectedId);
  }) : [];

  const handleApplySuggestion = (proposal) => {
    alert(`Proposal: ${proposal.title}\n\nChanges:\n${proposal.changes?.map(c => `${c.from} → ${c.to}`).join('\n')}`);
  };

  return (<Container className="mt-4">
    <div className="mb-3"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back to Admin</Button></div>
    <h3>Schedule Viewer</h3>
    
    <div className="mb-4">
      <Row className="g-3 align-items-end">
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small mb-2 fw-bold">Department</Form.Label>
            <Form.Select size="sm" value={selectedDept} onChange={e=>setSelectedDept(e.target.value)}>
              <option value="">Select Department</option>
              {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label className="small mb-2 fw-bold">Sub-Department</Form.Label>
            <Form.Select size="sm" value={selectedSubDept} onChange={e=>setSelectedSubDept(e.target.value)} disabled={!selectedDept}>
              <option value="">Select Sub-Department</option>
              {subDepartments.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2}>
          <Form.Group>
            <Form.Label className="small mb-2 fw-bold">Year Level</Form.Label>
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
            <Form.Label className="small mb-2 fw-bold">Block</Form.Label>
            <Form.Select size="sm" value={selectedId} onChange={e=>setSelectedId(e.target.value)} disabled={!selectedSubDept}>
              <option value="">Select Block</option>
              {blocks.map(b=><option key={b.id} value={b.id}>{b.code || b.name}</option>)}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={2} className="d-flex gap-2">
          <Button size="sm" variant="info" onClick={() => setShowAIMIChat(!showAIMIChat)} title="AIMI Chat">
            <img src="/images/aimi-logo.png" alt="AIMI" style={{ height: '14px', width: '14px', marginRight: '4px' }} />
            CHAT
          </Button>
          <Button size="sm" variant="success" onClick={() => setShowAIMIModal(true)} title="AI-PTIMIZE">
            ✨ PTIMIZE
          </Button>
        </Col>
      </Row>
    </div>

    {showAIMIChat && (
      <div className="mb-3">
        <AIMIChat />
      </div>
    )}

    {entries.length === 0 && <Alert variant="info">No schedule data available. Generate a schedule in the Admin Dashboard.</Alert>}
    {entries.length > 0 && !selectedId && <Alert variant="warning">Select a block to view the schedule.</Alert>}
    {entries.length > 0 && selectedId && filteredEntries.length === 0 && <Alert variant="warning">No schedule entries for this block.</Alert>}
    
    {filteredEntries.length > 0 && (
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
    )}

    <AIMISuggestionsModal show={showAIMIModal} onHide={() => setShowAIMIModal(false)} onApplySuggestion={handleApplySuggestion} />
  </Container>);
};

export default ScheduleViewer;
