import React, { useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Form, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';

const DataInputScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjectName, setSubjectName] = useState('');
  const [classCode, setClassCode] = useState('');
  const [blockSection, setBlockSection] = useState('');
  const [subjectUnits, setSubjectUnits] = useState('');
  const [subjectHours, setSubjectHours] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [profName, setProfName] = useState('');
  const [availability, setAvailability] = useState('');
  const [editingProfId, setEditingProfId] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');
  const [roomTypeState, setRoomTypeState] = useState('');
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [sectionName, setSectionName] = useState('');
  const [department, setDepartment] = useState('');
  const [sectionYearLevel, setSectionYearLevel] = useState('');
  const [editingSectionId, setEditingSectionId] = useState(null);
  const { notify } = useNotification();

  const handleValidateData = async () => {
    // Simple validation
    if (subjects.length === 0 || professors.length === 0 || rooms.length === 0 || sections.length === 0) {
      notify({ text: 'Please add at least one entry in each category', variant: 'danger' });
      return;
    }

    const payload = { subjects, professors, rooms, sections };

    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const syncToServer = async () => {
      try {
        // 1) ensure room types exist
        const roomTypes = {};
        for (const r of rooms) {
          const key = (r.type || r.room_type || '').toString();
          if (!key || roomTypes[key]) continue;
          const resp = await fetch('/api/room-types/', { method: 'POST', headers, body: JSON.stringify({ name: key }) });
          if (resp.ok) {
            const json = await resp.json();
            roomTypes[key] = json.id;
          } else {
            // try to find existing
            const list = await fetch(`/api/room-types/?search=${encodeURIComponent(key)}`);
            if (list.ok) {
              const data = await list.json();
              if (data.length && data[0].id) roomTypes[key] = data[0].id;
            }
          }
        }

        // 2) create buildings/rooms
        for (const r of rooms) {
          const body = { name: r.name, capacity: Number(r.capacity) || 0, room_type: roomTypes[r.type || r.room_type] || null };
          await fetch('/api/rooms/', { method: 'POST', headers, body: JSON.stringify(body) });
        }

        // 3) create courses (subjects)
        for (const s of subjects) {
          const body = { name: s.name, code: s.code, units: Number(s.units) || 0, duration_minutes: Number(s.hours) ? Number(s.hours) * 60 : 0, frequency_per_week: 1 };
          await fetch('/api/courses/', { method: 'POST', headers, body: JSON.stringify(body) });
        }

        // 4) create professors
        for (const p of professors) {
          const body = { name: p.name, availability: p.availability || '' };
          await fetch('/api/professors/', { method: 'POST', headers, body: JSON.stringify(body) });
        }

        // 5) create departments/subdepartments/blocks (sections)
        for (const sec of sections) {
          // create department
          const deptResp = await fetch('/api/departments/', { method: 'POST', headers, body: JSON.stringify({ name: sec.department }) });
          let deptId = null;
          if (deptResp.ok) {
            deptId = (await deptResp.json()).id;
          }
          const subResp = await fetch('/api/subdepartments/', { method: 'POST', headers, body: JSON.stringify({ name: sec.department, department: deptId }) });
          let subId = null;
          if (subResp.ok) subId = (await subResp.json()).id;
          await fetch('/api/blocks/', { method: 'POST', headers, body: JSON.stringify({ code: sec.name, sub_department: subId, year: Number(sec.yearLevel) || 1 }) });
        }

        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    };

    try {
      const sync = await syncToServer();
      if (!sync.ok) {
        notify({ text: 'Error syncing to server: ' + sync.error, variant: 'danger' });
        return;
      }

      // persist original payload locally as fallback
      localStorage.setItem('scheduleData', JSON.stringify(payload));
      notify({ text: 'Data validated and synced', variant: 'success' });
      navigate('/schedule-generation');
    } catch (err) {
      notify({ text: 'Error during sync: ' + err.message, variant: 'danger' });
    }
  };

  const addSubject = (e) => {
    e.preventDefault();
    // update if editing
    if (editingSubjectId) {
      setSubjects(subjects.map(s => s.id === editingSubjectId ? {
        ...s,
        name: subjectName,
        code: classCode,
        block: blockSection,
        units: subjectUnits,
        hours: subjectHours
      } : s));
      // reset editing state
      setEditingSubjectId(null);
      setSubjectName('');
      setClassCode('');
      setBlockSection('');
      setSubjectUnits('');
      setSubjectHours('');
      return;
    }

    setSubjects([...subjects, {
      id: Date.now(),
      name: subjectName,
      code: classCode,
      block: blockSection,
      units: subjectUnits,
      hours: subjectHours
    }]);
    setSubjectName('');
    setClassCode('');
    setBlockSection('');
    setSubjectUnits('');
    setSubjectHours('');
  };

  const editSubject = (id) => {
    const s = subjects.find(x => x.id === id);
    if (!s) return;
    setEditingSubjectId(id);
    setSubjectName(s.name || '');
    setClassCode(s.code || '');
    setBlockSection(s.block || '');
    setSubjectUnits(s.units || '');
    setSubjectHours(s.hours || '');
  };

  const deleteSubject = (id) => {
    setSubjects(subjects.filter(s => s.id !== id));
    if (editingSubjectId === id) {
      setEditingSubjectId(null);
      setSubjectName(''); setClassCode(''); setBlockSection(''); setSubjectUnits(''); setSubjectHours('');
    }
  };

  const addProfessor = (e) => {
    e.preventDefault();
    if (editingProfId) {
      setProfessors(professors.map(p => p.id === editingProfId ? {...p, name: profName, availability } : p));
      setEditingProfId(null);
      setProfName(''); setAvailability('');
      return;
    }

    setProfessors([...professors, { id: Date.now(), name: profName, availability }]);
    setProfName(''); setAvailability('');
  };

  const editProfessor = (id) => {
    const p = professors.find(x => x.id === id);
    if (!p) return;
    setEditingProfId(id);
    setProfName(p.name || '');
    setAvailability(p.availability || '');
  };

  const deleteProfessor = (id) => {
    setProfessors(professors.filter(p => p.id !== id));
    if (editingProfId === id) { setEditingProfId(null); setProfName(''); setAvailability(''); }
  };

  const addRoom = (e) => {
    e.preventDefault();
    if (editingRoomId) {
      setRooms(rooms.map(r => r.id === editingRoomId ? {...r, name: roomName, capacity: roomCapacity, type: roomTypeState} : r));
      setEditingRoomId(null);
      setRoomName(''); setRoomCapacity(''); setRoomTypeState('');
      return;
    }

    setRooms([...rooms, { id: Date.now(), name: roomName, capacity: roomCapacity, type: roomTypeState }]);
    setRoomName(''); setRoomCapacity(''); setRoomTypeState('');
  };

  const editRoom = (id) => {
    const r = rooms.find(x => x.id === id);
    if (!r) return;
    setEditingRoomId(id);
    setRoomName(r.name || '');
    setRoomCapacity(r.capacity || '');
    setRoomTypeState(r.type || '');
  };

  const deleteRoom = (id) => {
    setRooms(rooms.filter(r => r.id !== id));
    if (editingRoomId === id) { setEditingRoomId(null); setRoomName(''); setRoomCapacity(''); setRoomTypeState(''); }
  };

  const addSection = (e) => {
    e.preventDefault();
    if (editingSectionId) {
      setSections(sections.map(s => s.id === editingSectionId ? {...s, name: sectionName, department, yearLevel: sectionYearLevel} : s));
      setEditingSectionId(null);
      setSectionName(''); setDepartment(''); setSectionYearLevel('');
      return;
    }

    setSections([...sections, { id: Date.now(), name: sectionName, department, yearLevel: sectionYearLevel }]);
    setSectionName(''); setDepartment(''); setSectionYearLevel('');
  };

  const editSection = (id) => {
    const s = sections.find(x => x.id === id);
    if (!s) return;
    setEditingSectionId(id);
    setSectionName(s.name || '');
    setDepartment(s.department || '');
    setSectionYearLevel(s.yearLevel || '');
  };

  const deleteSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
    if (editingSectionId === id) { setEditingSectionId(null); setSectionName(''); setDepartment(''); setSectionYearLevel(''); }
  };

  return (
    <div style={{ backgroundColor: 'white' }}>
      <Container fluid style={{ padding: '20px', maxWidth: '100%' }}>
        <h2>Data Input Dashboard</h2>
        <p className="text-muted">Fill in the required information needed.</p>
        
        <Card className="mt-3" style={{ backgroundColor: 'white', border: 'none' }}>
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            
            {/* SUBJECTS TAB */}
            <Tab eventKey="subjects" title="Subjects">
              <Row>
                <Col md={6}>
                  <h5>Add Subject</h5>
                  <Form onSubmit={addSubject}>
                    <Form.Group className="mb-2">
                      <Form.Label>Subject Name </Form.Label>
                      <Form.Control 
                        type="text" 
                        name="subjectName" 
                        placeholder="E.G., DATASTALGO" 
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                      <Form.Text className="text-muted">
                        Only uppercase letters will be accepted
                      </Form.Text>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Class Code </Form.Label>
                      <Form.Control 
                        type="text" 
                        name="classCode" 
                        placeholder="e.g., 4655" 
                        value={classCode}
                        onChange={(e) => setClassCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>BLOCK </Form.Label>
                      <Form.Control 
                        type="text" 
                        name="blockSection" 
                        placeholder="e.g., CPE-201" 
                        value={blockSection}
                        onChange={(e) => setBlockSection(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Units</Form.Label>
                      <Form.Control type="number" name="units" value={subjectUnits} onChange={(e)=>setSubjectUnits(e.target.value)} placeholder="e.g., 3" required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Hours per Week</Form.Label>
                      <Form.Control type="number" name="hours" value={subjectHours} onChange={(e)=>setSubjectHours(e.target.value)} placeholder="e.g., 3" required />
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary">{editingSubjectId ? 'Update Subject' : 'Add Subject'}</Button>
                      {editingSubjectId && <Button variant="secondary" onClick={()=>{setEditingSubjectId(null); setSubjectName(''); setClassCode(''); setBlockSection(''); setSubjectUnits(''); setSubjectHours('');}}>Cancel</Button>}
                    </div>
                  </Form>
                </Col>
                <Col md={6}>
                  <h5>Subject List ({subjects.length})</h5>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Block</th>
                        <th>Units</th>
                        <th>Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(sub => (
                        <tr key={sub.id}>
                          <td>{sub.code}</td>
                          <td>{sub.name}</td>
                          <td>{sub.block}</td>
                          <td>{sub.units}</td>
                          <td>{sub.hours}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editSubject(sub.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteSubject(sub.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Tab>

            {/* PROFESSORS TAB */}
            <Tab eventKey="professors" title="Professors">
              <Row>
                <Col md={6}>
                  <h5>Add Professor</h5>
                  <Form onSubmit={addProfessor}>
                    <Form.Group className="mb-2">
                      <Form.Label>Professor Name</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="profName" 
                        placeholder="e.g., DE JESUS, ARNAZ P." 
                        value={profName}
                        onChange={(e) => setProfName(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Availability</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="availability" 
                        placeholder="E.G., MWF 8A-12P, TTH 1P-5P" 
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Professor</Button>
                  </Form>
                </Col>
                <Col md={6}>
                  <h5>Professor List ({professors.length})</h5>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Availability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {professors.map(prof => (
                        <tr key={prof.id}>
                          <td>{prof.name}</td>
                          <td>{prof.availability}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editProfessor(prof.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteProfessor(prof.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Tab>

            {/* ROOMS TAB */}
            <Tab eventKey="rooms" title="Rooms">
              <Row>
                <Col md={6}>
                  <h5>Add Room</h5>
                  <Form onSubmit={addRoom}>
                    <Form.Group className="mb-2">
                      <Form.Label>Room Name </Form.Label>
                      <Form.Control 
                        type="text" 
                        name="roomName" 
                        placeholder="e.g., ROOM 101" 
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Capacity</Form.Label>
                      <Form.Control type="number" name="capacity" value={roomCapacity} onChange={(e)=>setRoomCapacity(e.target.value)} placeholder="e.g., 40" required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Room Type</Form.Label>
                      <Form.Select name="roomType" value={roomTypeState} onChange={(e)=>setRoomTypeState(e.target.value)} required>
                        <option value="">Select type...</option>
                        <option value="LECTURE">LECTURE ROOM</option>
                        <option value="LAB">LABORATORY</option>
                        <option value="CONFERENCE">CONFERENCE ROOM</option>
                      </Form.Select>
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary">{editingRoomId ? 'Update Room' : 'Add Room'}</Button>
                      {editingRoomId && <Button variant="secondary" onClick={()=>{setEditingRoomId(null); setRoomName(''); setRoomCapacity(''); setRoomTypeState('');}}>Cancel</Button>}
                    </div>
                  </Form>
                </Col>
                <Col md={6}>
                  <h5>Room List ({rooms.length})</h5>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Capacity</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map(room => (
                        <tr key={room.id}>
                          <td>{room.name}</td>
                          <td>{room.capacity}</td>
                          <td>{room.type}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editRoom(room.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteRoom(room.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Tab>

            {/* SECTIONS TAB */}
            <Tab eventKey="sections" title="Sections">
              <Row>
                <Col md={6}>
                  <h5>Add Section</h5>
                  <Form onSubmit={addSection}>
                    <Form.Group className="mb-2">
                      <Form.Label>Section Name </Form.Label>
                      <Form.Control 
                        type="text" 
                        name="sectionName" 
                        placeholder="e.g., CPE-201" 
                        value={sectionName}
                        onChange={(e) => setSectionName(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Department</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="department" 
                        placeholder="e.g., COMPUTER ENGINEERING" 
                        value={department}
                        onChange={(e) => setDepartment(e.target.value.toUpperCase())}
                        style={{ textTransform: 'uppercase' }}
                        required 
                      />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Year Level</Form.Label>
                      <Form.Select name="yearLevel" value={sectionYearLevel} onChange={(e)=>setSectionYearLevel(e.target.value)} required>
                        <option value="">Select year...</option>
                        <option value="1">1ST YEAR</option>
                        <option value="2">2ND YEAR</option>
                        <option value="3">3RD YEAR</option>
                        <option value="4">4TH YEAR</option>
                      </Form.Select>
                    </Form.Group>
                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary">{editingSectionId ? 'Update Section' : 'Add Section'}</Button>
                      {editingSectionId && <Button variant="secondary" onClick={()=>{setEditingSectionId(null); setSectionName(''); setDepartment(''); setSectionYearLevel('');}}>Cancel</Button>}
                    </div>
                  </Form>
                </Col>
                <Col md={6}>
                  <h5>Section List ({sections.length})</h5>
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Department</th>
                        <th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map(sec => (
                        <tr key={sec.id}>
                          <td>{sec.name}</td>
                          <td>{sec.department}</td>
                          <td>{sec.yearLevel}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editSection(sec.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteSection(sec.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Tab>
          </Tabs>

          <div className="text-center mt-4">
            <Button variant="success" size="lg" onClick={handleValidateData}>
              Validate Data & Continue
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
    </div>
  );
};

export default DataInputScreen;
