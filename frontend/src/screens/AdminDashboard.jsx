import React from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import SetupProgress from '../components/SetupProgress';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const nav = useNavigate();
  return (
    <div>
      <h2>Admin Dashboard</h2>
      <Row className="mt-3">
        <Col md={3}><Card className="p-2"><h6>Departments</h6><Button onClick={()=>nav('/admin/departments')}>Manage</Button></Card></Col>
        <Col md={3}><Card className="p-2"><h6>Buildings & Rooms</h6><Button onClick={()=>nav('/admin/buildings')}>Manage</Button></Card></Col>
        
        <Col md={3}><Card className="p-2"><h6>Academic Resources</h6><Button onClick={()=>nav('/admin/resources')}>Manage</Button></Card></Col>
      </Row>
      <Row className="mt-3">
        <Col md={3}><Card className="p-2"><h6>Schedule Generator</h6><Button onClick={()=>nav('/admin/generator')}>Open</Button></Card></Col>
        <Col md={6}><Card className="p-2"><SetupProgress /></Card></Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
