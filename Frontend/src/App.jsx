import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';

import CitizenDashboard from './pages/CitizenDashboard';
import CitizenBenefits from './pages/CitizenBenefits';
import CitizenRequests from './pages/CitizenRequests';
import CitizenDocuments from './pages/CitizenDocuments';
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerRequests from './pages/OfficerRequests';
import AdminDashboard from './pages/AdminDashboard';

// Dummy Pages (To be built in later steps)
const Unauthorized = () => <div className="text-center p-10 text-red-600"><h2 className="text-2xl font-bold">Unauthorized Access</h2></div>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Public Routes */}
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="unauthorized" element={<Unauthorized />} />

            {/* Citizen Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CITIZEN']} />}>
              <Route path="citizen/dashboard" element={<CitizenDashboard />} />
              <Route path="citizen/documents" element={<CitizenDocuments />} />
              <Route path="citizen/benefits" element={<CitizenBenefits />} />
              <Route path="citizen/requests" element={<CitizenRequests />} />
            </Route>

            {/* Officer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']} />}>
              <Route path="officer/dashboard" element={<OfficerDashboard />} />
              <Route path="officer/requests" element={<OfficerRequests />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
