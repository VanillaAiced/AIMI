import React, { useState } from 'react';
import { Button, Modal, Alert, Spinner, Card, ListGroup } from 'react-bootstrap';

const AIMISuggestionsModal = ({ show, onHide, onApplySuggestion }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(0);

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/aimi/optimize-schedule/', { headers });
      if (!response.ok) throw new Error('Failed to get suggestions');
      
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error || 'Failed to generate suggestions');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestions?.proposals?.[selectedProposal]) {
      onApplySuggestion(suggestions.proposals[selectedProposal]);
      onHide();
    }
  };

  return (
    <Modal size="lg" show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <img src="/images/aimi-logo.png" alt="AIMI" style={{ height: '24px', width: '24px', marginRight: '8px' }} />
          <span style={{ fontWeight: 'bold' }}>AIMI</span> Schedule Optimization
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!suggestions ? (
          <div className="text-center">
            <p>AIMI will analyze your current schedule and suggest optimizations to:</p>
            <ul className="text-start" style={{ display: 'inline-block' }}>
              <li>Reduce student class vacancies</li>
              <li>Better utilize room capacity</li>
              <li>Reduce gaps between classes</li>
              <li>Avoid very early/late classes</li>
            </ul>
            <div className="mt-3">
              <Button
                variant="primary"
                onClick={handleGetSuggestions}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Analyzing...
                  </>
                ) : (
                  'Get AI Suggestions'
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Alert variant="info">
              <strong>AIMI Analysis:</strong> {suggestions.summary}
            </Alert>

            {suggestions.issues_found?.length > 0 && (
              <div className="mb-3">
                <h6>Issues Found:</h6>
                <ul>
                  {suggestions.issues_found.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {suggestions.proposals?.length > 0 && (
              <div>
                <h6>Proposals ({suggestions.proposals.length})</h6>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {suggestions.proposals.map((proposal, idx) => (
                    <Card
                      key={idx}
                      className="mb-2 cursor-pointer"
                      style={{
                        backgroundColor: selectedProposal === idx ? '#e3f2fd' : 'white',
                        border: selectedProposal === idx ? '2px solid #0066ff' : '1px solid #ddd',
                        cursor: 'pointer'
                      }}
                      onClick={() => setSelectedProposal(idx)}
                    >
                      <Card.Body className="p-3">
                        <strong>{proposal.title}</strong>
                        <p className="mb-2 text-muted small">{proposal.description}</p>
                        <div className="small mb-2">
                          <strong>Expected Benefit:</strong> {proposal.expected_benefit}
                        </div>
                        {proposal.changes?.length > 0 && (
                          <ListGroup variant="flush" className="mt-2">
                            {proposal.changes.slice(0, 2).map((change, i) => (
                              <ListGroup.Item key={i} className="p-2 text-muted small">
                                {change.from} → {change.to}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {suggestions.constraints_noted && (
              <Alert variant="warning" className="mt-3">
                <strong>Constraints:</strong> {suggestions.constraints_noted}
              </Alert>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {suggestions && (
          <Button variant="primary" onClick={handleApply}>
            Apply Proposal {selectedProposal + 1}
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AIMISuggestionsModal;
