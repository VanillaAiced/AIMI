import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const BuildingsScreen = () => {
  const [list, setList] = useState([]);
  const [buildingCounts, setBuildingCounts] = useState({});
  const [name, setName] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomFloor, setRoomFloor] = useState('');
  const [roomCapacity, setRoomCapacity] = useState('');
  const [roomType, setRoomType] = useState('LECTURE');
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const navigate = useNavigate();

  useEffect(()=>{ (async ()=>{ const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; fetch('/api/buildings/', { headers }).then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); })(); },[]);

  // When building list changes, pre-fetch room counts for each building so counts show immediately
  useEffect(() => {
    if (!list || !list.length) return setBuildingCounts({});
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const promises = list.map(b => fetch(`/api/rooms/?building=${b.id}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []));
        const results = await Promise.all(promises);
        const counts = {};
        for (let i = 0; i < list.length; i++) counts[list[i].id] = Array.isArray(results[i]) ? results[i].length : (results[i].results ? results[i].results.length : 0);
        setBuildingCounts(counts);
      } catch (e) {
        // ignore
      }
    })();
  }, [list]);

  // Auto-generate room name from floor and number, e.g. floor 3 + number 5 -> "305"
  useEffect(() => {
    if (!roomFloor && !roomNumber) return setRoomName('');
    const floorPart = roomFloor ? String(roomFloor) : '';
    const numberPart = roomNumber ? String(roomNumber).padStart(2, '0') : '';
    setRoomName(floorPart + numberPart);
  }, [roomFloor, roomNumber]);

  const add = async (e)=>{ e.preventDefault(); const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch('/api/buildings/', { method:'POST', headers, body:JSON.stringify({name})}); if (resp.ok){ const json=await resp.json(); setList(list=>[...list,json]); setBuildingCounts(prev=>({...prev, [json.id]: 0})); setName(''); } };

  return (
    <div>
      <Row className="align-items-center mb-3">
        <Col xs="auto"><Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button></Col>
        <Col><h3 className="text-center mb-0">Buildings</h3></Col>
        <Col xs="auto" />
      </Row>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Building name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th><th>Rooms</th><th></th></tr></thead>
        <tbody>{list.map(b=>(<tr key={b.id}><td>{b.name}</td><td style={{width:100, textAlign:'center'}}>{buildingCounts[b.id]||0}</td><td>
          <Button size="sm" variant="secondary" disabled={selectedBuilding && selectedBuilding.id!==b.id} onClick={()=>{ setSelectedBuilding(b); (async ()=>{ try{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const r = await fetch(`/api/rooms/?building=${b.id}`, { headers }); if(!r.ok) return setRooms([]); const j = await r.json(); const data = Array.isArray(j)?j:(j.results||j); setRooms(data); setBuildingCounts(prev=>({...prev, [b.id]: (data||[]).length})); }catch(e){ setRooms([]); } })(); }}>Manage Rooms</Button>{' '}
          <Button size="sm" variant="outline-danger" disabled={selectedBuilding && selectedBuilding.id!==b.id} onClick={async ()=>{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch(`/api/buildings/${b.id}/`,{method:'DELETE', headers}); if (resp.ok){ setList(list.filter(x=>x.id!==b.id)); setBuildingCounts(prev=>{ const copy={...prev}; delete copy[b.id]; return copy; }); }}}>Delete</Button>{' '}
          <Button size="sm" variant="outline-primary" onClick={()=>{ setEditingBuilding(b); setName(b.name||''); }}>Edit</Button>
        </td></tr>))}</tbody>
      </Table>

      <Modal show={!!selectedBuilding} onHide={()=>{ setSelectedBuilding(null); setRooms([]); }} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Rooms in {selectedBuilding?.name} <small>({buildingCounts[selectedBuilding?.id]||rooms.length||0})</small></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{
            e.preventDefault();
            const token = localStorage.getItem('accessToken');
            const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`;
            const payload = { building: selectedBuilding.id };
            // Ensure name is auto-generated and numeric fields are numbers
            payload.name = roomName || null;
            if (roomNumber) payload.number = parseInt(roomNumber) || null;
            if (roomFloor) payload.floor = parseInt(roomFloor) || null;
            if (roomCapacity) payload.capacity = parseInt(roomCapacity) || null;
            if (roomType) payload.room_type = roomType;
            const resp = await fetch('/api/rooms/', { method: 'POST', headers, body: JSON.stringify(payload) });
            if (resp.ok) {
              const j = await resp.json(); setRooms(r=>[...r,j]); setBuildingCounts(prev=>({...prev, [selectedBuilding.id]: (prev[selectedBuilding.id]||0)+1})); setRoomName(''); setRoomNumber(''); setRoomFloor(''); setRoomCapacity('');
            }
          }} className="mb-3">
            <Row>
              <Col md={4}><Form.Control value={roomName} readOnly placeholder="Auto-generated room name"/></Col>
              <Col md={2}><Form.Control value={roomFloor} onChange={e=>setRoomFloor(e.target.value)} placeholder="Floor" type="number"/></Col>
              <Col md={2}><Form.Control value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} placeholder="Number"/></Col>
              <Col md={2}><Form.Control value={roomCapacity} onChange={e=>setRoomCapacity(e.target.value)} placeholder="Capacity" type="number"/></Col>
              <Col md={2}><Form.Select value={roomType} onChange={e=>setRoomType(e.target.value)}><option value="LECTURE">LECTURE</option><option value="LAB">LAB</option><option value="GYM">GYM</option></Form.Select></Col>
              <Col md={2}><Button type="submit">Create Room</Button></Col>
            </Row>
          </Form>
          <Table striped>
            <thead><tr><th>Name</th><th>Number</th><th>Floor</th><th>Capacity</th><th>Type</th><th></th></tr></thead>
            <tbody>{rooms.map(r=> (
              <tr key={r.id}>
                <td>{r.name||''}</td>
                <td>{r.number||''}</td>
                <td>{r.floor||''}</td>
                <td>{r.capacity||''}</td>
                <td>{r.room_type_name||r.type||''}</td>
                <td>
                  <Button size="sm" variant="outline-primary" onClick={()=>{ setEditingRoom(r); setRoomNumber(r.number||''); setRoomFloor(r.floor||''); setRoomCapacity(r.capacity||''); setRoomType(r.room_type_name||r.type||'LECTURE'); }} style={{marginRight:6}}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={async ()=>{ if(!window.confirm('Delete room?')) return; const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch(`/api/rooms/${r.id}/`, { method: 'DELETE', headers }); if (resp.ok) { setRooms(rs=>rs.filter(x=>x.id!==r.id)); setBuildingCounts(prev=>({...prev, [selectedBuilding.id]: Math.max(0, (prev[selectedBuilding.id]||rooms.length)-1)})); } }}>Delete</Button>
                </td>
              </tr>
            ))}</tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>{ setSelectedBuilding(null); setRooms([]); }}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Building edit modal */}
      <Modal show={!!editingBuilding} onHide={()=>{ setEditingBuilding(null); setName(''); }} centered>
        <Modal.Header closeButton><Modal.Title>Edit Building</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{ e.preventDefault(); const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch(`/api/buildings/${editingBuilding.id}/`, { method: 'PATCH', headers, body: JSON.stringify({name}) }); if (resp.ok){ const j = await resp.json(); setList(ls=>ls.map(x=> x.id===j.id?j:x)); setEditingBuilding(null); setName(''); } }}>
            <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control value={name} onChange={e=>setName(e.target.value)} required/></Form.Group>
            <div className="d-flex justify-content-end"><Button type="submit">Save</Button></div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Room edit modal */}
      <Modal show={!!editingRoom} onHide={()=>{ setEditingRoom(null); setRoomNumber(''); setRoomFloor(''); setRoomCapacity(''); setRoomType('LECTURE'); }} centered>
        <Modal.Header closeButton><Modal.Title>Edit Room</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{ e.preventDefault(); const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const payload = {}; payload.number = roomNumber?parseInt(roomNumber):null; payload.floor = roomFloor?parseInt(roomFloor):null; payload.capacity = roomCapacity?parseInt(roomCapacity):null; payload.room_type = roomType||null; payload.name = (roomFloor || roomNumber) ? String(roomFloor)+String(roomNumber).padStart(2,'0') : editingRoom.name; const resp = await fetch(`/api/rooms/${editingRoom.id}/`, { method: 'PATCH', headers, body: JSON.stringify(payload) }); if (resp.ok){ const j = await resp.json(); setRooms(rs=>rs.map(x=> x.id===j.id?j:x)); setEditingRoom(null); setBuildingCounts(prev=>({...prev, [selectedBuilding.id]: prev[selectedBuilding.id]||rooms.length})); } }}>
            <Form.Group className="mb-2"><Form.Label>Floor</Form.Label><Form.Control value={roomFloor} onChange={e=>setRoomFloor(e.target.value)} type="number" /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Number</Form.Label><Form.Control value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Capacity</Form.Label><Form.Control value={roomCapacity} onChange={e=>setRoomCapacity(e.target.value)} type="number" /></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Type</Form.Label><Form.Select value={roomType} onChange={e=>setRoomType(e.target.value)}><option value="LECTURE">LECTURE</option><option value="LAB">LAB</option><option value="GYM">GYM</option></Form.Select></Form.Group>
            <div className="d-flex justify-content-end"><Button type="submit">Save</Button></div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BuildingsScreen;
