import React from 'react';
import { Container } from 'react-bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import DataInputScreen from './screens/DataInputScreen';
import ScheduleGenerationScreen from './screens/ScheduleGenerationScreen';
import PaymentScreen from './screens/PaymentScreen';
import SchedulePreviewScreen from './screens/SchedulePreviewScreen';
import AIAnalysisScreen from './screens/AIAnalysisScreen';
import ExportScreen from './screens/ExportScreen';

function App() {
  return (
    <Router>
      <Header />
      <main className="py-3">
        <Container fluid style={{ padding: 0 }}>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/login" element={<LoginScreen />} />
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
    </Router>
  );
}

export default App;
