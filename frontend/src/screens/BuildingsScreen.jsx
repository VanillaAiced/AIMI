import React, { useEffect, useState } from 'react';
import { Table, Button, Form, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { apiFetch } from '../apiClient';

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
  const [deletingRoomId, setDeletingRoomId] = useState(null);
  const navigate = useNavigate();
  const { notify } = useNotification();

  useEffect(()=>{
    (async ()=>{
      try{
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if(token) headers['Authorization'] = `Bearer ${token}`;
        const r = await apiFetch('/api/buildings/', { headers });
        if(!r.ok) return;
        const j = await r.json();
        setList(j);
      }catch(e){}
    })();
  },[]);

  // When building list changes, pre-fetch room counts for each building
  useEffect(() => {
    if (!list || !list.length) return setBuildingCounts({});
    (async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const promises = list.map(b => apiFetch(`/api/rooms/?building=${b.id}`, { headers }).then(r => r.ok ? r.json() : []).catch(() => []));
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

  const add = async (e)=>{
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await apiFetch('/api/buildings/', { method: 'POST', headers, body: JSON.stringify({name})});
      if (resp.ok){
        const json = await resp.json();
        setList(list => [...list, json]);
        setBuildingCounts(prev => ({...prev, [json.id]: 0}));
        setName('');
        notify({ text: `Building "${json.name}" created successfully`, variant: 'success' });
      } else {
        let errorMsg = 'Failed to create building';
        try {
          const errText = await resp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              if (errJson.detail) errorMsg = errJson.detail;
              else if (errJson.name) {
                const nameErrors = Array.isArray(errJson.name) ? errJson.name.join(', ') : errJson.name;
                errorMsg = `Name: ${nameErrors}`;
              }
            } catch (parseErr) {
              errorMsg = errText.substring(0, 200);
            }
          }
        } catch (e) {
          errorMsg = `Error: ${e.message}`;
        }
        notify({ text: errorMsg, variant: 'danger' });
      }
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
  };

  const removeBuilding = async (id) => {
    if (!window.confirm('Delete this building?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if(token) headers['Authorization'] = `Bearer ${token}`;
      const resp = await apiFetch(`/api/buildings/${id}/`, {method: 'DELETE', headers});
      if (resp.ok){
        setList(list => list.filter(x => x.id !== id));
        setBuildingCounts(prev => { const copy = {...prev}; delete copy[id]; return copy; });
        notify({ text: 'Building deleted successfully', variant: 'success' });
      } else {
        let errorMsg = 'Failed to delete building';
        try {
          const errText = await resp.text();
          if (errText) {
            try {
              const errJson = JSON.parse(errText);
              if (errJson.detail) errorMsg = errJson.detail;
            } catch (parseErr) {
              errorMsg = errText.substring(0, 200);
            }
          }
        } catch (e) {
          errorMsg = `Error: ${e.message}`;
        }
        notify({ text: errorMsg, variant: 'danger' });
      }
    } catch (err) {
      notify({ text: `Error: ${err.message}`, variant: 'danger' });
    }
  };

  return (
    <div>
      <div className="mb-2">
        <Button size="sm" variant="secondary" onClick={()=>navigate('/admin')}>Back</Button>
      </div>
      <h3>Buildings</h3>
      <Form onSubmit={add} className="mb-3">
        <Form.Group className="mb-2">
          <Form.Label>Building Name</Form.Label>
          <Form.Control
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Enter building name"
            required
          />
        </Form.Group>
        <Button type="submit">Create</Button>
      </Form>

      <Table striped>
        <thead>
          <tr>
            <th>Name</th>
            <th>Rooms</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {list.map(b=>(
            <tr key={b.id}>
              <td>{b.name}</td>
              <td style={{width:100, textAlign: 'center'}}>{buildingCounts[b.id] || 0}</td>
              <td>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={()=>{
                    setSelectedBuilding(b);
                    (async ()=>{
                      try{
                        const token = localStorage.getItem('accessToken');
                        const headers = { 'Content-Type': 'application/json' };
                        if(token) headers['Authorization'] = `Bearer ${token}`;
                        const r = await apiFetch(`/api/rooms/?building=${b.id}`, { headers });
                        if(!r.ok) return setRooms([]);
                        const j = await r.json();
                        const data = Array.isArray(j) ? j : (j.results || j);
                        setRooms(data);
                        setBuildingCounts(prev => ({...prev, [b.id]: (data || []).length}));
                      }catch(e){
                        setRooms([]);
                      }
                    })();
                  }}
                  className="me-2"
                >
                  Manage Rooms
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={()=>removeBuilding(b.id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Rooms Management Modal */}
      <Modal show={!!selectedBuilding} onHide={()=>{ setSelectedBuilding(null); setRooms([]); }} fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>Rooms in {selectedBuilding?.name} <small>({buildingCounts[selectedBuilding?.id] || rooms.length || 0})</small></Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={async (e)=>{
            e.preventDefault();
            try {
              const token = localStorage.getItem('accessToken');
              const headers = { 'Content-Type': 'application/json' };
              if(token) headers['Authorization'] = `Bearer ${token}`;
              const payload = { building: selectedBuilding.id };
              payload.name = roomName || null;
              if (roomNumber) payload.number = parseInt(roomNumber) || null;
              if (roomFloor) payload.floor = parseInt(roomFloor) || null;
              if (roomCapacity) payload.capacity = parseInt(roomCapacity) || null;
              if (roomType) payload.room_type = roomType;
              const resp = await apiFetch('/api/rooms/', { method: 'POST', headers, body: JSON.stringify(payload) });
              if (resp.ok) {
                const j = await resp.json();
                setRooms(r => [...r, j]);
                setBuildingCounts(prev => ({...prev, [selectedBuilding.id]: (prev[selectedBuilding.id] || 0) + 1}));
                setRoomName('');
                setRoomNumber('');
                setRoomFloor('');
                setRoomCapacity('');
                notify({ text: 'Room created successfully', variant: 'success' });
              } else {
                let errorMsg = 'Failed to create room';
                try {
                  const errText = await resp.text();
                  if (errText) {
                    try {
                      const errJson = JSON.parse(errText);
                      if (errJson.detail) errorMsg = errJson.detail;
                    } catch (parseErr) {
                      errorMsg = errText.substring(0, 200);
                    }
                  }
                } catch (e) {
                  errorMsg = `Error: ${e.message}`;
                }
                notify({ text: errorMsg, variant: 'danger' });
              }
            } catch (err) {
              notify({ text: `Error: ${err.message}`, variant: 'danger' });
            }
          }} className="mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Room Name (Auto-generated)</Form.Label>
              <Form.Control value={roomName} readOnly placeholder="Auto-generated from floor + number"/>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Floor</Form.Label>
              <Form.Control value={roomFloor} onChange={e=>setRoomFloor(e.target.value)} type="number" placeholder="e.g., 1"/>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Room Number</Form.Label>
              <Form.Control value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} placeholder="e.g., 5"/>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Capacity</Form.Label>
              <Form.Control value={roomCapacity} onChange={e=>setRoomCapacity(e.target.value)} type="number" placeholder="e.g., 50"/>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Room Type</Form.Label>
              <Form.Select value={roomType} onChange={e=>setRoomType(e.target.value)}>
                <option value="LECTURE">LECTURE</option>
                <option value="LAB">LAB</option>
                <option value="GYM">GYM</option>
              </Form.Select>
            </Form.Group>
            <Button type="submit">Create Room</Button>
          </Form>

          <h5 className="mt-4">Existing Rooms</h5>
          <Table striped>
            <thead>
              <tr>
                <th>Name</th>
                <th>Number</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Type</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(r=>(
                <tr key={r.id}>
                  <td>{r.name || ''}</td>
                  <td>{r.number || ''}</td>
                  <td>{r.floor || ''}</td>
                  <td>{r.capacity || ''}</td>
                  <td>{r.room_type_name || r.type || ''}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={deletingRoomId === r.id}
                      onClick={async ()=>{
                        if(!window.confirm('Delete room?')) return;
                        setDeletingRoomId(r.id);
                        try {
                          console.log('Deleting room:', r.id);
                          const token = localStorage.getItem('accessToken');
                          const headers = { 'Content-Type': 'application/json' };
                          if (token) headers['Authorization'] = `Bearer ${token}`;
                          const resp = await apiFetch(`/api/rooms/${r.id}/`, { method: 'DELETE', headers });
                          console.log('Delete response:', resp.status, resp.ok);
                          if (resp.ok) {
                            setRooms(rs => rs.filter(x => x.id !== r.id));
                            setBuildingCounts(prev => ({...prev, [selectedBuilding.id]: Math.max(0, (prev[selectedBuilding.id] || rooms.length) - 1)}));
                            notify({ text: 'Room deleted successfully', variant: 'success' });
                          } else {
                            let errorMsg = 'Failed to delete room';
                            try {
                              const errText = await resp.text();
                              console.log('Error response text:', errText);
                              if (errText) {
                                try {
                                  const errJson = JSON.parse(errText);
                                  if (errJson.detail) errorMsg = errJson.detail;
                                  else errorMsg = JSON.stringify(errJson);
                                } catch (parseErr) {
                                  errorMsg = errText.substring(0, 200);
                                }
                              }
                            } catch (e) {
                              errorMsg = `Error: ${e.message}`;
                            }
                            console.log('Final error message:', errorMsg);
                            notify({ text: errorMsg, variant: 'danger' });
                          }
                        } catch (err) {
                          console.error('Delete error:', err);
                          notify({ text: `Error: ${err.message}`, variant: 'danger' });
                        } finally {
                          setDeletingRoomId(null);
                        }
                      }}
                    >
                      {deletingRoomId === r.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
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
