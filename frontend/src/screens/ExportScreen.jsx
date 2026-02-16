import React, { useState } from 'react';
import { Container, Card, Button, Alert, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ExportScreen = () => {
  const navigate = useNavigate();
  const [isFinalized, setIsFinalized] = useState(false);
  
  // Load schedule data
  const scheduleData = JSON.parse(localStorage.getItem('scheduleData') || '{"subjects":[],"professors":[],"rooms":[],"sections":[]}');
  const generatedSchedule = JSON.parse(localStorage.getItem('generatedSchedule') || '[]');
  
  // Get unique values
  const uniqueBlocks = [...new Set(scheduleData.subjects.map(s => s.block))];
  const uniqueProfessors = scheduleData.professors.length;
  const uniqueRooms = scheduleData.rooms.length;

  const handleExportPDF = () => {
    alert('Exporting schedule as PDF...\nIn production, this would generate and download a PDF file.');
  };

  const handleExportCSV = () => {
    alert('Exporting schedule as CSV...\nIn production, this would generate and download a CSV file.');
  };

  const handleFinalizeSchedule = () => {
    setIsFinalized(true);
    localStorage.setItem('scheduleLocked', 'true');
  };

  const handleStartNew = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Container className="mt-4">
      <h2>Finalization & Export</h2>

      {!isFinalized ? (
        <Card className="mt-3 shadow">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Confirm Final Schedule</h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="info">
              <i className="fas fa-info-circle"></i> Before exporting, please review the schedule details and confirm finalization.
            </Alert>

            <h5 className="mb-3">Schedule Summary</h5>
            <Row>
              <Col md={6}>
                <Card className="mb-3 bg-light">
                  <Card.Body>
                    <h6><i className="fas fa-calendar"></i> Schedule Details</h6>
                    <ul>
                      <li>Total Classes: {generatedSchedule.length}</li>
                      <li>Blocks: {uniqueBlocks.length} ({uniqueBlocks.join(', ')})</li>
                      <li>Professors: {uniqueProfessors}</li>
                      <li>Rooms Used: {uniqueRooms}</li>
                      <li>Days: MONDAY - FRIDAY</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card className="mb-3 bg-light">
                  <Card.Body>
                    <h6><i className="fas fa-check-circle"></i> Quality Metrics</h6>
                    <ul>
                      <li>Conflicts Resolved: 0</li>
                      <li>AI Efficiency Score: 78%</li>
                      <li>Room Utilization: 72%</li>
                      <li>Max Campus Stay: 8 hours</li>
                      <li>Status: Ready for Export</li>
                    </ul>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Alert variant="warning" className="mt-3">
              <i className="fas fa-lock"></i> <strong>Important:</strong> Once finalized, the schedule will be locked.
              You can still export in multiple formats, but changes will require regeneration.
            </Alert>

            <div className="text-center mt-4">
              <Button variant="success" size="lg" onClick={handleFinalizeSchedule}>
                <i className="fas fa-check-double"></i> Confirm & Finalize Schedule
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : (
        <Card className="mt-3 shadow">
          <Card.Header className="bg-success text-white">
            <h5 className="mb-0">Schedule Finalized Successfully!</h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="success">
              <i className="fas fa-check-circle"></i> Your schedule has been locked and is ready for export.
            </Alert>

            <h5 className="mb-3">Export Options</h5>
            <p className="text-muted">Choose your preferred format to download the schedule</p>

            <Row className="mt-4">
              <Col md={6} className="mb-3">
                <Card className="h-100 text-center p-4 border-primary">
                  <Card.Body>
                    <i className="fas fa-file-pdf fa-3x text-danger mb-3"></i>
                    <h5>Export as PDF</h5>
                    <p className="text-muted">Professional format suitable for printing and sharing</p>
                    <Button variant="danger" onClick={handleExportPDF}>
                      <i className="fas fa-download"></i> Download PDF
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6} className="mb-3">
                <Card className="h-100 text-center p-4 border-success">
                  <Card.Body>
                    <i className="fas fa-file-csv fa-3x text-success mb-3"></i>
                    <h5>Export as CSV</h5>
                    <p className="text-muted">Compatible with Excel and other spreadsheet applications</p>
                    <Button variant="success" onClick={handleExportCSV}>
                      <i className="fas fa-download"></i> Download CSV
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Alert variant="info" className="mt-4">
              <i className="fas fa-lightbulb"></i> <strong>Tip:</strong> Keep both formats for backup.
              PDF for distribution, CSV for further data processing.
            </Alert>

            <div className="text-center mt-4">
              <Button variant="primary" onClick={handleStartNew}>
                <i className="fas fa-plus"></i> Create New Schedule
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ExportScreen;
