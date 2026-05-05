import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminLogsPage from './pages/AdminLogsPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/logs" element={<AdminLogsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
