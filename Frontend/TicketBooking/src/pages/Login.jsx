// src/pages/Login.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { FaUserCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate(); // For redirect after login
  const { loading, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(login({ email, password })).unwrap();
      toast.success('Logged in successfully!', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      });
      navigate('/'); // Redirect to Home after success
    } catch (err) {
      toast.error(err || 'Login failed', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#F9FAFB] p-8 rounded-2xl shadow-lg max-w-md w-full transition-all hover:shadow-xl border-t-4 border-[#4682B4]">
        <div className="flex justify-center mb-6">
          <FaUserCircle className="text-5xl text-[#4682B4] animate-pulse" />
        </div>
        <h2 className="text-4xl font-bold text-[#2C3E50] text-center mb-6 font-serif">
          Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 border border-[#4682B4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A9BD4] transition-all duration-200 bg-[#F0F8FF] text-[#2C3E50] font-serif"
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border border-[#4682B4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A9BD4] transition-all duration-200 bg-[#F0F8FF] text-[#2C3E50] font-serif"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-3 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-[#2C3E50] font-serif font-medium">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-[#4682B4] hover:text-[#5A9BD4] transition-colors duration-200">Sign Up</Link>
        </p>
        {error && <p className="mt-4 text-red-600 text-center font-serif font-medium">{error}</p>}
      </div>
    </div>
  );
}

export default Login;