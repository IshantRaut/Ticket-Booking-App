// backend/controllers/trainController.js
const Train = require('../models/Train');
const Booking = require('../models/Booking');
const Waitlist = require('../models/Waitlist');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { PassThrough } = require('stream');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: 'rzp_test_q8ISfp5jwowhzw', // Replace with your test key_id
  key_secret: 'kVwwY8yHwdvC8Seoo03nGkmG', // Replace with your test key_secret
});

const getTrains = async (req, res) => {
  const { source, destination } = req.query;
  try {
    const trains = await Train.find({ source, destination });
    res.json(trains);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trains' });
  }
};

const getTrainSeats = async (req, res) => {
  const { id } = req.params;
  try {
    const train = await Train.findOne({ id });
    if (!train) return res.status(404).json({ error: 'Train not found' });
    res.json(train.seats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
};

const createOrder = async (req, res) => {
  const { id } = req.params; // trainId
  const { seatNumber } = req.body;
  const userId = req.user.id;

  try {
    const train = await Train.findOne({ id, 'seats.seatNumber': seatNumber, 'seats.isBooked': false });
    console.log('Train found:', train);
    if (!train) return res.status(400).json({ error: 'Seat unavailable or train not found' });

    const shortUserId = userId.slice(0, 10); // e.g., "67c6c845be"
    const receipt = `rec_${shortUserId}_${Date.now().toString().slice(-6)}`; // e.g., "rec_67c6c845be_424400"
    console.log('Generated receipt:', receipt, 'Length:', receipt.length);

    const options = {
      amount: 10000, // ₹100 in paise
      currency: 'INR',
      receipt: receipt, // Max 40 chars
    };
    const order = await razorpay.orders.create(options);
    console.log('Order created:', order);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      seatNumber,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
};
const bookSeat = async (req, res) => {
  const { id } = req.params;
  const { seatNumber, paymentId } = req.body;
  const userId = req.user.id;
  const io = req.app.get('io');

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== 'captured') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    const train = await Train.findOne({ id });
    const seat = train.seats.find(s => s.seatNumber === seatNumber);
    if (!seat || (seat.isBooked && !seat.reservedFor) || (seat.reservedFor && seat.reservedFor.toString() !== userId && seat.reservedUntil > new Date())) {
      return res.status(400).json({ error: 'Seat unavailable or reserved for another user' });
    }

    seat.isBooked = true;
    seat.reservedFor = null;
    seat.reservedUntil = null;
    await train.save();

    const booking = await Booking.create({ userId, trainId: id, seatNumber });
    io.to(`train:${id}`).emit('seatBooked', { seatNumber, isBooked: true });

    res.json({ message: 'Seat booked successfully', booking });
  } catch (error) {
    console.error('Book seat error:', error);
    res.status(500).json({ error: 'Booking failed' });
  }
};
// backend/controllers/trainController.js
const getBookings = async (req, res) => {
  const userId = req.user.id;
  try {
    const bookings = await Booking.find({ userId }).populate('trainId', 'name source destination');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

const joinWaitlist = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const train = await Train.findOne({ id });
    if (!train) return res.status(404).json({ error: 'Train not found' });

    const availableSeats = train.seats.filter((seat) => !seat.isBooked).length;
    console.log(`Train ${id} - Available seats: ${availableSeats}, Total seats: ${train.seats.length}`); // Debug
    if (availableSeats > 0) {
      console.log(`Waitlist rejected: Seats available (${availableSeats})`);
      return res.status(400).json({ error: 'Seats are still available, no need for waitlist' });
    }

    const existingEntry = await Waitlist.findOne({ userId, trainId: id });
    if (existingEntry) {
      console.log(`Waitlist rejected: User ${userId} already on waitlist`);
      return res.status(400).json({ error: 'You are already on the waitlist' });
    }

    const waitlistEntry = await Waitlist.create({ userId, trainId: id });
    console.log(`User ${userId} joined waitlist for ${id}:`, waitlistEntry);
    res.json({ message: 'Joined waitlist successfully', waitlistEntry });
  } catch (error) {
    console.error('Join waitlist error:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
};

const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  const io = req.app.get('io');

  try {
    const booking = await Booking.findOne({ _id: bookingId, userId });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not owned by user' });
    }

    const train = await Train.findOne({ id: booking.trainId });
    if (!train) {
      return res.status(400).json({ error: 'Train not found' });
    }

    const seat = train.seats.find(s => s.seatNumber === booking.seatNumber);
    seat.isBooked = false;

    const nextInLine = await Waitlist.findOne({ trainId: booking.trainId }).sort('createdAt');
    if (nextInLine) {
      seat.reservedFor = nextInLine.userId;
      seat.reservedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await train.save();

      io.to(`user:${nextInLine.userId}`).emit('seatAvailable', {
        trainId: booking.trainId,
        seatNumber: booking.seatNumber,
        expiresAt: seat.reservedUntil.getTime(),
      });
      console.log(`Notified user:${nextInLine.userId} of available seat`);
    } else {
      await train.save();
      io.to(`train:${booking.trainId}`).emit('seatFreed', {
        seatNumber: booking.seatNumber,
        isBooked: false,
      });
    }

    await Booking.deleteOne({ _id: bookingId });
    const refund = { id: `refund_${Date.now()}`, amount: 10000, status: 'processed' };
    res.json({ message: 'Booking cancelled successfully', refund });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Cancellation failed' });
  }
};


const generateTicket = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;

  try {
    const booking = await Booking.findOne({ _id: bookingId, userId }).populate('trainId', 'name source destination departureTime');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found or not owned by user' });
    }

    // Generate QR code
    const qrCodeUrl = `http://localhost:3000/confirm/${booking._id}`; // Placeholder confirmation URL
    const qrCodeData = await QRCode.toDataURL(qrCodeUrl);

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = new PassThrough();
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text('Train Ticket', { align: 'center' });
    doc.moveDown();

    // Booking Details
    doc.fontSize(12).text(`Booking ID: ${booking._id}`, { align: 'left' });
    doc.text(`Train: ${booking.trainId.name} (${booking.trainId.id})`);
    doc.text(`Route: ${booking.trainId.source} to ${booking.trainId.destination}`);
    doc.text(`Departure: ${new Date(booking.trainId.departureTime).toLocaleString()}`);
    doc.text(`Seat: ${booking.seatNumber}`);
    doc.text(`Booked At: ${new Date(booking.bookedAt).toLocaleString()}`);
    doc.moveDown();

    // QR Code
    doc.image(qrCodeData, { fit: [100, 100], align: 'center' });
    doc.text('Scan to confirm', { align: 'center' });

    // Footer
    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for choosing our service!', { align: 'center' });

    doc.end();

    // Send PDF as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket_${booking._id}.pdf`);
    stream.pipe(res);
  } catch (error) {
    console.error('Generate ticket error:', error);
    res.status(500).json({ error: 'Failed to generate ticket' });
  }
};

module.exports = { getTrains, getTrainSeats, createOrder, bookSeat, getBookings, cancelBooking, joinWaitlist, generateTicket };