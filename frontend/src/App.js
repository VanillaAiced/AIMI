import React from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import NotificationProvider from './components/NotificationProvider';
import Footer from './components/Footer';
import HomeScreen from './screens/HomeScreen';
import { useEffect, useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DataInputScreen from './screens/DataInputScreen';
import ScheduleGenerationScreen from './screens/ScheduleGenerationScreen';
import PaymentScreen from './screens/PaymentScreen';
import SchedulePreviewScreen from './screens/SchedulePreviewScreen';
import AIAnalysisScreen from './screens/AIAnalysisScreen';
import ExportScreen from './screens/ExportScreen';
import AdminDashboard from './screens/AdminDashboard';
import DepartmentsScreen from './screens/DepartmentsScreen';
import BuildingsScreen from './screens/BuildingsScreen';
import TimeSlotsScreen from './screens/TimeSlotsScreen';
import AdminResources from './screens/AdminResources';
import ProfessorsScreen from './screens/ProfessorsScreen';
import ScheduleGeneratorScreen from './screens/ScheduleGeneratorScreen';
import ScheduleViewer from './screens/ScheduleViewer';
import StudentDashboard from './screens/StudentDashboard';
import ProfessorDashboard from './screens/ProfessorDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import SetupProgress from './components/SetupProgress';

function App() {
  const [user, setUser] = useState(null);

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
        <main className="py-3">
          <Container fluid style={{ padding: 0 }}>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/login" element={<LoginScreen setUser={setUser} />} />
              <Route path="/register" element={<RegisterScreen setUser={setUser} />} />
              <Route path="/data-input" element={<DataInputScreen />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/departments" element={<ProtectedRoute role="admin"><DepartmentsScreen/></ProtectedRoute>} />
                <Route path="/admin/buildings" element={<ProtectedRoute role="admin"><BuildingsScreen/></ProtectedRoute>} />
                <Route path="/admin/timeslots" element={<ProtectedRoute role="admin"><TimeSlotsScreen/></ProtectedRoute>} />
                <Route path="/admin/resources" element={<ProtectedRoute role="admin"><AdminResources/></ProtectedRoute>} />
                <Route path="/admin/professors" element={<ProtectedRoute role="admin"><ProfessorsScreen/></ProtectedRoute>} />
                <Route path="/admin/generator" element={<ProtectedRoute role="admin"><ScheduleGeneratorScreen/></ProtectedRoute>} />
                <Route path="/admin/schedule" element={<ProtectedRoute role="admin"><ScheduleViewer/></ProtectedRoute>} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/professor" element={<ProfessorDashboard />} />
              <Route path="/schedule-generation" element={<ScheduleGenerationScreen />} />
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
