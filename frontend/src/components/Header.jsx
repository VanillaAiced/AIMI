import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

const Header = () => {
  return (
    <header>
      <Navbar bg="light" variant="light" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>
              <img 
                src="/images/AIMI.png" 
                alt="AIMI Schedule Optimizer" 
                height="60"
                className="d-inline-block align-top"
              />
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <LinkContainer to="/">
                <Nav.Link>
                  <i className="fas fa-home"></i> Home
                </Nav.Link>
              </LinkContainer>
              <LinkContainer to="/login">
                <Nav.Link>
                  <i className="fas fa-sign-in-alt"></i> Login
                </Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
