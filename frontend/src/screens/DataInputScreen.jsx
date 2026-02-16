import React, { useState } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Form, Button, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

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
  const [profName, setProfName] = useState('');
  const [availability, setAvailability] = useState('');
  const [roomName, setRoomName] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [department, setDepartment] = useState('');

  const handleValidateData = () => {
    // Simple validation
    if (subjects.length === 0 || professors.length === 0 || rooms.length === 0 || sections.length === 0) {
      alert('Please add at least one entry in each category');
      return;
    }
    // Save data to localStorage for schedule generation
    localStorage.setItem('scheduleData', JSON.stringify({
      subjects,
      professors,
      rooms,
      sections
    }));
    alert('Data validated successfully!');
    navigate('/schedule-generation');
  };

  const addSubject = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSubjects([...subjects, {
      id: Date.now(),
      name: subjectName,
      code: classCode,
      block: blockSection,
      units: formData.get('units'),
      hours: formData.get('hours')
    }]);
    e.target.reset();
    setSubjectName('');
    setClassCode('');
    setBlockSection('');
  };

  const addProfessor = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setProfessors([...professors, {
      id: Date.now(),
      name: profName,
      availability: availability
    }]);
    e.target.reset();
    setProfName('');
    setAvailability('');
  };

  const addRoom = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setRooms([...rooms, {
      id: Date.now(),
      name: roomName,
      capacity: formData.get('capacity'),
      type: formData.get('roomType')
    }]);
    e.target.reset();
    setRoomName('');
  };

  const addSection = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setSections([...sections, {
      id: Date.now(),
      name: sectionName,
      department: department,
      yearLevel: formData.get('yearLevel')
    }]);
    e.target.reset();
    setSectionName('');
    setDepartment('');
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
                      <Form.Control type="number" name="units" placeholder="e.g., 3" required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Hours per Week</Form.Label>
                      <Form.Control type="number" name="hours" placeholder="e.g., 3" required />
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Subject</Button>
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
                      <Form.Control type="number" name="capacity" placeholder="e.g., 40" required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Room Type</Form.Label>
                      <Form.Select name="roomType" required>
                        <option value="">Select type...</option>
                        <option value="LECTURE">LECTURE ROOM</option>
                        <option value="LAB">LABORATORY</option>
                        <option value="CONFERENCE">CONFERENCE ROOM</option>
                      </Form.Select>
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Room</Button>
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
                      <Form.Select name="yearLevel" required>
                        <option value="">Select year...</option>
                        <option value="1">1ST YEAR</option>
                        <option value="2">2ND YEAR</option>
                        <option value="3">3RD YEAR</option>
                        <option value="4">4TH YEAR</option>
                      </Form.Select>
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Section</Button>
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
