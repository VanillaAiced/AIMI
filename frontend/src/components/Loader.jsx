import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        padding: '20px',
      }}
    >
      <Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <div className="text-muted">{message}</div>
    </div>
  );
};

export default Loader;
