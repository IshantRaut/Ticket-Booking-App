// backend/index.js
const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const trainRoutes = require('./routes/trainRoutes');
const authRoutes = require('./routes/authRoutes');
const Train = require('./models/Train');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Seed static train data
// backend/index.js
const seedData = async () => {
  const trainData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/trains.json'), 'utf-8'));
  await Train.deleteMany({});
  await Train.insertMany(trainData);
  console.log('Train data seeded:', trainData.find(t => t.id === 'T123')); // Debug
};
mongoose.connection.once('open', seedData);

// Routes
app.use('/api/trains', trainRoutes);
app.use('/api/auth', authRoutes);

// Socket.IO
io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('joinTrain', (trainId) => {
    socket.join(`train:${trainId}`);
    console.log(`User joined train:${trainId}`);
  });
  socket.on('joinUser', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User joined user:${userId}`);
  });
});

app.set('io', io);

server.listen(5000, () => console.log('Server running on port 5000'));