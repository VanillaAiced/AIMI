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
              <Route path="/register" element={<RegisterScreen />} />
              <Route path="/data-input" element={<DataInputScreen />} />
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
