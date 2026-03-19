import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ReauthScreen = () => {
  const navigate = useNavigate();
  const handleLogin = () => navigate('/login');
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <Card className="p-4 text-center" style={{ maxWidth: 600 }}>
        <h4>Sign in required</h4>
        <p>Your account needs to be re-authenticated to continue. Please sign in again to restore access and permissions.</p>
        <div>
          <Button onClick={handleLogin} variant="primary">Go to Sign In</Button>
        </div>
      </Card>
    </Container>
  );
};

export default ReauthScreen;
