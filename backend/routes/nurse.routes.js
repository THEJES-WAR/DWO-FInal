const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');
const { verifyUser, verifyRole } = require('../middleware/auth');
const { emitToPatient, emitToDoctor, emitToAdmin, emitToNurse } = require('../socket/socketHandler');

const router = express.Router();

/**
 * GET /api/nurse/dashboard
 */
router.get('/dashboard', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const nursesColl = getCollection('nurses');
        const nurseRecord = await nursesColl.findOne({ email: req.user.email });
        if (!nurseRecord) return res.status(404).json({ error: 'Nurse not found' });

        const data = {
            profile: {
                id: nurseRecord._id.toString(),
                name: nurseRecord.name,
                ward: nurseRecord.ward || 'General',
                contact: nurseRecord.contact || 'Ext 204'
            },
            isAvailable: nurseRecord.isAvailable !== false
        };

        res.json(data);
    } catch (err) {
        console.error('Error fetching nurse dashboard:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/nurse/patients
 * Returns patients assigned to this nurse who are active
 */
router.get('/patients', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const patientsColl = getCollection('patients');
        const nurseId = req.user._id;

        const activePatients = await patientsColl.find({
            'assignedNurse.id': nurseId,
            status: { $ne: 'discharged' }
        }).toArray();

        // Standardize output
        const formatted = activePatients.map(p => ({
            id: p._id.toString(),
            name: p.name,
            phone: p.phone,
            status: p.status,
            issue: p.issue,
            testResults: p.testResults || [],
            prescriptions: p.prescriptions || [],
            billing: p.billing || null,
            nurseVisit: p.nurseVisit || null,
            appointments: p.appointments || []
        }));

        res.json(formatted);
    } catch (err) {
        console.error('Error fetching nurse patients:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/nurse/book-appointment
 */
router.put('/book-appointment', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const { patientId, doctorId, date, time, room } = req.body;
        const patientsColl = getCollection('patients');
        const doctorsColl = getCollection('doctors');
        const appointmentsColl = getCollection('appointments');
        const notificationsColl = getCollection('notifications');

        const doctor = await doctorsColl.findOne({ _id: new ObjectId(doctorId) });
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        const apptObj = {
            patientId,
            doctorId: doctor._id.toString(),
            doctorName: doctor.name,
            specialty: doctor.specialty || 'General Physician',
            nurseId: req.user._id,
            date, time, room: room || 'Room 101',
            status: 'confirmed',
            bookedBy: 'nurse',
            createdAt: new Date()
        };

        const result = await appointmentsColl.insertOne(apptObj);
        apptObj._id = result.insertedId;

        // Update Patient
        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { status: 'appointment_scheduled' },
                $push: { appointments: apptObj }
            }
        );

        // Notifications
        const pNotif = { patientId, type: 'appointment_booked', message: `Your appointment with Dr. ${doctor.name} is confirmed for ${date} at ${time}.`, read: false, createdAt: new Date() };
        await notificationsColl.insertOne(pNotif);

        // Emits
        emitToPatient(req.io, patientId, 'appointment:booked', { doctorName: doctor.name, specialty: doctor.specialty, date, time, room: apptObj.room });
        emitToDoctor(req.io, doctor._id.toString(), 'patient:queued', { patientId });
        emitToAdmin(req.io, 'workflow:updated', { patientId, newStatus: 'appointment_scheduled' });

        res.json({ message: 'Appointment booked successfully', appointment: apptObj });
    } catch (err) {
        console.error('Error booking appointment:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/nurse/upload-test-results
 */
router.put('/upload-test-results', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const { patientId, testName, result } = req.body;
        const patientsColl = getCollection('patients');
        const notificationsColl = getCollection('notifications');
        const doctorsColl = getCollection('doctors');

        const patient = await patientsColl.findOne({ _id: new ObjectId(patientId) });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const testObj = { testName, result, uploadedBy: req.user.name, uploadedAt: new Date() };

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { $push: { testResults: testObj } }
        );

        // Notifications to Doctor
        if (patient.assignedDoctor) {
            const notif = { doctorId: patient.assignedDoctor.id, type: 'results_ready', message: `Test results for ${patient.name} are ready.`, read: false, createdAt: new Date() };
            await notificationsColl.insertOne(notif);
            emitToDoctor(req.io, patient.assignedDoctor.id, 'results:ready', { patientId, testName, result });
        }
        
        emitToPatient(req.io, patientId, 'results:uploaded', { testName });
        
        res.json({ message: 'Test results uploaded successfully' });
    } catch (err) {
        console.error('Error uploading test results:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/nurse/discharge-patient
 */
router.put('/discharge-patient', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const { patientId } = req.body;
        const patientsColl = getCollection('patients');
        const nursesColl = getCollection('nurses');
        
        const patient = await patientsColl.findOne({ _id: new ObjectId(patientId) });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        if (patient.billing?.status !== 'paid') {
            return res.status(400).json({ error: 'Cannot discharge. Billing is pending.' });
        }

        const visitSummary = {
            date: new Date(),
            doctorId: patient.assignedDoctor?.id,
            status: 'discharged',
            diagnosisSummary: patient.doctorFeedback || 'N/A'
        };

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { status: 'discharged', assignedNurse: null, assignedDoctor: null, issue: null },
                $push: { visitHistory: visitSummary }
            }
        );

        await nursesColl.updateOne(
            { _id: req.user._id },
            { $set: { isAvailable: true, currentPatient: null } }
        );

        emitToPatient(req.io, patientId, 'patient:discharged', { patientId });
        emitToNurse(req.io, req.user._id.toString(), 'patient:discharged', { patientId });
        emitToAdmin(req.io, 'workflow:updated', { patientId, newStatus: 'discharged' });

        res.json({ message: 'Patient discharged successfully' });
    } catch (err) {
        console.error('Error discharging patient:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
