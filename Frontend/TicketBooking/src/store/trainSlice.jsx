// frontend/src/store/trainSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const fetchTrains = createAsyncThunk(
  'trains/fetchTrains',
  async ({ source, destination }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get('http://localhost:5000/api/trains', {
        params: { source, destination },
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data.error || 'Failed to fetch trains');
    }
  }
);

export const fetchSeats = createAsyncThunk(
  'trains/fetchSeats',
  async (trainId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`http://localhost:5000/api/trains/${trainId}/seats`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      console.log(`Fetched seats for ${trainId}:`, response.data); // Debug
      return { trainId, seats: response.data };
    } catch (err) {
      return rejectWithValue(err.response.data.error || 'Failed to fetch seats');
    }
  }
);

export const createOrder = createAsyncThunk(
  'trains/createOrder',
  async ({ trainId, seatNumber }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `http://localhost:5000/api/trains/${trainId}/create-order`,
        { seatNumber },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data.error || 'Failed to create order');
    }
  }
);

export const bookSeat = createAsyncThunk(
  'trains/bookSeat',
  async ({ trainId, seatNumber, paymentId }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `http://localhost:5000/api/trains/${trainId}/book`,
        { seatNumber, paymentId },
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      return { trainId, seatNumber, booking: response.data.booking };
    } catch (err) {
      return rejectWithValue(err.response.data.error || 'Booking failed');
    }
  }
);

export const fetchBookings = createAsyncThunk(
  'trains/fetchBookings',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get('http://localhost:5000/api/trains/bookings', {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response.data.error || 'Failed to fetch bookings');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'trains/cancelBooking',
  async (bookingId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.delete(`http://localhost:5000/api/trains/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return { bookingId, trainId: response.data.booking?.trainId || getState().trains.bookings.find(b => b._id === bookingId).trainId, seatNumber: response.data.booking?.seatNumber || getState().trains.bookings.find(b => b._id === bookingId).seatNumber };
    } catch (err) {
      return rejectWithValue(err.response.data.error || 'Failed to cancel booking');
    }
  }
);
export const joinWaitlist = createAsyncThunk(
  'trains/joinWaitlist',
  async (trainId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`http://localhost:5000/api/trains/${trainId}/waitlist`, {}, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return { trainId, waitlistEntry: response.data.waitlistEntry };
    } catch (err) {
      console.error('Join waitlist failed:', err.response?.data); // Debug
      return rejectWithValue(err.response.data.error || 'Failed to join waitlist');
    }
  }
);
const trainSlice = createSlice({
  name: 'trains',
  initialState: {
    trains: [],
    seats: {},
    source: localStorage.getItem('trainSource') || '',
    destination: localStorage.getItem('trainDestination') || '',
    expandedTrain: localStorage.getItem('expandedTrain') || null,
    bookings: [],
    waitlist: {}, // { trainId: waitlistEntry }
  availableSeat: null, // { trainId, seatNumber, expiresAt }
  reservedSeats: {}, // { trainId: { seatNumber: { reservedFor, reservedUntil } } }
    loading: false,
    error: null,
  },
  reducers: {
    setSearchParams: (state, action) => {
      state.source = action.payload.source;
      state.destination = action.payload.destination;
      localStorage.setItem('trainSource', action.payload.source);
      localStorage.setItem('trainDestination', action.payload.destination);
    },
    setExpandedTrain: (state, action) => {
      state.expandedTrain = action.payload;
      localStorage.setItem('expandedTrain', action.payload || '');
    },
    clearTrains: (state) => {
      state.trains = [];
      state.seats = {};
      state.source = '';
      state.destination = '';
      state.expandedTrain = null;
      localStorage.removeItem('trainSource');
      localStorage.removeItem('trainDestination');
      localStorage.removeItem('expandedTrain');
    },
    updateSeat: (state, action) => {
      const { trainId, seatNumber, isBooked, reservedFor, reservedUntil } = action.payload;
      if (state.seats[trainId]) {
        state.seats[trainId] = state.seats[trainId].map((seat) =>
          seat.seatNumber === seatNumber ? { ...seat, isBooked, reservedFor, reservedUntil } : seat
        );
      }
      if (reservedFor) {
        if (!state.reservedSeats[trainId]) state.reservedSeats[trainId] = {};
        state.reservedSeats[trainId][seatNumber] = { reservedFor, reservedUntil };
      } else if (state.reservedSeats[trainId]?.[seatNumber]) {
        delete state.reservedSeats[trainId][seatNumber];
      }
    },
    // In reducers:
setAvailableSeat: (state, action) => {
  state.availableSeat = action.payload;
},
clearAvailableSeat: (state) => {
  state.availableSeat = null;
},
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrains.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrains.fulfilled, (state, action) => {
        state.loading = false;
        state.trains = action.payload;
      })
      .addCase(fetchTrains.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchSeats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeats.fulfilled, (state, action) => {
        state.loading = false;
        state.seats[action.payload.trainId] = action.payload.seats;
      })
      .addCase(fetchSeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(bookSeat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bookSeat.fulfilled, (state, action) => {
        state.loading = false;
        const { trainId, seatNumber } = action.payload;
        if (state.seats[trainId]) {
          state.seats[trainId] = state.seats[trainId].map((seat) =>
            seat.seatNumber === seatNumber ? { ...seat, isBooked: true } : seat
          );
        }
      })
      .addCase(bookSeat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.filter((b) => b._id !== action.payload.bookingId);
        const { trainId, seatNumber } = action.payload;
        if (state.seats[trainId]) {
          state.seats[trainId] = state.seats[trainId].map((seat) =>
            seat.seatNumber === seatNumber ? { ...seat, isBooked: false } : seat
          );
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // In extraReducers:
.addCase(joinWaitlist.pending, (state) => {
  state.loading = true;
  state.error = null;
})
.addCase(joinWaitlist.fulfilled, (state, action) => {
  state.loading = false;
  state.waitlist[action.payload.trainId] = action.payload.waitlistEntry;
  console.log(`Waitlist updated for ${action.payload.trainId}:`, state.waitlist); // Debug
})
.addCase(joinWaitlist.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload;
});
  },
});

export const { setSearchParams, setExpandedTrain, clearTrains, updateSeat,setAvailableSeat,clearAvailableSeat } = trainSlice.actions;
export default trainSlice.reducer;