const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('✅ Connected to MongoDB Database');
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/finance', require('./routes/financeRoutes'));
app.use('/api/emis', require('./routes/emiRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));

app.get('/', (req, res) => {
  res.send('Smart Finance API is running...');
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

// Export io so we can use it in controllers
app.set('io', io);

io.on('connection', (socket) => {
  console.log('⚡ Socket client connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

const { startEmiCronJob } = require('./services/emiNotifier');

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  // Start Background Cron Jobs
  startEmiCronJob();
});
