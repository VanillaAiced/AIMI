import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';

const RegisterScreen = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotification();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirm) return notify({ text: 'Passwords do not match', variant: 'danger' });
    try {
      const resp = await fetch('/api/auth/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || email, email, password }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        return notify({ text: 'Signup failed: ' + text, variant: 'danger' });
      }
      notify({ text: 'Signup successful — please sign in', variant: 'success' });
      setTimeout(() => navigate('/login'), 700);
    } catch (err) {
      notify({ text: 'Signup error: ' + err.message, variant: 'danger' });
    }
  };

  return (
    <Row className="justify-content-md-center">
      <Col xs={12} md={6}>
        <Card className="p-3">
          <h2>Register</h2>
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
