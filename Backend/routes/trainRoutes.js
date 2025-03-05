// backend/routes/trainRoutes.js
const express = require('express');
const router = express.Router();
const { getTrains, getTrainSeats, createOrder, bookSeat, getBookings, cancelBooking,joinWaitlist,generateTicket } = require('../controllers/trainController');
const auth = require('../middlewares/auth');

router.get('/', getTrains);              // GET /api/trains?source=Delhi&destination=Mumbai
router.get('/:id/seats', getTrainSeats); // GET /api/trains/T123/seats
router.post('/:id/create-order', auth, createOrder); // POST /api/trains/T123/create-order
router.post('/:id/book', auth, bookSeat);           // POST /api/trains/T123/book
// backend/routes/trainRoutes.js
router.get('/bookings', auth, getBookings); // GET /api/trains/bookings
router.delete('/bookings/:bookingId', auth, cancelBooking); // New endpoint
router.post('/:id/waitlist', auth, joinWaitlist); // POST /api/trains/:id/waitlist
router.get('/bookings/:bookingId/ticket', auth, generateTicket); // GET /api/trains/bookings/:bookingId/ticket
module.exports = router;