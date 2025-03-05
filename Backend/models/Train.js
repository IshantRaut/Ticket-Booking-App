// backend/models/Train.js
const mongoose = require('mongoose');

// backend/models/Train.js
const trainSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  source: { type: String, required: true },
  destination: { type: String, required: true },
  departureTime: { type: String, required: true },
  seats: [
    {
      seatNumber: { type: String, required: true },
      class: { type: String, enum: ['AC', 'Sleeper'], required: true },
      isBooked: { type: Boolean, default: false },
      reservedFor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // New
      reservedUntil: { type: Date, default: null }, // New
    },
  ],
});

module.exports = mongoose.model('Train', trainSchema);