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
    console.log('Fetching schedule entries...');
    Promise.all([
      apiFetch('/api/schedule-entries/').then(r=>{
        console.log('Schedule entries response:', r.status, r.ok);
        return r.ok? r.json():[]; 
      }).then(j=>{
        console.log('Schedule entries data:', j);
        const data = Array.isArray(j) ? j : (j.results || []);
        setEntries(data);
      }).catch(e=>{
        console.error('Error fetching schedule entries:', e);
        setEntries([]);
      }),
      apiFetch('/api/departments/').then(r=>{
        console.log('Departments response:', r.status, r.ok);
        return r.ok? r.json():[]; 
      }).then(j=>{
        const data = Array.isArray(j) ? j : (j.results || []);
        setDepartments(data);
      }).catch(e=>{
        console.error('Error fetching departments:', e);
        setDepartments([]);
      }),
      apiFetch('/api/subdepartments/').then(r=>{
        console.log('SubDepartments response:', r.status, r.ok);
        return r.ok? r.json():[]; 
      }).then(j=>{
        const data = Array.isArray(j) ? j : (j.results || []);
        setSubDepartments(data);
      }).catch(e=>{
        console.error('Error fetching subdepartments:', e);
        setSubDepartments([]);
      }),
      apiFetch('/api/blocks/').then(r=>{
        console.log('Blocks response:', r.status, r.ok);
        return r.ok? r.json():[]; 
      }).then(j=>{
        const data = Array.isArray(j) ? j : (j.results || []);
        setAllBlocks(data);
      }).catch(e=>{
        console.error('Error fetching blocks:', e);
        setAllBlocks([]);
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
  const filteredBlocks = selectedSubDept
    ? allBlocks.filter(block => {
        const blockSubDeptId = block.sub_department?.id || block.sub_department_id || block.sub_department;
        const blockSubDeptDisplay = block.sub_department_display?.id || block.sub_department_display;
        const effectiveSubDeptId = blockSubDeptId || blockSubDeptDisplay;
        if (String(effectiveSubDeptId) !== String(selectedSubDept)) return false;
        if (selectedYear) {
          if (parseInt(block.year) !== parseInt(selectedYear)) return false;
        }
        return true;
      })
    : [];

  // Get unique years from filtered blocks (only if sub-dept selected)
  const uniqueYears = selectedSubDept
    ? Array.from(new Set(
        allBlocks
          .filter(b => {
            const bSubDeptId = b.sub_department?.id || b.sub_department_id || b.sub_department;
            const bSubDeptDisplay = b.sub_department_display?.id || b.sub_department_display;
            const effectiveSubDeptId = bSubDeptId || bSubDeptDisplay;
            return String(effectiveSubDeptId) === String(selectedSubDept) && b.year;
          })
          .map(b => String(b.year))
      )).sort((a, b) => parseInt(a) - parseInt(b))
    : [];

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
                  disabled={!selectedSubDept}
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year=><option key={year} value={year}>{year}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small mb-2 fw-bold">Block</Form.Label>
                <Form.Select 
                  size="sm" 
                  value={selectedId} 
                  onChange={e=>setSelectedId(e.target.value)}
                  disabled={!selectedYear}
                >
                  <option value="">All Blocks</option>
                  {filteredBlocks.map(b=>{
                    const subDeptName = b.sub_department_display?.name || (typeof b.sub_department === 'object' ? b.sub_department.name : '');
                    return <option key={b.id} value={b.id}>{b.code} {subDeptName ? `- ${subDeptName}` : ''}</option>;
                  })}
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
              <td>{typeof e.block === 'object' ? (e.block.code ? (e.block.sub_department ? `${e.block.code} - ${e.block.sub_department}` : e.block.code) : '-') : '-'}</td>
            </tr>))}</tbody>
          </Table>
        )}

        <AIMISuggestionsModal show={showAIMIModal} onHide={() => setShowAIMIModal(false)} onApplySuggestion={handleApplySuggestion} />
      </>
    )}
  </Container>);
};

export default ScheduleViewer;
