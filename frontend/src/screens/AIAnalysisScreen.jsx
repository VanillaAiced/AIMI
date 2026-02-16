import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, ListGroup, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AIAnalysisScreen = () => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysis({
        efficiency: 78,
        insights: [
          {
            type: 'warning',
            category: 'Gap Detection',
            message: 'Long gap detected on TUESDAY between 12P and 2P for Block A',
            impact: 'Students may become fatigued or lose focus',
            suggestion: 'Consider moving the NETWORKS class to fill this gap'
          },
          {
            type: 'info',
            category: 'Workload Balance',
            message: 'Professor DE JESUS, ARNAZ P. has 4 consecutive classes on MONDAY',
            impact: 'Potential teacher fatigue',
            suggestion: 'Distribute classes more evenly across the week'
          },
          {
            type: 'success',
            category: 'Room Utilization',
            message: 'ROOM 101 is well-utilized with 85% occupancy rate',
            impact: 'Efficient use of resources',
            suggestion: 'No changes recommended'
          },
          {
            type: 'warning',
            category: 'Optimization',
            message: 'LAB 202 is underutilized at 45% capacity',
            impact: 'Wasted resource potential',
            suggestion: 'Consider scheduling additional lab sessions in this room'
          },
          {
            type: 'info',
            category: 'Campus Stay',
            message: 'All students meet the 12-hour maximum campus stay requirement',
            impact: 'Complies with institutional policies',
            suggestion: 'No action required'
          }
        ]
      });
      setIsAnalyzing(false);
    }, 3000);
  }, []);

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
