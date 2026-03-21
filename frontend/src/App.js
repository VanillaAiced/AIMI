import React from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import NotificationProvider, { useNotification } from './components/NotificationProvider';
import Footer from './components/Footer';
import HomeScreen from './screens/HomeScreen';
import { useEffect, useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ScheduleGenerationScreen from './screens/ScheduleGenerationScreen';
import PaymentScreen from './screens/PaymentScreen';
import SchedulePreviewScreen from './screens/SchedulePreviewScreen';
import AIAnalysisScreen from './screens/AIAnalysisScreen';
import ExportScreen from './screens/ExportScreen';
import AdminDashboard from './screens/AdminDashboard';
import DepartmentsScreen from './screens/DepartmentsScreen';
import SubDepartmentsScreen from './screens/SubDepartmentsScreen';
import BlocksScreen from './screens/BlocksScreen';
import ReauthScreen from './screens/ReauthScreen';
import BuildingsScreen from './screens/BuildingsScreen';
import AdminResources from './screens/AdminResources';
import ProfessorsScreen from './screens/ProfessorsScreen';
import ScheduleGeneratorScreen from './screens/ScheduleGeneratorScreen';
import ScheduleViewer from './screens/ScheduleViewer';
import StudentDashboard from './screens/StudentDashboard';
import ProfessorDashboard from './screens/ProfessorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
// SetupProgress is used inside AdminDashboard; not imported here to avoid unused import

// Module-level guard so the auth bootstrap runs only once across remounts/HMR
let authBootstrapped = false;

function App() {
  const [user, setUser] = useState(null);


  // Component rendered inside NotificationProvider so it can use the notification hook.
  const AuthBootstrap = ({ setUser }) => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    React.useEffect(() => {
      if (authBootstrapped) return;
      authBootstrapped = true;
      (async () => {
        try {
          // Throttle repeated checks across tabs/remounts: skip if last check <30s
          const last = sessionStorage.getItem('lastAuthCheck');
          if (last && Date.now() - parseInt(last, 10) < 30_000) return;
          sessionStorage.setItem('lastAuthCheck', String(Date.now()));

          const token = localStorage.getItem('accessToken');
          if (!token) return;
          const resp = await fetch('/api/auth/me/', {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          });
          if (!resp.ok) {
            // token invalid -> clear stored auth but do not force a navigation
            // (navigating here causes reload-to-login race on protected pages)
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            if (notify) notify({ text: 'Session expired — please sign in again.', variant: 'warning' });
            return;
          }
          const json = await resp.json();
          // require authoritative role
          if (!json.role) {
            // missing role: show re-authentication screen with message
            if (notify) notify({ text: 'Account role missing — please re-authenticate.', variant: 'warning' });
            localStorage.removeItem('user');
            navigate('/reauth');
            return;
          }
          const newUser = { email: json.username, name: json.username, role: json.role };
          localStorage.setItem('user', JSON.stringify(newUser));
          setUser(newUser);
        } catch (err) {
          // network or other error — do nothing silently
        }
      })();
    }, [setUser, navigate, notify]);

    return null;
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  return (
    <Router>
      <NotificationProvider>
        <Header user={user} setUser={setUser} />
        <AuthBootstrap setUser={setUser} />
        <main className="py-3">
          <Container fluid style={{ padding: 0 }}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/login" element={<LoginScreen setUser={setUser} />} />
              <Route path="/register" element={<RegisterScreen setUser={setUser} />} />
              {/* Data input removed; admin dashboard manages resources */}
              
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/departments" element={<ProtectedRoute role="admin"><DepartmentsScreen/></ProtectedRoute>} />
                <Route path="/admin/subdepartments" element={<ProtectedRoute role="admin"><SubDepartmentsScreen/></ProtectedRoute>} />
                <Route path="/admin/blocks" element={<ProtectedRoute role="admin"><BlocksScreen/></ProtectedRoute>} />
                <Route path="/admin/buildings" element={<ProtectedRoute role="admin"><BuildingsScreen/></ProtectedRoute>} />
                
                <Route path="/admin/resources" element={<ProtectedRoute role="admin"><AdminResources/></ProtectedRoute>} />
                <Route path="/admin/professors" element={<ProtectedRoute role="admin"><ProfessorsScreen/></ProtectedRoute>} />
                <Route path="/admin/generator" element={<ProtectedRoute role="admin"><ScheduleGeneratorScreen/></ProtectedRoute>} />
                <Route path="/admin/schedule" element={<ProtectedRoute role="admin"><ScheduleViewer/></ProtectedRoute>} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/professor" element={<ProfessorDashboard />} />
              <Route path="/schedule-generation" element={<ScheduleGenerationScreen />} />
              <Route path="/reauth" element={<ReauthScreen />} />
              <Route path="/payment" element={<PaymentScreen />} />
              <Route path="/schedule-preview" element={<SchedulePreviewScreen />} />
              <Route path="/ai-analysis" element={<AIAnalysisScreen />} />
              <Route path="/export" element={<ExportScreen />} />
            </Routes>
          </Container>
        </main>
        <Footer />
      </NotificationProvider>
    </Router>
  );
}

export default App;
