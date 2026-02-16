import React from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const HomeScreen = () => {
  const navigate = useNavigate();

  return (
    <Container className="text-center mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="p-5 shadow-lg">
            <div className="mb-4">
              <img 
                src="/images/AIMI2.png" 
                alt="AIMI Smart Schedule Optimizer" 
                style={{ maxWidth: '400px', width: '100%' }}
              />
            </div>
            <p className="lead mb-4">
              Generate optimized, conflict-free academic schedules with AI-powered insights.
              Streamline your scheduling process with intelligent automation.
            </p>
            <div className="mt-4">
              <Button 
                variant="primary" 
                size="lg" 
                onClick={() => navigate('/login')}
              >
                Start Scheduling
              </Button>
            </div>
          </Card>
          
          <Row className="mt-5 text-start">
            <Col md={4}>
              <Card className="p-3 mb-3">
                <h5><i className="fas fa-upload"></i> Input Data</h5>
                <p>Upload or manually enter subjects, professors, rooms, and sections</p>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="p-3 mb-3">
                <h5><i className="fas fa-calendar-alt"></i> Auto-Generate</h5>
                <p>Our algorithm creates conflict-free schedules optimized for efficiency</p>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="p-3 mb-3">
                <h5><i className="fas fa-brain"></i> AI Analysis</h5>
                <p>Get intelligent recommendations to improve your schedule</p>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default HomeScreen;
