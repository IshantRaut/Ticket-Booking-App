// backend/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainId: { type: String, required: true }, // Changed to String to match train.id
  seatNumber: { type: String, required: true },
  bookedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);