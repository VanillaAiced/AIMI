import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './NotificationProvider';

const Header = ({ user, setUser }) => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/auth/logout/', { method: 'POST', headers });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (setUser) setUser(null);
    console.debug('Header: calling notify signout');
    notify({ text: 'Signed out', variant: 'info', timeout: 3000 });
    navigate('/login');
  };

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
              {user ? (
                <>
                  <Nav.Link onClick={()=>navigate('/data-input')}>
                    <i className="fas fa-user"></i> {user.email}
                  </Nav.Link>
                  <Nav.Link onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </Nav.Link>
                </>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link>
                    <i className="fas fa-sign-in-alt"></i> Login
                  </Nav.Link>
                </LinkContainer>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
