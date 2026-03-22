import React, { useEffect, useState } from 'react';
import { Table, Button, Alert, Form, Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AIMISuggestionsModal from '../components/AIMISuggestionsModal';
import AIMIChat from '../components/AIMIChat';
import Loader from '../components/Loader';
import { apiFetch } from '../apiClient';

const ScheduleViewer = ()=>{
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Hierarchical Filter States
  const [departments, setDepartments] = useState([]);
  const [subDepartments, setSubDepartments] = useState([]);
  const [allBlocks, setAllBlocks] = useState([]);
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubDept, setSelectedSubDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const [showAIMIModal, setShowAIMIModal] = useState(false);
  const [showAIMIChat, setShowAIMIChat] = useState(false);

  // Initial Data Fetch
  useEffect(()=>{ 
    setLoading(true);
    Promise.all([
      apiFetch('/api/schedule-entries/').then(r=>r.ok? r.json():[]).then(j=>{
        const data = Array.isArray(j) ? j : (j.results || []);
        setEntries(data);
      }).catch(()=>setEntries([])),
      apiFetch('/api/departments/').then(r=>r.ok? r.json():[]).then(j=>{
        setDepartments(Array.isArray(j) ? j : (j.results || []));
      }),
      apiFetch('/api/subdepartments/').then(r=>r.ok? r.json():[]).then(j=>{
        setSubDepartments(Array.isArray(j) ? j : (j.results || []));
      }),
      apiFetch('/api/blocks/').then(r=>r.ok? r.json():[]).then(j=>{
        setAllBlocks(Array.isArray(j) ? j : (j.results || []));
      })
    ]).finally(() => setLoading(false));
  },[]);

  // Reset sub-dept and year when department changes
  useEffect(() => {
    setSelectedSubDept('');
    setSelectedYear('');
    setSelectedId('');
  }, [selectedDept]);

  // Reset year and block when sub-dept changes
  useEffect(() => {
    setSelectedYear('');
    setSelectedId('');
  }, [selectedSubDept]);

  // Reset block when year changes
  useEffect(() => {
    setSelectedId('');
  }, [selectedYear]);

  // Calculate filtered sub-departments based on selected department
  const filteredSubDepts = selectedDept 
    ? subDepartments.filter(sd => {
        const deptId = sd.department?.id || sd.department;
        return String(deptId) === String(selectedDept);
      })
    : subDepartments;

  // Calculate filtered blocks based on selections
  const filteredBlocks = allBlocks.filter(block => {
    // Filter by department (via sub-department)
    if (selectedDept) {
      const blockSubDeptId = block.sub_department?.id || block.sub_department_id;
      const blockSubDept = subDepartments.find(sd => sd.id === blockSubDeptId);
      if (!blockSubDept) return false;
      const blockDeptId = blockSubDept.department?.id || blockSubDept.department;
      if (String(blockDeptId) !== String(selectedDept)) return false;
    }
    // Filter by sub-department
    if (selectedSubDept) {
      const blockSubDeptId = block.sub_department?.id || block.sub_department_id;
      if (String(blockSubDeptId) !== String(selectedSubDept)) return false;
    }
    // Filter by year
    if (selectedYear) {
      if (parseInt(block.year) !== parseInt(selectedYear)) return false;
    }
    return true;
  });

  // Get unique years from filtered blocks
  const uniqueYears = Array.from(new Set(
    filteredBlocks.filter(b => b.year).map(b => String(b.year))
  )).sort((a, b) => parseInt(a) - parseInt(b));

  // Get block IDs from filtered blocks
  const filteredBlockIds = filteredBlocks.map(b => b.id);

  // Calculate filtered schedule entries based on filtered blocks
  const filteredEntries = entries.filter(e => {
    const blockId = typeof e.block === 'object' ? e.block.id : e.block;
    if (selectedId) {
      return String(blockId) === String(selectedId);
    }
    return filteredBlockIds.length === 0 || filteredBlockIds.includes(blockId);
  });

  const handleApplySuggestion = (proposal) => {
    alert(`Proposal: ${proposal.title}\n\nChanges:\n${proposal.changes?.map(c => `${c.from} → ${c.to}`).join('\n')}`);
  };

  return (<Container className="mt-4">
    <div className="mb-3"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back to Admin</Button></div>
    <h3>Schedule Viewer</h3>
    
    {loading ? (
      <Loader message="Loading schedule data..." />
    ) : (
      <>
        <div className="mb-4">
          <Row className="g-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small mb-2 fw-bold">Department</Form.Label>
                <Form.Select size="sm" value={selectedDept} onChange={e=>setSelectedDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small mb-2 fw-bold">Sub-Department</Form.Label>
                <Form.Select size="sm" value={selectedSubDept} onChange={e=>setSelectedSubDept(e.target.value)}>
                  <option value="">All Sub-Departments</option>
                  {filteredSubDepts.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small mb-2 fw-bold">Year Level</Form.Label>
                <Form.Select 
                  size="sm" 
                  value={selectedYear} 
                  onChange={e=>setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year=><option key={year} value={year}>{year}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small mb-2 fw-bold">Block</Form.Label>
                <Form.Select size="sm" value={selectedId} onChange={e=>setSelectedId(e.target.value)}>
                  <option value="">All Blocks</option>
                  {filteredBlocks.map(b=><option key={b.id} value={b.id}>{b.code || b.name}</option>)}
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
        {entries.length > 0 && filteredEntries.length === 0 && <Alert variant="warning">No schedule entries match your filters.</Alert>}
        
        {filteredEntries.length > 0 && (
          <Table striped hover size="sm">
            <thead><tr><th>Day</th><th>Time</th><th>Course</th><th>Building</th><th>Room</th><th>Professor</th><th>Block</th></tr></thead>
            <tbody>{filteredEntries.map(e=>(<tr key={e.id}>
              <td>{e.time_slot? e.time_slot.day: '-'}</td>
              <td>{e.time_slot? (e.time_slot.start_time+'-'+e.time_slot.end_time): '-'}</td>
              <td>{e.course? e.course.code: '-'}</td>
              <td>{e.building? e.building.name: '-'}</td>
              <td>{e.room? e.room.name: '-'}</td>
              <td>{e.professor? e.professor.name: '-'}</td>
              <td>{typeof e.block === 'object' ? (e.block.code || e.block.name || '-') : '-'}</td>
            </tr>))}</tbody>
          </Table>
        )}

        <AIMISuggestionsModal show={showAIMIModal} onHide={() => setShowAIMIModal(false)} onApplySuggestion={handleApplySuggestion} />
      </>
    )}
  </Container>);
};

export default ScheduleViewer;
