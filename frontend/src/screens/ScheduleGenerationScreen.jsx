import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ScheduleGenerationScreen = () => {
  const navigate = useNavigate();

  const handleGenerateSchedule = () => {
    // Redirect to payment before generating
    navigate('/payment');
  };

  return (
    <Container className="mt-5">
      <Card className="text-center p-5 shadow">
        <Card.Body>
          <h2 className="mb-4">Ready to Generate Your Schedule</h2>
          
          <Alert variant="info" className="mb-4">
            <i className="fas fa-info-circle"></i> Your data has been validated and is ready for processing.
          </Alert>

          <div className="mb-4">
            <h5>What happens next:</h5>
            <ul className="text-start" style={{ display: 'inline-block' }}>
              <li>Payment verification via PayPal</li>
              <li>Schedule generation using advanced algorithms</li>
              <li>Conflict detection and resolution</li>
              <li>AI-powered optimization</li>
            </ul>
          </div>

          <Alert variant="warning" className="mb-4">
            <i className="fas fa-lock"></i> Payment is required to proceed with schedule generation.
          </Alert>

          <Button 
            variant="primary" 
            size="lg" 
            onClick={handleGenerateSchedule}
          >
            <i className="fas fa-arrow-right"></i> Proceed to Payment
          </Button>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ScheduleGenerationScreen;
