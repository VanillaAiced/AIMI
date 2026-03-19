import React, { useState } from 'react';
import { Tabs, Tab, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import CoursesScreen from './CoursesScreen';
import CurriculumScreen from './CurriculumScreen';
import CourseOfferingsScreen from './CourseOfferingsScreen';

const AdminResources = () => {
  const [tab, setTab] = useState('courses');
  const navigate = useNavigate();
  return (
    <div>
      <Row className="align-items-center mb-3">
        <Col xs="auto"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button></Col>
        <Col><h3 className="text-center mb-0">Academic Resources</h3></Col>
        <Col xs="auto" />
      </Row>
      <Tabs activeKey={tab} onSelect={(k)=>setTab(k)} className="mb-3">
        <Tab eventKey="courses" title="Courses"><CoursesScreen/></Tab>
        <Tab eventKey="curricula" title="Curricula"><CurriculumScreen/></Tab>
        <Tab eventKey="offerings" title="Offerings"><CourseOfferingsScreen/></Tab>
      </Tabs>
    </div>
  );
};

export default AdminResources;
