const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Route Imports
const progressRoutes = require('./routes/progressRoutes');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
// Ensure PORT is defined (defaulting to 3000)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// API Routes
// These require the '/api' prefix in your frontend CONFIG.BACKEND_URL
app.use('/api/progress', progressRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/session', require('./routes/sessionRoutes'));

// Health check route to test connection from phone browser
app.get('/', (req, res) => {
    res.send('CurioKids Backend is running and reachable!');
});

// IMPORTANT: Listen on '0.0.0.0' to allow connections from your physical phone
app.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------------`);
    // Verified IP address from ipconfig
    const localIP = '192.168.31.201';
    console.log(`Server is running!`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`Phone Access: http://${localIP}:${PORT}`);
    console.log(`-----------------------------------------------`);
});