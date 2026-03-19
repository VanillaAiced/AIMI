import React, { useEffect, useState } from 'react';
import { ProgressBar, ListGroup } from 'react-bootstrap';

const SetupProgress = ({ onStatus }) => {
  const [counts, setCounts] = useState({ departments:0, buildings:0, timeslots:0, courses:0, offerings:0 });
  useEffect(()=>{
    const load = async ()=>{
      try{
        const [deps, bds, ts, cs, ofs] = await Promise.all([
          fetch('/api/departments/'), fetch('/api/buildings/'), fetch('/api/timeslots/'), fetch('/api/courses/'), fetch('/api/course-offerings/')
        ]);
        const res = {};
        if (deps.ok) res.departments = (await deps.json()).length;
        if (bds.ok) res.buildings = (await bds.json()).length;
        if (ts.ok) res.timeslots = (await ts.json()).length;
        if (cs.ok) res.courses = (await cs.json()).length;
        if (ofs.ok) res.offerings = (await ofs.json()).length;
        setCounts(res);
        if (onStatus) onStatus(res);
      }catch(e){ /* ignore */ }
    };
    load();
  }, [onStatus]);

  const totalItems = 5;
  const have = (counts.departments>0?1:0) + (counts.buildings>0?1:0) + (counts.timeslots>0?1:0) + (counts.courses>0?1:0) + (counts.offerings>0?1:0);
  const pct = Math.round((have/totalItems)*100);

  return (
    <div>
      <h5>Setup Progress</h5>
      <ProgressBar now={pct} label={`${pct}%`} />
      <ListGroup className="mt-2">
        <ListGroup.Item>Departments: {counts.departments}</ListGroup.Item>
        <ListGroup.Item>Buildings: {counts.buildings}</ListGroup.Item>
        <ListGroup.Item>TimeSlots: {counts.timeslots}</ListGroup.Item>
        <ListGroup.Item>Courses: {counts.courses}</ListGroup.Item>
        <ListGroup.Item>Course Offerings: {counts.offerings}</ListGroup.Item>
      </ListGroup>
    </div>
  );
};

export default SetupProgress;
