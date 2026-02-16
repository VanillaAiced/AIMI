import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  return (
    <header>
      <Navbar bg="primary" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          <Navbar.Brand href="/">AIMI</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {!user ? (
                <Nav.Link as={Link} to="/login">
                  <i className="fas fa-user"></i> Sign In
                </Nav.Link>
              ) : (
                <>
                  <Nav.Link as={Link} to="#">{user.name || user.email}</Nav.Link>
                  <Nav.Link onClick={onLogout}>Logout</Nav.Link>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
