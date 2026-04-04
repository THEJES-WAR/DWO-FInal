const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');
const { verifyUser, verifyRole } = require('../middleware/auth');
const { emitToPatient, emitToNurse, emitToAdmin } = require('../socket/socketHandler');

const router = express.Router();

/**
 * GET /api/patient/dashboard
 * Fetch comprehensive dashboard data for the patient
 */
router.get('/dashboard', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const patientsColl = getCollection('patients');
        const appointmentsColl = getCollection('appointments');
        const notificationsColl = getCollection('notifications');
        const billsColl = getCollection('bills');

        const patientIdHex = req.user._id;
        const patientRecord = await patientsColl.findOne({ email: req.user.email });
        if (!patientRecord) return res.status(404).json({ error: 'Patient not found' });

        // Ensure robust default schema returns for the UI
        const data = {
            profile: {
                id: patientRecord._id.toString(),
                name: patientRecord.name,
                email: patientRecord.email,
                phone: patientRecord.phone,
                bloodGroup: patientRecord.bloodGroup
            },
            status: patientRecord.status || 'registered',
            issue: patientRecord.issue || null,
            assignedNurse: patientRecord.assignedNurse || null, // Will contain ref details
            assignedDoctor: patientRecord.assignedDoctor || null,
            nurseVisit: patientRecord.nurseVisit || null,
            testResults: patientRecord.testResults || [],
            prescriptions: patientRecord.prescriptions || [],
            billing: patientRecord.billing || null,
            visitHistory: patientRecord.visitHistory || []
        };

        // Fetch Appointments
        const activeAppts = await appointmentsColl.find({
            patientId: patientRecord._id.toString(),
            status: { $in: ['confirmed', 'rescheduled'] }
        }).sort({ date: 1, time: 1 }).toArray();
        data.appointments = activeAppts;

        // Fetch Notifications
        data.notifications = await notificationsColl.find({
            patientId: patientRecord._id.toString()
        }).sort({ createdAt: -1 }).limit(10).toArray();

        res.json(data);
    } catch (err) {
        console.error('Error fetching patient dashboard:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/patient/submit-issue
 * Logs the issue, transitions status, assigns a nurse, and fires socket events
 */
router.post('/submit-issue', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const { description } = req.body;
        if (!description) return res.status(400).json({ error: 'Issue description is required' });

        const patientsColl = getCollection('patients');
        const nursesColl = getCollection('nurses');
        const notificationsColl = getCollection('notifications');

        const patient = await patientsColl.findOne({ email: req.user.email });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        // Phase 1: Simple Round-Robin for available Helpers
        const availableNurses = await nursesColl.find({ role: 'Helper', isAvailable: true }).toArray();
        let assignedNurse = null;
        if (availableNurses.length > 0) {
            // Pick a random available helper for now
            assignedNurse = availableNurses[Math.floor(Math.random() * availableNurses.length)];
        } else {
            // Fallback if no helpers, pick any nurse
            const allNurses = await nursesColl.find({}).toArray();
            assignedNurse = allNurses.length > 0 ? allNurses[0] : null;
        }

        const nurseMinimal = assignedNurse ? {
            id: assignedNurse._id.toString(),
            name: assignedNurse.name,
            ward: assignedNurse.ward || 'General',
            contact: assignedNurse.contact || 'Ext 204'
        } : null;

        const newStatus = nurseMinimal ? 'nurse_assigned' : 'issue_submitted';
        const issueObj = { description, submittedAt: new Date() };

        await patientsColl.updateOne(
            { _id: patient._id },
            { 
                $set: { 
                    issue: issueObj,
                    status: newStatus,
                    assignedNurse: nurseMinimal
                }
            }
        );

        const patientIdStr = patient._id.toString();

        // Save Notifications
        if (nurseMinimal) {
            const notifText = `Hello ${patient.name}, Nurse ${nurseMinimal.name} from ${nurseMinimal.ward} has been assigned to you. Please visit the nurse station.`;
            const pNotif = { patientId: patientIdStr, type: 'nurse_assigned', message: notifText, read: false, createdAt: new Date() };
            await notificationsColl.insertOne(pNotif);

            const nNotif = { nurseId: nurseMinimal.id, type: 'patient_new', message: `New patient ${patient.name} assigned.`, read: false, createdAt: new Date() };
            await notificationsColl.insertOne(nNotif);

            // Fire Socket.IO events
            emitToPatient(req.io, patientIdStr, 'nurse:assigned', { nurse: nurseMinimal, notification: pNotif });
            emitToNurse(req.io, nurseMinimal.id, 'patient:new', { patient: { id: patientIdStr, name: patient.name, issue: issueObj } });
            emitToAdmin(req.io, 'workflow:updated', { patientId: patientIdStr, newStatus });
        }

        res.json({
            message: 'Issue submitted successfully',
            status: newStatus,
            assignedNurse: nurseMinimal,
            issue: issueObj
        });

    } catch (err) {
        console.error('Error submitting issue:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
