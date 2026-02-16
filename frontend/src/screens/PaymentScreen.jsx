import React, { useState } from 'react';
import { Container, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const PaymentScreen = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Simulate payment and schedule generation process
    setTimeout(() => {
      // Simulate successful payment
      localStorage.setItem('paymentCompleted', 'true');
      
      // Simulate schedule generation
      setTimeout(() => {
        setIsProcessing(false);
        navigate('/schedule-preview');
      }, 3000);
    }, 2000);
  };

  return (
    <Container className="mt-5">
      <Card className="text-center p-5 shadow">
        <Card.Body>
          {!isProcessing ? (
            <>
              <h2 className="mb-4">Payment Required</h2>
              
              <Alert variant="info" className="mb-4">
                <h5><i className="fas fa-info-circle"></i> Why Payment?</h5>
                <p className="mb-0">
                  Schedule generation requires significant computational resources.
                  Payment ensures access to our advanced algorithms and AI analysis.
                </p>
              </Alert>

              <Card className="mb-4 bg-light">
                <Card.Body>
                  <h4 className="mb-3">Schedule Generation Service</h4>
                  <h2 className="text-primary mb-3">$29.99</h2>
                  <ul className="text-start" style={{ display: 'inline-block' }}>
                    <li>Automated schedule generation</li>
                    <li>Conflict detection & resolution</li>
                    <li>AI-powered optimization</li>
                    <li>Unlimited regenerations (30 days)</li>
                    <li>Export to PDF/CSV</li>
                  </ul>
                </Card.Body>
              </Card>

              <Button 
                variant="primary" 
                size="lg" 
                onClick={handlePayment}
                className="mb-3"
              >
                <i className="fab fa-paypal"></i> Pay with PayPal
              </Button>

              <div className="mt-3">
                <small className="text-muted">
                  <i className="fas fa-lock"></i> Secure payment powered by PayPal
                </small>
              </div>
            </>
          ) : (
            <>
              <Spinner animation="border" variant="primary" className="mb-4" style={{ width: '3rem', height: '3rem' }} />
              <h3 className="mb-3">Processing Payment...</h3>
              <p className="text-muted mb-4">Please wait while we verify your payment and generate your schedule.</p>
              
              <Alert variant="success" className="mb-3">
                <i className="fas fa-check-circle"></i> Payment verified successfully!
              </Alert>
              
              <Spinner animation="border" variant="success" className="mb-3" />
              <p className="text-muted">
                <i className="fas fa-cog fa-spin"></i> Generating optimized schedule...
                <br />
                <small>This may take a few moments</small>
              </p>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default PaymentScreen;
