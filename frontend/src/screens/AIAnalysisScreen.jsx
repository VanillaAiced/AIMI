import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, ListGroup, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../components/NotificationProvider';

const AIAnalysisScreen = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Fetch AI analysis from backend
    const fetchAnalysis = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const headers = {'Content-Type': 'application/json'};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const resp = await fetch('/api/schedule-entries/analyze/', { headers });
        if (resp.ok) {
          const data = await resp.json();
          setAnalysis(data);
        } else {
          let errorMsg = 'Failed to analyze schedule';
          try {
            const errText = await resp.text();
            if (errText) {
              const errJson = JSON.parse(errText);
              if (errJson.detail) errorMsg = errJson.detail;
            }
          } catch (e) {
            // Use default error message
          }
          notify({ text: errorMsg, variant: 'danger' });
          // Still show empty analysis
          setAnalysis({
            efficiency: 0,
            insights: [{
              type: 'warning',
              category: 'Error',
              message: errorMsg,
              impact: 'Cannot perform analysis',
              suggestion: 'Please try again or contact support'
            }]
          });
        }
      } catch (err) {
        notify({ text: `Error: ${err.message}`, variant: 'danger' });
        setAnalysis({
          efficiency: 0,
          insights: [{
            type: 'warning',
            category: 'Error',
            message: err.message,
            impact: 'Cannot perform analysis',
            suggestion: 'Check your connection and try again'
          }]
        });
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Add a small delay to show the loading state
    setTimeout(fetchAnalysis, 1500);
  }, [notify]);

  const handleAcceptSchedule = () => {
    navigate('/export');
  };

  const handleBackToPreview = () => {
    navigate('/schedule-preview');
  };

  const getBadgeVariant = (type) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
      default: return 'secondary';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return 'fa-exclamation-triangle';
      case 'success': return 'fa-check-circle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-circle';
    }
  };

  return (
    <Container className="mt-4">
      <h2>AI-Assisted Schedule Analysis</h2>

      {isAnalyzing ? (
        <Card className="text-center p-5 mt-4 shadow">
          <Card.Body>
            <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} className="mb-3" />
            <h4>Analyzing Your Schedule...</h4>
            <p className="text-muted">Our AI is reviewing your schedule for optimization opportunities</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Alert variant="success" className="mt-3">
            <i className="fas fa-brain"></i> AI Analysis Complete! Overall Efficiency Score: <strong>{analysis.efficiency}%</strong>
          </Alert>

          <Card className="mt-3 shadow">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">AI Insights & Recommendations</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {analysis.insights.map((insight, index) => (
                  <ListGroup.Item key={index} className="mb-2">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="mb-2">
                          <Badge bg={getBadgeVariant(insight.type)} className="me-2">
                            <i className={`fas ${getIcon(insight.type)}`}></i> {insight.category}
                          </Badge>
                        </div>
                        <h6><strong>Finding:</strong></h6>
                        <p className="mb-2">{insight.message}</p>
                        <h6><strong>Impact:</strong></h6>
                        <p className="mb-2 text-muted">{insight.impact}</p>
                        <h6><strong>AI Suggestion:</strong></h6>
                        <p className="mb-0 text-primary">
                          <i className="fas fa-lightbulb"></i> {insight.suggestion}
                        </p>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <Alert variant="info" className="mt-4">
                <i className="fas fa-info-circle"></i> <strong>Note:</strong> These are advisory suggestions.
                You can choose to accept the current schedule or regenerate with adjustments.
              </Alert>

              <div className="d-flex justify-content-between mt-4">
                <Button variant="secondary" onClick={handleBackToPreview}>
                  <i className="fas fa-arrow-left"></i> Back to Preview
                </Button>
                
                <Button variant="success" onClick={handleAcceptSchedule}>
                  <i className="fas fa-check"></i> Accept Schedule & Continue
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
};

export default AIAnalysisScreen;
