const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');

const router = express.Router();

// Middleware to verify user token from localStorage
const verifyUser = (req, res, next) => {
    const userStr = req.headers['x-user'];
    if (!userStr) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        req.user = JSON.parse(userStr);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid user data' });
    }
};

// GET /dashboard - Returns all necessary data for the Patient Portal
router.get('/dashboard', verifyUser, async (req, res) => {
    try {
        if (req.user.role !== 'Patient') {
            return res.status(403).json({ error: 'Access restricted to patients.' });
        }

        const patientsCollection = getCollection('patients');
        const appointmentsCollection = getCollection('appointments');
        const notificationsCollection = getCollection('notifications');

        // Get fresh patient data
        let patientRecord = await patientsCollection.findOne({ email: req.user.email });
        if (!patientRecord) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        // Initialize missing fields for new patients (graceful fallback)
        const dashboardData = {
            profile: {
                id: patientRecord._id.toString(),
                name: patientRecord.name,
                email: patientRecord.email,
                phone: patientRecord.phone,
                bloodGroup: patientRecord.bloodGroup
            },
            currentStatus: patientRecord.status || 'Discharged',
            issue: patientRecord.issue || null,
            assignedNurse: patientRecord.assignedNurse || null,
            assignedDoctor: patientRecord.assignedDoctor || null,
            prescriptions: patientRecord.prescriptions || [],
            billing: patientRecord.billing || { status: 'None', total: 0, breakdown: [] },
            testResults: patientRecord.testResults || [],
            visitHistory: patientRecord.visitHistory || []
        };

        // Fetch upcoming appointments
        const today = new Date().toISOString().split('T')[0];
        const upcomingAppointments = await appointmentsCollection.find({
            patientEmail: req.user.email,
            status: 'booked',
            date: { $gte: today }
        }).sort({ date: 1, time: 1 }).toArray();

        dashboardData.appointments = upcomingAppointments;

        // Fetch notifications
        const notifications = await notificationsCollection.find({
            patientId: patientRecord._id.toString()
        }).sort({ createdAt: -1 }).limit(10).toArray();

        dashboardData.notifications = notifications;

        res.json(dashboardData);
    } catch (err) {
        console.error('Error fetching patient dashboard:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /submit-issue - Submit an issue and assign a nurse
router.post('/submit-issue', verifyUser, async (req, res) => {
    try {
        if (req.user.role !== 'Patient') return res.status(403).json({ error: 'Access restricted to patients.' });
        
        const { issueText } = req.body;
        if (!issueText || issueText.trim() === '') {
            return res.status(400).json({ error: 'Issue description is required.' });
        }

        const patientsCollection = getCollection('patients');
        const nursesCollection = getCollection('nurses');
        const notificationsCollection = getCollection('notifications');

        // Find patient
        const patient = await patientsCollection.findOne({ email: req.user.email });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        // Simple Round-Robin Nurse Assignment (simulated by finding a random nurse, or the first one)
        const nurses = await nursesCollection.find({ role: 'Nurse' }).toArray();
        const assignedNurse = nurses.length > 0 ? nurses[Math.floor(Math.random() * nurses.length)] : null;

        const nurseSummary = assignedNurse ? {
            id: assignedNurse._id.toString(),
            name: assignedNurse.name,
            contact: assignedNurse.phone || 'Extension 204'
        } : null;

        // Update Patient Record
        const newStatus = nurseSummary ? 'Assigned to Nurse' : 'Waiting for nurse assignment';
        const issueObj = {
            text: issueText,
            timestamp: new Date()
        };

        await patientsCollection.updateOne(
            { _id: patient._id },
            { 
                $set: { 
                    issue: issueObj,
                    status: newStatus,
                    assignedNurse: nurseSummary
                } 
            }
        );

        // Create Notification
        const notification = {
            patientId: patient._id.toString(),
            message: nurseSummary 
                ? `Your issue has been submitted. You have been assigned to ${nurseSummary.name}.`
                : 'Your issue has been submitted. Waiting for nurse assignment.',
            type: 'Nurse Assignment',
            isRead: false,
            createdAt: new Date()
        };
        await notificationsCollection.insertOne(notification);

        // Emit Socket.IO event to the specific patient's room
        if (req.io) {
            req.io.to(patient._id.toString()).emit('portal_update', {
                type: 'STATUS_UPDATE',
                status: newStatus,
                assignedNurse: nurseSummary,
                issue: issueObj,
                notification: notification
            });
        }

        res.json({ 
            message: 'Issue submitted successfully', 
            status: newStatus,
            assignedNurse: nurseSummary,
            issue: issueObj
        });

    } catch (err) {
        console.error('Error submitting issue:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /cancel-appointment
router.post('/cancel-appointment', verifyUser, async (req, res) => {
    try {
        if (req.user.role !== 'Patient') return res.status(403).json({ error: 'Patient only' });

        const { appointmentId } = req.body;
        const appointmentsCollection = getCollection('appointments');
        const notificationsCollection = getCollection('notifications');
        const patientsCollection = getCollection('patients');

        const appt = await appointmentsCollection.findOne({ _id: new ObjectId(appointmentId), patientEmail: req.user.email });
        if (!appt) return res.status(404).json({ error: 'Appointment not found' });

        await appointmentsCollection.updateOne(
            { _id: appt._id },
            { $set: { status: 'Cancelled_By_Patient' } }
        );

        const patient = await patientsCollection.findOne({ email: req.user.email });

        // Create Notification
        const notification = {
            patientId: patient._id.toString(),
            message: `You successfully cancelled your appointment with Dr. ${appt.doctorEmail} on ${appt.date}.`,
            type: 'Appointment Cancelled',
            isRead: false,
            createdAt: new Date()
        };
        await notificationsCollection.insertOne(notification);

        if (req.io) {
            req.io.to(patient._id.toString()).emit('portal_update', {
                type: 'APPOINTMENT_CANCELLED',
                appointmentId: appt._id.toString()
            });
        }

        res.json({ message: 'Appointment cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
