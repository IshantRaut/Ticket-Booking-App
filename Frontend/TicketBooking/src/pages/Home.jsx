// src/pages/Home.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { Link } from 'react-router-dom';
import { FaTrain, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Home() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth); // Fetch user from auth state

  useEffect(() => {
    if (user) {
      toast.success(`Welcome back, ${user.email || 'Traveler'}!`, {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center p-8 animate-fade-in">
      <div className="bg-[#F9FAFB] p-10 rounded-2xl shadow-lg max-w-lg w-full text-center border-t-4 border-[#4682B4] transition-all hover:shadow-xl">
        <div className="flex justify-center mb-6">
          <FaTrain className="text-5xl text-[#4682B4] animate-bounce" />
        </div>
        <h1 className="text-4xl font-bold text-[#2C3E50] mb-6 font-serif">
          Train Ticket Booking
        </h1>
        {user && (
          <div className="mb-8 flex items-center justify-center gap-2 text-[#2C3E50] font-serif font-medium">
            <FaUser className="text-[#4682B4]" />
            <p>Logged in as: <span className="font-semibold">{user.email || 'User'}</span></p>
          </div>
        )}
        <p className="text-lg text-[#2C3E50] mb-8 font-serif font-medium">
          Start your journey with ease!
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/trains"
            className="px-6 py-3 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Search Trains
          </Link>
          <Link
            to="/bookings"
            className="px-6 py-3 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            View Bookings
          </Link>
          <button
            onClick={() => dispatch(logout())}
            className="px-6 py-3 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;