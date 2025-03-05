// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import TrainSearch from './pages/TrainSearch';
import Bookings from './pages/Booking';
import ConfirmBooking from './pages/ConfirmBooking';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Router>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        <Route path="/" element={token ? <Home /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/trains" element={<TrainSearch />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/confirm/:bookingId" element={<ConfirmBooking />} /> {/* Ensure this is here */}
      </Routes>
    </Router>
  );
}

export default App;