const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./db');
const { setupSocket } = require('./socket/socketHandler');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminDetailedRoutes = require('./routes/adminDetailed');
const appointmentRoutes = require('./routes/appointments');
const workflowRoutes = require('./routes/workflow');
const patientRoutes = require('./routes/patient.routes');
const nurseRoutes = require('./routes/nurse.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Socket.IO Setup
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

// Configure rooms and connection logic via handler
setupSocket(io);

// Attach io to requests so routes can emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});


app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin-new', adminDetailedRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/nurse', nurseRoutes);

app.get('/', (req, res) => {
    res.send('MedPlus+ API is running');
});

// Connect DB then start server
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });
