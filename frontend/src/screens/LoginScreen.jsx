import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';

const LoginScreen = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { notify } = useNotification();

  const submitHandler = (e) => {
    e.preventDefault();
    (async () => {
      try {
        const resp = await fetch('/api/auth/login/', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password }),
        });
        if (!resp.ok) {
          const text = await resp.text();
          notify({ text: 'Login failed: ' + text, variant: 'danger' });
          return;
        }
        const json = await resp.json();
        const user = { email, name: json.username };
        localStorage.setItem('user', JSON.stringify(user));
        if (setUser) setUser(user);

        if (json.created) {
          notify({ text: 'Account created and signed in as ' + json.username, variant: 'success' });
          // show success briefly then navigate
          setTimeout(() => navigate('/data-input'), 900);
          return;
        }

        notify({ text: 'Signed in as ' + json.username, variant: 'success' });
        setTimeout(() => navigate('/data-input'), 400);
      } catch (err) {
        notify({ text: 'Login error: ' + err.message, variant: 'danger' });
      }
    })();
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

            <Button type="submit" variant="primary" className="mt-3">
              Sign In
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default LoginScreen;
