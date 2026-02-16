import React from 'react';
import { Container } from 'react-bootstrap';

const Proposal = () => {
  return (
    <Container className="py-4">
      <h1>AIMI Smart Schedule Optimizer — Project Proposal</h1>
      <p><strong>Prepared by:</strong> Evangelista, Airel Jan T.; Tuazon, Maxwell Wystan M.</p>
      <p><strong>Prepared for:</strong> Engr. Arnaz De Jesus</p>

      <h2>Project Description and Objectives</h2>
      <p>
        The AIMI (Automated, Intelligent and, Multi-Entitied Iteration) Smart Schedule Optimizer is a web-based
        academic scheduling system designed to assist faculty staff in generating optimized class schedules for
        Computer Engineering (CPE) students and professors. It models scheduling as a constraint satisfaction and
        optimization problem, taking into account professor availability, student section conflicts across departments,
        classroom availability, and a maximum allowable on-campus stay of twelve (12) hours per day.
      </p>

      <h3>Objectives</h3>
      <ul>
        <li>Automate academic schedule generation using algorithmic techniques.</li>
        <li>Minimize conflicts in time, room, and personnel allocation.</li>
        <li>Enforce institutional constraints such as the 12-hour daily campus stay limit.</li>
        <li>Integrate AI-assisted analysis for schedule evaluation and suggestions.</li>
        <li>Provide payment-gated access to advanced optimization features.</li>
      </ul>

      <h2>Problem Statement</h2>
      <p>
        Manual scheduling requires extensive coordination and becomes error-prone as the number of subjects, sections,
        and shared resources grow. Cross-department enrollments increase complexity and hidden conflicts. This project
        addresses these challenges by modeling scheduling as a constraint satisfaction and optimization problem.
      </p>

      <h2>System Features</h2>
      <ul>
        <li>Conflict-Aware Schedule Generation</li>
        <li>Cross-Department Scheduling Validation</li>
        <li>AI-Assisted Schedule Analysis</li>
        <li>Payment-Based Advanced Optimization (PayPal integration)</li>
        <li>Schedule Preview and Export</li>
      </ul>

      <h2>Methods / Approach</h2>
      <p>
        The system uses a modular client-server architecture: React frontend, Django REST backend, PostgreSQL database,
        AI analysis via an LLM API, and PayPal for payments. Initial schedules are produced by greedy algorithms with
        backtracking and constraint satisfaction used to resolve conflicts.
      </p>

      <h2>Algorithms & Data Structures</h2>
      <ul>
        <li>Arrays/Lists, Hash Maps, Graphs, Sets, Priority Queues</li>
        <li>Greedy algorithms, Backtracking, Constraint Satisfaction, Sorting</li>
      </ul>

      <h2>System Architecture & Stack</h2>
      <p>
        Frontend: React.js; Backend: Django + Django REST Framework; Database: PostgreSQL; AI: LLM API; Payments: PayPal.
      </p>

      <h2>Project Limitations</h2>
      <p>
        No integration with official university enrollment/registrar systems; AI outputs are advisory; enterprise-scale
        testing and advanced security are out of scope for the initial implementation.
      </p>

      <h2>Expected Outcomes</h2>
      <p>
        Reduced scheduling conflicts, faster schedule generation, demonstrable application of DATASTALGO concepts, and
        AI-assisted recommendations to improve schedule quality.
      </p>

      <h2>Conclusion</h2>
      <p>
        AIMI provides a practical, extensible platform applying algorithmic scheduling and AI-assisted analysis to
        improve academic scheduling reliability and efficiency.
      </p>
    </Container>
  );
};

export default Proposal;
