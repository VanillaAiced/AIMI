import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Row, Col, Modal } from 'react-bootstrap';

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

  useEffect(()=>{ (async ()=>{ const token = localStorage.getItem('accessToken'); const headers = {'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; fetch('/api/buildings/', { headers }).then(r=>r.ok? r.json(): []).then(j=>setList(j)).catch(()=>{}); })(); },[]);

  // Auto-generate room name from floor and number, e.g. floor 3 + number 5 -> "305"
  useEffect(() => {
    if (!roomFloor && !roomNumber) return setRoomName('');
    const floorPart = roomFloor ? String(roomFloor) : '';
    const numberPart = roomNumber ? String(roomNumber).padStart(2, '0') : '';
    setRoomName(floorPart + numberPart);
  }, [roomFloor, roomNumber]);

  const add = async (e)=>{ e.preventDefault(); const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch('/api/buildings/', { method:'POST', headers, body:JSON.stringify({name})}); if (resp.ok){ const json=await resp.json(); setList(list=>[...list,json]); setName(''); } };

  return (
    <div>
      <h3>Buildings</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Control value={name} onChange={(e)=>setName(e.target.value)} placeholder="Building name" required />
        <Button type="submit" className="mt-2">Create</Button>
      </Form>
      <Table striped>
        <thead><tr><th>Name</th><th></th></tr></thead>
        <tbody>{list.map(b=>(<tr key={b.id}><td>{b.name}</td><td>
              <Button size="sm" variant="secondary" disabled={selectedBuilding && selectedBuilding.id!==b.id} onClick={()=>{ setSelectedBuilding(b); (async ()=>{ try{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const r = await fetch(`/api/rooms/?building=${b.id}`, { headers }); if(!r.ok) return setRooms([]); const j = await r.json(); const data = Array.isArray(j)?j:(j.results||j); setRooms(data); setBuildingCounts(prev=>({...prev, [b.id]: (data||[]).length})); }catch(e){ setRooms([]); } })(); }}>Manage Rooms</Button>{' '}
              <Button size="sm" variant="outline-danger" disabled={selectedBuilding && selectedBuilding.id!==b.id} onClick={async ()=>{ const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; await fetch(`/api/buildings/${b.id}/`,{method:'DELETE', headers}); setList(list.filter(x=>x.id!==b.id));}}>Delete</Button>
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
            const resp = await fetch('/api/rooms/', { method: 'POST', headers, body: JSON.stringify(payload) });
            if (resp.ok) {
              const j = await resp.json(); setRooms(r=>[...r,j]); setBuildingCounts(prev=>({...prev, [selectedBuilding.id]: (prev[selectedBuilding.id]||0)+1})); setRoomName(''); setRoomNumber(''); setRoomFloor(''); setRoomCapacity('');
            }
          }} className="mb-3">
            <Row>
              <Col md={4}><Form.Control value={roomName} readOnly placeholder="Auto-generated room name"/></Col>
              <Col md={2}><Form.Control value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} placeholder="Number"/></Col>
              <Col md={2}><Form.Control value={roomFloor} onChange={e=>setRoomFloor(e.target.value)} placeholder="Floor" type="number"/></Col>
              <Col md={2}><Form.Control value={roomCapacity} onChange={e=>setRoomCapacity(e.target.value)} placeholder="Capacity" type="number"/></Col>
              <Col md={2}><Button type="submit">Create Room</Button></Col>
            </Row>
          </Form>
          <Table striped>
            <thead><tr><th>Name</th><th>Number</th><th>Floor</th><th>Capacity</th><th></th></tr></thead>
            <tbody>{rooms.map(r=> (<tr key={r.id}><td>{r.name||''}</td><td>{r.number||''}</td><td>{r.floor||''}</td><td>{r.capacity||''}</td><td><Button size="sm" variant="danger" onClick={async ()=>{ if(!window.confirm('Delete room?')) return; const token = localStorage.getItem('accessToken'); const headers={'Content-Type':'application/json'}; if(token) headers['Authorization']=`Bearer ${token}`; const resp = await fetch(`/api/rooms/${r.id}/`, { method: 'DELETE', headers }); if (resp.ok) { setRooms(rs=>rs.filter(x=>x.id!==r.id)); setBuildingCounts(prev=>({...prev, [selectedBuilding.id]: Math.max(0, (prev[selectedBuilding.id]||rooms.length)-1)})); } }}>Delete</Button></td></tr>))}</tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={()=>{ setSelectedBuilding(null); setRooms([]); }}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default BuildingsScreen;
