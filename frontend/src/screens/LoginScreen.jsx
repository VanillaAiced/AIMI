import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';
import { apiFetch } from '../apiClient';

const LoginScreen = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotification();

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      console.log('[LoginScreen] Submitting login for:', email);
      const resp = await apiFetch('/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      console.log('[LoginScreen] Response status:', resp.status);
      if (!resp.ok) {
        const contentType = resp.headers.get('content-type');
        let errorMsg = `Login failed (${resp.status})`;
        try {
          if (contentType?.includes('application/json')) {
            const json = await resp.json();
            console.log('[LoginScreen] Error JSON:', json);
            errorMsg = json.detail || json.message || errorMsg;
          } else {
            const text = await resp.text();
            console.log('[LoginScreen] Error text:', text);
            errorMsg = text || errorMsg;
          }
        } catch (parseErr) {
          console.log('[LoginScreen] Parse error:', parseErr);
        }
        console.log('[LoginScreen] Notifying error:', errorMsg);
        notify({ text: errorMsg, variant: 'danger' });
        return;
      }
      const json = await resp.json();

      // store tokens
      if (json.access) localStorage.setItem('accessToken', json.access);
      if (json.refresh) localStorage.setItem('refreshToken', json.refresh);

      // use authoritative role from server response only
      const serverRole = json.role;
      const user = { email, name: json.username, role: serverRole };
      localStorage.setItem('user', JSON.stringify(user));
      if (setUser) setUser(user);

      if (json.created) {
        notify({ text: 'Account created and signed in as ' + json.username, variant: 'success' });
      } else {
        notify({ text: 'Signed in as ' + json.username, variant: 'success' });
      }

      // Redirect based on authoritative role
      if (serverRole === 'admin') setTimeout(() => navigate('/admin'), 300);
      else if (serverRole === 'professor') setTimeout(() => navigate('/professor'), 300);
      else setTimeout(() => navigate('/student'), 300);
    } catch (err) {
      notify({ text: 'Login error: ' + (err.message || 'Unknown error'), variant: 'danger' });
    }
  };

  return (
    <Row className="justify-content-md-center">
      <Col xs={12} md={6}>
        <Card className="p-3">
          <h2>Sign In</h2>
          <Form onSubmit={submitHandler}>
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

            <div className="d-flex gap-2 mt-3">
              <Button type="submit" variant="primary">
                Sign In
              </Button>
              <Button variant="outline-secondary" onClick={() => navigate('/register')}>
                Sign Up
              </Button>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginScreen;
