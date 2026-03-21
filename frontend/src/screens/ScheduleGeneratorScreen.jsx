import React, { useState } from 'react';
import { Button, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import SetupProgress from '../components/SetupProgress';

// disable generate until prerequisites exist

const ScheduleGeneratorScreen = ()=>{
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [running,setRunning]=useState(false);
  const [ready, setReady] = useState(false);
  const onStatus = (counts) => {
    // require core data: courses, buildings, curricula (offerings), and at least one professor
    const ok = counts.courses>0 && counts.buildings>0 && (counts.offerings>0 || counts.curricula>0) && counts.professors>0;
    setReady(ok);
  };
  const run = async ()=>{
    setRunning(true);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {'Content-Type':'application/json'}; if (token) headers['Authorization']=`Bearer ${token}`;
      const resp = await fetch('/api/schedule-entries/generate/', { method:'POST', headers });
      if (resp.ok) {
        notify({ text: 'Schedule generated successfully! Redirecting...', variant: 'success' });
        setTimeout(() => { window.location.href = '/admin/schedule'; }, 1000);
      } else {
        let errorMsg = 'Failed to generate schedule';
        let errText = '';
        try {
          errText = await resp.text();
          const errJson = JSON.parse(errText);
          if (errJson.detail) errorMsg = errJson.detail;
          else if (typeof errJson === 'string') errorMsg = errJson;
        } catch (e) {
          if (errText) errorMsg = errText.substring(0, 150);
        }
        notify({ text: errorMsg, variant: 'danger' });
      }
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
    setRunning(false);
  };
  return (
    <div>
      <Row className="align-items-center mb-3">
        <Col xs="auto"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button></Col>
        <Col><h3 className="text-center mb-0">Schedule Generator</h3></Col>
        <Col xs="auto" />
      </Row>
      <SetupProgress onStatus={onStatus} />
      <div className="mt-3">
        <Button onClick={run} disabled={running || !ready}>{running? 'Running...':'Generate Schedule'}</Button>
        {!ready && <div className="text-muted small mt-2">Generate disabled — please ensure Courses, Buildings, Professors, and Curricula exist.</div>}
      </div>
    </div>
  );
};
export default ScheduleGeneratorScreen;
