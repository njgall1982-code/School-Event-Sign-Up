// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EventDetails from './pages/EventDetails';
import AllocationView from './pages/AllocationView';

function App() {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route 
            path="/" 
            element={!user ? <Landing /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/" />} 
          />
          <Route 
            path="/create-event" 
            element={user ? <CreateEvent /> : <Navigate to="/" />} 
          />
          <Route 
            path="/edit-event/:id" 
            element={user ? <EditEvent /> : <Navigate to="/" />} 
          />
          <Route 
            path="/event/:id" 
            element={user ? <EventDetails /> : <Navigate to="/" />} 
          />
          <Route 
            path="/event/:id/allocate" 
            element={user ? <AllocationView /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
