import React, { useState } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import CoursesScreen from './CoursesScreen';
import CurriculumScreen from './CurriculumScreen';
import CourseOfferingsScreen from './CourseOfferingsScreen';

const AdminResources = () => {
  const [tab, setTab] = useState('courses');
  return (
    <div>
      <h3>Academic Resources</h3>
      <Tabs activeKey={tab} onSelect={(k)=>setTab(k)} className="mb-3">
        <Tab eventKey="courses" title="Courses"><CoursesScreen/></Tab>
        <Tab eventKey="curricula" title="Curricula"><CurriculumScreen/></Tab>
        <Tab eventKey="offerings" title="Offerings"><CourseOfferingsScreen/></Tab>
      </Tabs>
    </div>
  );
};

export default AdminResources;
