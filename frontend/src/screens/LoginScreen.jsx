import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const LoginScreen = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();
    // Simple client-side sign-in (no backend). Store minimal user info.
    const user = { email, name: email.split('@')[0] };
    localStorage.setItem('user', JSON.stringify(user));
    if (setUser) setUser(user);
    navigate('/data-input');
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
