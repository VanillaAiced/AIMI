import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Features = () => {
  return (
    <Container className="py-4">
      <h1>Project Features</h1>

      <Row className="mt-4">
        <Col md={6} className="mb-3">
          <h4><i className="fas fa-bolt"></i> Conflict-Aware Schedule Generation</h4>
          <p>
            Automatically detects and prevents overlapping schedules for students, professors, and classrooms by
            validating time slots and enforcing constraints during schedule creation.
          </p>
        </Col>

        <Col md={6} className="mb-3">
          <h4><i className="fas fa-exchange-alt"></i> Cross-Department Scheduling Validation</h4>
          <p>
            Validates schedules across departments so students taking courses outside their home department do not
            encounter time conflicts.
          </p>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={6} className="mb-3">
          <h4><i className="fas fa-robot"></i> AI-Assisted Schedule Analysis</h4>
          <p>
            An AI analysis layer evaluates generated schedules, highlights inefficiencies, and provides human-
            readable optimization suggestions.
          </p>
        </Col>

        <Col md={6} className="mb-3">
          <h4><i className="fab fa-paypal"></i> Payment-Based Advanced Optimization</h4>
          <p>
            Advanced optimization features are gated behind PayPal payment integration to control access to
            premium capabilities.
          </p>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={6} className="mb-3">
          <h4><i className="fas fa-eye"></i> Schedule Preview and Export</h4>
          <p>
            Users can preview generated schedules before finalizing and export them for documentation or further
            review.
          </p>
        </Col>
      </Row>
    </Container>
  );
};

export default Features;
