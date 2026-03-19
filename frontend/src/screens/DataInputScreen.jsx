import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Form, Button, Table, Modal } from 'react-bootstrap';
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
  // Resources UI state
  const [buildingsLocal, setBuildingsLocal] = useState([]);
  const [buildingNameLocal, setBuildingNameLocal] = useState('');
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [roomTypesLocal, setRoomTypesLocal] = useState([]);
  const [roomTypeNameLocal, setRoomTypeNameLocal] = useState('');
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [timeSlotsLocal, setTimeSlotsLocal] = useState([]);
  const [tsDay, setTsDay] = useState('MONDAY');
  const [tsStart, setTsStart] = useState('07:00');
  const [tsEnd, setTsEnd] = useState('08:30');
  const [editingTimeSlotId, setEditingTimeSlotId] = useState(null);
  const [offeringCourseCode, setOfferingCourseCode] = useState('');
  const [offeringBlockCode, setOfferingBlockCode] = useState('');
  const [offeringProfessorName, setOfferingProfessorName] = useState('');
  const [offeringsLocal, setOfferingsLocal] = useState([]);
  const [editingOfferingId, setEditingOfferingId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const { notify } = useNotification();

  // load resources when resources tab is active
  const loadResources = async () => {
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const [bR, rtR, tsR, ofR] = await Promise.all([
        fetch('/api/buildings/', { headers }),
        fetch('/api/room-types/', { headers }),
        fetch('/api/timeslots/', { headers }),
        fetch('/api/course-offerings/', { headers })
      ]);
      if (bR.ok) setBuildingsLocal(await bR.json());
      if (rtR.ok) setRoomTypesLocal(await rtR.json());
      if (tsR.ok) setTimeSlotsLocal(await tsR.json());
      if (ofR.ok) setOfferingsLocal(await ofR.json());
    } catch (err) {
      notify({ text: 'Failed to load resources: ' + err.message, variant: 'danger' });
    }
  };

  useEffect(()=>{
    if (activeTab === 'resources') loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
    setConfirmMessage('Delete subject? This action cannot be undone.');
    setConfirmPayload({ type: 'subject', id });
    setShowConfirm(true);
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
    setConfirmMessage('Delete professor? This action cannot be undone.');
    setConfirmPayload({ type: 'professor', id });
    setShowConfirm(true);
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
    setConfirmMessage('Delete room? This action cannot be undone.');
    setConfirmPayload({ type: 'room', id });
    setShowConfirm(true);
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
    setConfirmMessage('Delete section? This action cannot be undone.');
    setConfirmPayload({ type: 'section', id });
    setShowConfirm(true);
  };

  // Resources handlers
  const addBuildingLocal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // optimistic create/update
    const tmpId = `tmp-${Date.now()}`;
    if (editingBuildingId) {
      const prev = [...buildingsLocal];
      setBuildingsLocal(buildingsLocal.map(b => b.id === editingBuildingId ? { ...b, name: buildingNameLocal } : b));
      setBuildingNameLocal(''); setEditingBuildingId(null);
      try {
        const resp = await fetch(`/api/buildings/${editingBuildingId}/`, { method: 'PATCH', headers, body: JSON.stringify({ name: buildingNameLocal }) });
        if (resp.ok) {
          const json = await resp.json();
          setBuildingsLocal(buildingsLocal.map(b => b.id === json.id ? json : b));
          notify({ text: 'Building updated', variant: 'success' });
        } else {
          setBuildingsLocal(prev);
          notify({ text: 'Failed to update building', variant: 'danger' });
        }
      } catch (err) { setBuildingsLocal(prev); notify({ text: err.message, variant: 'danger' }); }
    } else {
      const tmp = { id: tmpId, name: buildingNameLocal };
      setBuildingsLocal([...buildingsLocal, tmp]);
      setBuildingNameLocal('');
      try {
        const resp = await fetch('/api/buildings/', { method: 'POST', headers, body: JSON.stringify({ name: tmp.name }) });
        if (resp.ok) {
          const json = await resp.json();
          setBuildingsLocal(list => list.map(item => item.id === tmpId ? json : item));
          notify({ text: 'Building created', variant: 'success' });
        } else {
          setBuildingsLocal(list => list.filter(item => item.id !== tmpId));
          notify({ text: 'Failed to create building', variant: 'danger' });
        }
      } catch (err) {
        setBuildingsLocal(list => list.filter(item => item.id !== tmpId));
        notify({ text: err.message, variant: 'danger' });
      }
    }
  };

  const editBuildingLocal = (id) => {
    const b = buildingsLocal.find(x => x.id === id);
    if (!b) return;
    setEditingBuildingId(id);
    setBuildingNameLocal(b.name || '');
  };

  const deleteBuildingLocal = async (id) => {
    setConfirmMessage('Delete building? This action cannot be undone.');
    setConfirmPayload({ type: 'building', id });
    setShowConfirm(true);
  };

  const addRoomTypeLocal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // optimistic create/update
    const tmpId = `tmp-rt-${Date.now()}`;
    if (editingRoomTypeId) {
      const prev = [...roomTypesLocal];
      setRoomTypesLocal(roomTypesLocal.map(r=> r.id===editingRoomTypeId? {...r, name: roomTypeNameLocal}: r));
      setRoomTypeNameLocal(''); setEditingRoomTypeId(null);
      try {
        const resp = await fetch(`/api/room-types/${editingRoomTypeId}/`, { method: 'PATCH', headers, body: JSON.stringify({ name: roomTypeNameLocal }) });
        if (resp.ok) {
          const json = await resp.json();
          setRoomTypesLocal(list => list.map(item => item.id === json.id ? json : item));
          notify({ text: 'Room type updated', variant: 'success' });
        } else { setRoomTypesLocal(prev); notify({ text: 'Failed to update room type', variant: 'danger' }); }
      } catch (err) { setRoomTypesLocal(prev); notify({ text: err.message, variant: 'danger' }); }
    } else {
      const tmp = { id: tmpId, name: roomTypeNameLocal };
      setRoomTypesLocal([...roomTypesLocal, tmp]);
      setRoomTypeNameLocal('');
      try {
        const resp = await fetch('/api/room-types/', { method: 'POST', headers, body: JSON.stringify({ name: tmp.name }) });
        if (resp.ok) {
          const json = await resp.json();
          setRoomTypesLocal(list => list.map(item => item.id === tmpId ? json : item));
          notify({ text: 'Room type created', variant: 'success' });
        } else { setRoomTypesLocal(list => list.filter(i=>i.id!==tmpId)); notify({ text: 'Failed to create room type', variant: 'danger' }); }
      } catch (err) { setRoomTypesLocal(list => list.filter(i=>i.id!==tmpId)); notify({ text: err.message, variant: 'danger' }); }
    }
  };

  const editRoomTypeLocal = (id) => {
    const r = roomTypesLocal.find(x=>x.id===id);
    if (!r) return;
    setEditingRoomTypeId(id);
    setRoomTypeNameLocal(r.name || '');
  };

  const deleteRoomTypeLocal = async (id) => {
    setConfirmMessage('Delete room type? This action cannot be undone.');
    setConfirmPayload({ type: 'roomtype', id });
    setShowConfirm(true);
  };

  const addTimeSlotLocal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // optimistic create/update
    const tmpId = `tmp-ts-${Date.now()}`;
    if (editingTimeSlotId) {
      const prev = [...timeSlotsLocal];
      setTimeSlotsLocal(timeSlotsLocal.map(t=> t.id===editingTimeSlotId? {...t, day: tsDay, start_time: tsStart, end_time: tsEnd}: t));
      setEditingTimeSlotId(null); setTsDay('MONDAY'); setTsStart('07:00'); setTsEnd('08:30');
      try {
        const resp = await fetch(`/api/timeslots/${editingTimeSlotId}/`, { method: 'PATCH', headers, body: JSON.stringify({ day: tsDay, start_time: tsStart, end_time: tsEnd }) });
        if (resp.ok) {
          const json = await resp.json();
          setTimeSlotsLocal(list => list.map(item => item.id === json.id ? json : item));
          notify({ text: 'Timeslot updated', variant: 'success' });
        } else { setTimeSlotsLocal(prev); notify({ text: 'Failed to update timeslot', variant: 'danger' }); }
      } catch (err) { setTimeSlotsLocal(prev); notify({ text: err.message, variant: 'danger' }); }
    } else {
      const tmp = { id: tmpId, day: tsDay, start_time: tsStart, end_time: tsEnd };
      setTimeSlotsLocal([...timeSlotsLocal, tmp]);
      try {
        const resp = await fetch('/api/timeslots/', { method: 'POST', headers, body: JSON.stringify({ day: tmp.day, start_time: tmp.start_time, end_time: tmp.end_time }) });
        if (resp.ok) {
          const json = await resp.json();
          setTimeSlotsLocal(list => list.map(item => item.id === tmpId ? json : item));
          notify({ text: 'Timeslot created', variant: 'success' });
        } else { setTimeSlotsLocal(list => list.filter(i=>i.id!==tmpId)); notify({ text: 'Failed to create timeslot', variant: 'danger' }); }
      } catch (err) { setTimeSlotsLocal(list => list.filter(i=>i.id!==tmpId)); notify({ text: err.message, variant: 'danger' }); }
    }
  };

  const editTimeSlotLocal = (id) => {
    const t = timeSlotsLocal.find(x=>x.id===id);
    if (!t) return;
    setEditingTimeSlotId(id);
    setTsDay(t.day || 'MONDAY'); setTsStart(t.start_time || '07:00'); setTsEnd(t.end_time || '08:30');
  };

  const deleteTimeSlotLocal = async (id) => {
    setConfirmMessage('Delete timeslot? This action cannot be undone.');
    setConfirmPayload({ type: 'timeslot', id });
    setShowConfirm(true);
  };

  const addOfferingLocal = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const payload = { course: { code: offeringCourseCode, name: offeringCourseCode }, assigned_block: { code: offeringBlockCode }, assigned_professor: { name: offeringProfessorName } };
      const tmpId = `tmp-off-${Date.now()}`;
      if (editingOfferingId) {
        const prev = [...offeringsLocal];
        setOfferingsLocal(offeringsLocal.map(o=> o.id===editingOfferingId? {...o, course: { code: offeringCourseCode, name: offeringCourseCode }, assigned_block: { code: offeringBlockCode }, assigned_professor: { name: offeringProfessorName } } : o));
        setEditingOfferingId(null); setOfferingCourseCode(''); setOfferingBlockCode(''); setOfferingProfessorName('');
        try {
          const resp = await fetch(`/api/course-offerings/${editingOfferingId}/`, { method: 'PATCH', headers, body: JSON.stringify(payload) });
          if (resp.ok) {
            const json = await resp.json();
            setOfferingsLocal(list => list.map(item => item.id === json.id ? json : item));
            notify({ text: 'Offering updated', variant: 'success' });
          } else { setOfferingsLocal(prev); const txt = await resp.text(); notify({ text: 'Failed to update offering: ' + txt, variant: 'danger' }); }
        } catch (err) { setOfferingsLocal(prev); notify({ text: err.message, variant: 'danger' }); }
      } else {
        const tmp = { id: tmpId, course: { code: offeringCourseCode, name: offeringCourseCode }, assigned_block: { code: offeringBlockCode }, assigned_professor: { name: offeringProfessorName } };
        setOfferingsLocal([...offeringsLocal, tmp]);
        setOfferingCourseCode(''); setOfferingBlockCode(''); setOfferingProfessorName('');
        try {
          const resp = await fetch('/api/course-offerings/', { method: 'POST', headers, body: JSON.stringify(payload) });
          if (resp.ok) {
            const json = await resp.json();
            setOfferingsLocal(list => list.map(item => item.id === tmpId ? json : item));
            notify({ text: 'Course offering created', variant: 'success' });
          } else { setOfferingsLocal(list => list.filter(i=>i.id!==tmpId)); const txt = await resp.text(); notify({ text: 'Failed to create offering: ' + txt, variant: 'danger' }); }
        } catch (err) { setOfferingsLocal(list => list.filter(i=>i.id!==tmpId)); notify({ text: err.message, variant: 'danger' }); }
      }
    } catch (err) { notify({ text: err.message, variant: 'danger' }); }
  };

  const editOfferingLocal = (id) => {
    const o = offeringsLocal.find(x=>x.id===id);
    if (!o) return;
    setEditingOfferingId(id);
    setOfferingCourseCode((o.course && o.course.code) || '');
    setOfferingBlockCode((o.assigned_block && o.assigned_block.code) || '');
    setOfferingProfessorName((o.assigned_professor && o.assigned_professor.name) || '');
  };

  const deleteOfferingLocal = async (id) => {
    setConfirmMessage('Delete course offering? This action cannot be undone.');
    setConfirmPayload({ type: 'offering', id });
    setShowConfirm(true);
  };

  const performConfirmedDelete = async () => {
    if (!confirmPayload) return setShowConfirm(false);
    const { type, id } = confirmPayload;
    const token = localStorage.getItem('accessToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const prev = {
      buildings: [...buildingsLocal],
      roomTypes: [...roomTypesLocal],
      timeslots: [...timeSlotsLocal],
      offerings: [...offeringsLocal]
    };

    if (type === 'building') setBuildingsLocal(buildingsLocal.filter(b=>b.id!==id));
    if (type === 'roomtype') setRoomTypesLocal(roomTypesLocal.filter(r=>r.id!==id));
    if (type === 'timeslot') setTimeSlotsLocal(timeSlotsLocal.filter(t=>t.id!==id));
    if (type === 'offering') setOfferingsLocal(offeringsLocal.filter(o=>o.id!==id));
    if (type === 'subject') { setSubjects(subjects.filter(s=>s.id!==id)); if (editingSubjectId===id){ setEditingSubjectId(null); setSubjectName(''); setClassCode(''); setBlockSection(''); setSubjectUnits(''); setSubjectHours(''); } }
    if (type === 'professor') { setProfessors(professors.filter(p=>p.id!==id)); if (editingProfId===id){ setEditingProfId(null); setProfName(''); setAvailability(''); } }
    if (type === 'room') { setRooms(rooms.filter(r=>r.id!==id)); if (editingRoomId===id){ setEditingRoomId(null); setRoomName(''); setRoomCapacity(''); setRoomTypeState(''); } }
    if (type === 'section') { setSections(sections.filter(s=>s.id!==id)); if (editingSectionId===id){ setEditingSectionId(null); setSectionName(''); setDepartment(''); setSectionYearLevel(''); } }

    try {
      const urlMap = { building: '/api/buildings/', roomtype: '/api/room-types/', timeslot: '/api/timeslots/', offering: '/api/course-offerings/' };
      // only call server for resources that exist server-side
      if (['building','roomtype','timeslot','offering'].includes(type)){
        const resp = await fetch(urlMap[type] + id + '/', { method: 'DELETE', headers });
        if (resp.ok || resp.status === 204) {
          notify({ text: 'Deleted', variant: 'success' });
        } else {
          setBuildingsLocal(prev.buildings); setRoomTypesLocal(prev.roomTypes); setTimeSlotsLocal(prev.timeslots); setOfferingsLocal(prev.offerings);
          notify({ text: 'Delete failed on server', variant: 'danger' });
        }
      } else {
        // local-only delete (subjects/professors/rooms/sections) — already removed optimistically above
        notify({ text: 'Deleted locally', variant: 'success' });
      }
    } catch (err) {
      setBuildingsLocal(prev.buildings); setRoomTypesLocal(prev.roomTypes); setTimeSlotsLocal(prev.timeslots); setOfferingsLocal(prev.offerings);
      notify({ text: 'Delete failed: ' + err.message, variant: 'danger' });
    } finally {
      setShowConfirm(false); setConfirmPayload(null); setConfirmMessage('');
    }
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

            {/* RESOURCES TAB */}
            <Tab eventKey="resources" title="Resources">
              <Row>
                <Col md={6}>
                  <h5>Buildings</h5>
                  <Form onSubmit={addBuildingLocal} className="mb-3">
                    <Form.Group className="mb-2">
                      <Form.Label>Building Name</Form.Label>
                      <Form.Control type="text" value={buildingNameLocal} onChange={(e)=>setBuildingNameLocal(e.target.value)} placeholder="e.g., MAIN BUILDING" required />
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Building</Button>
                  </Form>
                  <h6>Existing</h6>
                  <Table size="sm" striped>
                    <tbody>
                      {buildingsLocal.map(b=> (
                        <tr key={b.id}>
                          <td>{b.name}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editBuildingLocal(b.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteBuildingLocal(b.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <hr />

                  <h5>Room Types</h5>
                  <Form onSubmit={addRoomTypeLocal} className="mb-3">
                    <Form.Group className="mb-2">
                      <Form.Label>Type Name</Form.Label>
                      <Form.Control type="text" value={roomTypeNameLocal} onChange={(e)=>setRoomTypeNameLocal(e.target.value)} placeholder="e.g., LECTURE" required />
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Room Type</Button>
                  </Form>
                  <Table size="sm" striped>
                    <tbody>
                      {roomTypesLocal.map(rt=> (
                        <tr key={rt.id}>
                          <td>{rt.name}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editRoomTypeLocal(rt.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteRoomTypeLocal(rt.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>

                <Col md={6}>
                  <h5>Time Slots</h5>
                  <Form onSubmit={addTimeSlotLocal} className="mb-3">
                    <Form.Group className="mb-2">
                      <Form.Label>Day</Form.Label>
                      <Form.Select value={tsDay} onChange={(e)=>setTsDay(e.target.value)}>
                        <option value="MONDAY">MONDAY</option>
                        <option value="TUESDAY">TUESDAY</option>
                        <option value="WEDNESDAY">WEDNESDAY</option>
                        <option value="THURSDAY">THURSDAY</option>
                        <option value="FRIDAY">FRIDAY</option>
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control type="time" value={tsStart} onChange={(e)=>setTsStart(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>End Time</Form.Label>
                      <Form.Control type="time" value={tsEnd} onChange={(e)=>setTsEnd(e.target.value)} />
                    </Form.Group>
                    <Button type="submit" variant="primary">Add Time Slot</Button>
                  </Form>
                  <Table size="sm" striped>
                    <thead><tr><th>Day</th><th>Start</th><th>End</th><th></th></tr></thead>
                    <tbody>
                      {timeSlotsLocal.map(ts=> (
                        <tr key={ts.id}>
                          <td>{ts.day}</td>
                          <td>{ts.start_time}</td>
                          <td>{ts.end_time}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editTimeSlotLocal(ts.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteTimeSlotLocal(ts.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <hr />

                  <h5>Course Offerings</h5>
                  <Form onSubmit={addOfferingLocal} className="mb-3">
                    <Form.Group className="mb-2">
                      <Form.Label>Course Code</Form.Label>
                      <Form.Control type="text" value={offeringCourseCode} onChange={(e)=>setOfferingCourseCode(e.target.value.toUpperCase())} placeholder="e.g., DATASTALGO" required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Block Code</Form.Label>
                      <Form.Control type="text" value={offeringBlockCode} onChange={(e)=>setOfferingBlockCode(e.target.value.toUpperCase())} placeholder="e.g., CPE-201" required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Professor (optional)</Form.Label>
                      <Form.Control type="text" value={offeringProfessorName} onChange={(e)=>setOfferingProfessorName(e.target.value.toUpperCase())} placeholder="e.g., DE JESUS" />
                    </Form.Group>
                    <Button type="submit" variant="primary">Create Offering</Button>
                  </Form>
                  <h6 className="mt-3">Offerings</h6>
                  <Table size="sm" striped>
                    <thead><tr><th>Course</th><th>Block</th><th>Professor</th><th></th></tr></thead>
                    <tbody>
                      {offeringsLocal.map(o=> (
                        <tr key={o.id}>
                          <td>{o.course ? o.course.code || o.course.name : ''}</td>
                          <td>{o.assigned_block ? o.assigned_block.code : ''}</td>
                          <td>{o.assigned_professor ? o.assigned_professor.name : ''}</td>
                          <td>
                            <Button size="sm" variant="outline-primary" onClick={()=>editOfferingLocal(o.id)}>Edit</Button>{' '}
                            <Button size="sm" variant="outline-danger" onClick={()=>deleteOfferingLocal(o.id)}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Tab>
          </Tabs>

          <Modal show={showConfirm} onHide={()=>setShowConfirm(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>{confirmMessage}</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={()=>setShowConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={performConfirmedDelete}>Delete</Button>
            </Modal.Footer>
          </Modal>

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
