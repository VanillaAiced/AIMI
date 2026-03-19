import React, { useEffect, useState } from 'react';
import { Table, Button, Form } from 'react-bootstrap';

const CourseOfferingsScreen = ()=>{
  const [list,setList]=useState([]);
  const [course,setCourse]=useState('');
  const [block,setBlock]=useState('');
  useEffect(()=>{ fetch('/api/course-offerings/').then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); },[]);
  const add=async (e) => {
    e.preventDefault();
    const resp = await fetch('/api/course-offerings/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ course: { code: course, name: course }, assigned_block: { code: block } }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setList((l) => [...l, data]);
      setCourse('');
      setBlock('');
    }
  };
  return (<div><h3>Course Offerings</h3><Form onSubmit={add}><Form.Control value={course} onChange={e=>setCourse(e.target.value)} placeholder="Course code" required/><Form.Control value={block} onChange={e=>setBlock(e.target.value)} placeholder="Block code" className="mt-2" required/><Button className="mt-2" type="submit">Create</Button></Form><Table striped className="mt-3"><thead><tr><th>Course</th><th>Block</th></tr></thead><tbody>{list.map(o=>(<tr key={o.id}><td>{o.course?o.course.code:o.course}</td><td>{o.assigned_block?o.assigned_block.code:''}</td></tr>))}</tbody></Table></div>);
};
export default CourseOfferingsScreen;
