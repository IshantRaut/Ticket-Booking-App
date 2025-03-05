// src/pages/Bookings.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookings, cancelBooking } from '../store/trainSlice';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaTicketAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';

function Bookings() {
  const dispatch = useDispatch();
  const { bookings, loading, error } = useSelector((state) => state.trains);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchBookings())
      .unwrap()
      .then(() => {
        if (bookings.length > 0) {
          toast.success('Bookings loaded successfully!', {
            style: { fontFamily: 'serif', color: '#2C3E50' },
          });
        }
      })
      .catch((err) => toast.error(err || 'Failed to load bookings', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      }));
  }, [dispatch]);

  const handleCancel = async (bookingId) => {
    toast(
      ({ closeToast }) => (
        <div className="font-serif text-[#2C3E50]">
          Are you sure you want to cancel this booking?
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                dispatch(cancelBooking(bookingId))
                  .unwrap()
                  .then(() => toast.success('Booking cancelled successfully!', {
                    style: { fontFamily: 'serif', color: '#2C3E50' },
                  }))
                  .catch((err) => toast.error(err || 'Cancellation failed', {
                    style: { fontFamily: 'serif', color: '#2C3E50' },
                  }));
                closeToast();
              }}
              className="px-2 py-1 bg-[#4682B4] text-white rounded hover:bg-[#5A9BD4]"
            >
              Yes
            </button>
            <button onClick={closeToast} className="px-2 py-1 bg-gray-300 text-[#2C3E50] rounded hover:bg-gray-400">
              No
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false, draggable: false }
    );
  };

  const handleDownloadTicket = async (bookingId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/trains/bookings/${bookingId}/ticket`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ticket_${bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Ticket downloaded successfully!', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      });
    } catch (err) {
      toast.error('Failed to download ticket', {
        style: { fontFamily: 'serif', color: '#2C3E50' },
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F8FF] p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center mb-6">
          <FaTicketAlt className="text-5xl text-[#4682B4] animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold text-[#2C3E50] text-center mb-8 font-serif">
          Your Tickets
        </h1>
        <Link to="/" className="text-[#4682B4] hover:text-[#5A9BD4] mb-6 inline-block transition-colors duration-200 font-serif font-medium">Back to Home</Link>
        {loading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-[#4682B4] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {error && <p className="text-red-600 text-center mb-4 font-serif font-medium">{error}</p>}
        {bookings.length === 0 && !loading ? (
          <p className="text-[#2C3E50] text-center font-serif font-medium">No bookings found.</p>
        ) : (
          <ul className="space-y-6">
            {bookings.map((booking) => (
              <li key={booking._id} className="bg-[#F9FAFB] p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-[#4682B4] flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-[#2C3E50] font-serif">{booking.trainId.name} ({booking.trainId})</h3>
                  <p className="text-[#2C3E50] font-serif font-medium">{booking.trainId.source} to {booking.trainId.destination}</p>
                  <p className="text-[#2C3E50] font-serif">Seat: {booking.seatNumber}</p>
                  <p className="text-[#2C3E50] text-sm font-serif">Booked At: {new Date(booking.bookedAt).toLocaleString()}</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleCancel(booking._id)}
                    className="px-4 py-2 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? 'Cancelling...' : 'Cancel'}
                  </button>
                  <button
                    onClick={() => handleDownloadTicket(booking._id)}
                    className="px-4 py-2 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300"
                    disabled={loading}
                  >
                    Download Ticket
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Bookings;