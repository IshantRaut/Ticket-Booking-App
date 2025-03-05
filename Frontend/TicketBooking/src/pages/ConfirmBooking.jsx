// src/pages/ConfirmBooking.js
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings } from '../store/trainSlice';
import { FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

function ConfirmBooking() {
  const { bookingId } = useParams();
  const dispatch = useDispatch();
  const { bookings, loading, error } = useSelector((state) => state.trains);

  useEffect(() => {
    dispatch(fetchBookings())
      .unwrap()
      .then(() => {
        const booking = bookings.find((b) => b._id === bookingId);
        if (booking) {
          toast.success('Booking confirmed and loaded!', {
            style: { fontFamily: 'serif', color: '#2C3E50' },
          });
        } else {
          toast.warn('Booking not found for this ID', {
            style: { fontFamily: 'serif', color: '#2C3E50' },
          });
        }
      })
      .catch((err) => toast.error(err || 'Failed to load bookings', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      }));
  }, [dispatch, bookingId, bookings]);

  const booking = bookings.find((b) => b._id === bookingId);

  return (
    <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#F9FAFB] p-8 rounded-2xl shadow-lg max-w-md w-full transition-all hover:shadow-xl border-t-4 border-[#4682B4]">
        <div className="flex justify-center mb-6">
          <FaCheckCircle className="text-5xl text-[#4682B4] animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-[#2C3E50] text-center mb-6 font-serif">
          Booking Confirmed
        </h1>
        {loading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-[#4682B4] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && <p className="text-red-600 text-center font-serif font-medium">{error}</p>}
        {!booking && !loading && <p className="text-[#2C3E50] text-center font-serif font-medium">Booking not found</p>}
        {booking && (
          <div className="space-y-4 text-[#2C3E50] font-serif font-medium">
            <p><strong>Train:</strong> {booking.trainId.name} ({booking.trainId})</p>
            <p><strong>Route:</strong> {booking.trainId.source} to {booking.trainId.destination}</p>
            <p><strong>Seat:</strong> {booking.seatNumber}</p>
            <p><strong>Booked At:</strong> {new Date(booking.bookedAt).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConfirmBooking;