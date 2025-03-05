// src/components/TrainList.js
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSeats, createOrder, bookSeat, setExpandedTrain, updateSeat, joinWaitlist, setAvailableSeat, clearAvailableSeat } from '../store/trainSlice';
import socket from '../socket';
import { FaChair } from 'react-icons/fa';
import { toast } from 'react-toastify';

function TrainList({ trains }) {
  const dispatch = useDispatch();
  const { seats, loading, error, expandedTrain, waitlist, availableSeat } = useSelector((state) => state.trains);
  const { user } = useSelector((state) => state.auth);
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (expandedTrain) {
      socket.emit('joinTrain', expandedTrain);
      if (user && user.id) socket.emit('joinUser', user.id);

      socket.on('seatBooked', (data) => dispatch(updateSeat({ trainId: expandedTrain, ...data })));
      socket.on('seatFreed', (data) => dispatch(updateSeat({ trainId: expandedTrain, ...data })));
      socket.on('seatAvailable', (data) => {
        dispatch(setAvailableSeat(data));
        setTimeLeft(Math.floor((data.expiresAt - Date.now()) / 1000));
        toast.info(`Seat ${data.seatNumber} is available for ${timeLeft} seconds!`, { autoClose: 5000 });
      });

      return () => {
        socket.off('seatBooked');
        socket.off('seatFreed');
        socket.off('seatAvailable');
      };
    }
  }, [expandedTrain, dispatch, user]);

  useEffect(() => {
    if (availableSeat && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft <= 0) {
      dispatch(clearAvailableSeat());
    }
  }, [availableSeat, timeLeft, dispatch]);

  const handleToggleSeats = (trainId) => {
    dispatch(setExpandedTrain(expandedTrain === trainId ? null : trainId));
    if (!seats[trainId]) dispatch(fetchSeats(trainId));
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBook = async (trainId, seatNumber) => {
    try {
      const orderAction = await dispatch(createOrder({ trainId, seatNumber })).unwrap();
      const { orderId, amount } = orderAction;
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Failed to load Razorpay');

      const options = {
        key: 'YOUR_RAZORPAY_TEST_KEY_ID',
        amount,
        currency: 'INR',
        order_id: orderId,
        handler: async (response) => {
          await dispatch(bookSeat({ trainId, seatNumber, paymentId: response.razorpay_payment_id })).unwrap();
          dispatch(clearAvailableSeat());
          toast.success('Seat booked successfully!');
        },
        prefill: { email: 'test@example.com' },
        theme: { color: '#4682B4' },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      toast.error(err.message || 'Booking failed');
    }
  };

  const handleJoinWaitlist = (trainId) => {
    dispatch(joinWaitlist(trainId))
      .unwrap()
      .then(() => toast.success('Joined waitlist successfully!'))
      .catch((err) => toast.error(err || 'Failed to join waitlist'));
  };

  const renderSeatMap = (trainSeats) => {
    const totalSeats = trainSeats.length;
    const columns = Math.ceil(totalSeats / 2);
    const grid = Array(2).fill().map(() => Array(columns).fill(null));
    trainSeats.forEach((seat, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      grid[row][col] = seat;
    });
    const allBooked = trainSeats.every((seat) => seat.isBooked || (seat.reservedFor && seat.reservedFor !== user?.id));

    return (
      <div className="mt-4">
        <div className="flex justify-center mb-4">
          {Array(columns).fill().map((_, i) => (
            <div key={i} className="w-16 text-center text-[#2C3E50] font-serif font-semibold">Col {i + 1}</div>
          ))}
        </div>
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className={`grid grid-cols-${columns} gap-3`}>
            {row.map((seat, colIdx) => (
              seat ? (
                <div
                  key={seat.seatNumber}
                  className={`p-4 bg-[#F9FAFB] border border-[#4682B4] rounded-lg shadow-md text-center cursor-pointer transition-transform duration-200 hover:scale-105 ${
                    seat.isBooked ? 'bg-gray-300 text-gray-500' : 
                    seat.reservedFor && seat.reservedFor !== user?.id ? 'bg-[#4682B4] text-white' : 
                    'bg-[#F0F8FF] text-[#2C3E50] hover:bg-[#5A9BD4] hover:text-white'
                  }`}
                  title={`${seat.seatNumber} (${seat.class}) - ${seat.isBooked ? 'Booked' : seat.reservedFor && seat.reservedFor !== user?.id ? 'Reserved' : 'Available'}`}
                  onClick={() => !seat.isBooked && (!seat.reservedFor || seat.reservedFor === user?.id) && handleBook(expandedTrain, seat.seatNumber)}
                >
                  <FaChair className="inline-block mr-1" /> {seat.seatNumber}
                </div>
              ) : (
                <div key={colIdx} className="p-4 border rounded-lg bg-[#F0F8FF] invisible" />
              )
            ))}
          </div>
        ))}
        {allBooked && !waitlist[expandedTrain] && (
          <button
            onClick={() => handleJoinWaitlist(expandedTrain)}
            className="mt-6 px-6 py-2 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
          >
            Join Waitlist
          </button>
        )}
        {waitlist[expandedTrain] && (
          <p className="mt-4 text-[#2C3E50] font-serif font-medium">You are on the waitlist for this train.</p>
        )}
        {availableSeat && availableSeat.trainId === expandedTrain && timeLeft > 0 && (
          <div className="mt-4 p-4 bg-[#F9FAFB] rounded-lg shadow-md border-t-2 border-[#4682B4]">
            <p className="text-[#2C3E50] font-serif font-semibold">
              Seat {availableSeat.seatNumber} available! Book within {timeLeft} seconds.
            </p>
            <button
              onClick={() => handleBook(expandedTrain, availableSeat.seatNumber)}
              className="mt-2 px-4 py-2 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300"
            >
              Book Now
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F0F8FF] p-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-[#2C3E50] mb-6 text-center font-serif">
          Available Trains
        </h2>
        {trains.length === 0 ? (
          <p className="text-[#2C3E50] text-center font-serif font-medium">No trains found. Try a different route.</p>
        ) : (
          <ul className="space-y-6">
            {trains.map((train) => (
              <li key={train.id} className="bg-[#F9FAFB] p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-[#4682B4]">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-[#2C3E50] font-serif">{train.name} ({train.id})</h3>
                    <p className="text-[#2C3E50] font-serif font-medium">{train.source} to {train.destination}</p>
                    <p className="text-[#2C3E50] text-sm font-serif">Departure: {new Date(train.departureTime).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSeats(train.id)}
                    className="px-6 py-2 bg-[#4682B4] text-white rounded-lg shadow-md hover:bg-[#5A9BD4] hover:shadow-lg transition-all duration-300"
                  >
                    {expandedTrain === train.id ? 'Hide Seats' : 'Show Seats'}
                  </button>
                </div>
                {expandedTrain === train.id && (
                  <div className="mt-4">
                    {loading && !seats[train.id] && (
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-[#4682B4] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {error && !seats[train.id] && <p className="text-red-600 text-center font-serif font-medium">{error}</p>}
                    {seats[train.id] && renderSeatMap(seats[train.id])}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TrainList;