import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';

const RegisterScreen = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('student');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Student/Professor specific fields
  const [departments, setDepartments] = useState([]);
  const [subdepartments, setSubdepartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [department, setDepartment] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [yearLevel, setYearLevel] = useState('1');
  const [blockCode, setBlockCode] = useState('');
  const maxUnits = 28;
  const navigate = useNavigate();
  const { notify } = useNotification();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirm) return notify({ text: 'Passwords do not match', variant: 'danger' });
    try {
      const payload = { username: username || email, email, password, role };
      if (role === 'student') {
        payload.department = department;
        payload.sub_department = subDepartment;
        payload.year = yearLevel;
        payload.block = blockCode;
        payload.max_units = maxUnits;
      } else if (role === 'professor') {
        payload.department = department;
        payload.sub_department = subDepartment;
      }

      const resp = await fetch('/api/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text();
        return notify({ text: 'Signup failed: ' + text, variant: 'danger' });
      }
      const json = await resp.json();
      // store tokens and set user
      if (json.access) localStorage.setItem('accessToken', json.access);
      if (json.refresh) localStorage.setItem('refreshToken', json.refresh);
      // use authoritative role returned by server
      const serverRole = json.role;
      const user = { email, name: json.username, role: serverRole };
      localStorage.setItem('user', JSON.stringify(user));
      if (setUser) setUser(user);
      notify({ text: 'Signup successful — signed in as ' + json.username, variant: 'success' });
      // Redirect based on authoritative role
      if (serverRole === 'admin') setTimeout(() => navigate('/admin'), 700);
      else if (serverRole === 'professor') setTimeout(() => navigate('/professor'), 700);
      else setTimeout(() => navigate('/student'), 700);
    } catch (err) {
      notify({ text: 'Signup error: ' + err.message, variant: 'danger' });
    }
  };

    // Load departments on mount; load subdepartments/blocks on selection
    React.useEffect(() => {
      (async () => {
        try {
          const token = localStorage.getItem('accessToken');
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          const dresp = await fetch('/api/departments/', { headers });
          if (dresp.ok) setDepartments(await dresp.json());
        } catch (e) {
          // ignore; departments optional for local setups
        }
      })();
    }, []);

    React.useEffect(() => {
      (async () => {
        try {
          if (!department) return setSubdepartments([]);
          const headers = { 'Content-Type': 'application/json' };
          const sresp = await fetch(`/api/subdepartments/?department=${encodeURIComponent(department)}`, { headers });
          if (sresp.ok) setSubdepartments(await sresp.json());
        } catch (e) {
          setSubdepartments([]);
        }
      })();
    }, [department]);

    React.useEffect(() => {
      (async () => {
        try {
          if (!subDepartment) return setBlocks([]);
          const headers = { 'Content-Type': 'application/json' };
          const bresp = await fetch(`/api/blocks/?sub_department=${encodeURIComponent(subDepartment)}`, { headers });
          if (bresp.ok) setBlocks(await bresp.json());
        } catch (e) {
          setBlocks([]);
        }
      })();
    }, [subDepartment]);

  return (
    <Row className="justify-content-md-center">
      <Col xs={12} md={6}>
        <Card className="p-3">
          <h2>Register</h2>
          <Form onSubmit={submitHandler}>
            <Form.Group className="my-2">
                <Form.Label>User Type</Form.Label>
                <Form.Select value={role} onChange={(e)=>setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="professor">Professor</option>
                  <option value="admin">Admin</option>
                </Form.Select>
            </Form.Group>

              {role === 'student' && (
                <>
                  <Form.Group className="my-2">
                    <Form.Label>Department</Form.Label>
                    <Form.Select value={department} onChange={(e)=>setDepartment(e.target.value)}>
                      <option value="">-- Select Department --</option>
                      {departments.map(d=> <option key={d.id} value={d.name}>{d.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="my-2">
                    <Form.Label>Sub-Department</Form.Label>
                    <Form.Select value={subDepartment} onChange={(e)=>setSubDepartment(e.target.value)}>
                      <option value="">-- Select Sub-Department --</option>
                      {subdepartments.map(s=> <option key={s.id} value={s.name}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="my-2">
                    <Form.Label>Year Level</Form.Label>
                    <Form.Select value={yearLevel} onChange={(e)=>setYearLevel(e.target.value)}>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="my-2">
                    <Form.Label>Block</Form.Label>
                    <Form.Select value={blockCode} onChange={(e)=>setBlockCode(e.target.value)}>
                      <option value="">-- Select Block --</option>
                      {blocks.map(b=> <option key={b.id} value={b.code}>{b.code}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="my-2">
                    <Form.Label>Max Units</Form.Label>
                    <Form.Control readOnly value={maxUnits} />
                  </Form.Group>
                </>
              )}

              {role === 'professor' && (
                <>
                  <Form.Group className="my-2">
                    <Form.Label>Department</Form.Label>
                    <Form.Select value={department} onChange={(e)=>setDepartment(e.target.value)}>
                      <option value="">-- Select Department --</option>
                      {departments.map(d=> <option key={d.id} value={d.name}>{d.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="my-2">
                    <Form.Label>Sub-Department</Form.Label>
                    <Form.Select value={subDepartment} onChange={(e)=>setSubDepartment(e.target.value)}>
                      <option value="">-- Select Sub-Department --</option>
                      {subdepartments.map(s=> <option key={s.id} value={s.name}>{s.name}</option>)}
                    </Form.Select>
                  </Form.Group>
                </>
              )}
            <Form.Group controlId="email" className="my-2">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="username" className="my-2">
              <Form.Label>Username (optional)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Form.Group>

            <Form.Group controlId="password" className="my-2">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="confirm" className="my-2">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="mt-3">
              Register
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default RegisterScreen;
