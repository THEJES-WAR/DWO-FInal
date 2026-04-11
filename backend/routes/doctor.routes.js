const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');
const { verifyUser, verifyRole } = require('../middleware/auth');
const { emitToPatient, emitToNurse, emitToDoctor, emitToAdmin } = require('../socket/socketHandler');
const { logNotification } = require('../utils/notifications');

const router = express.Router();

/**
 * GET /api/doctor/dashboard
 */
router.get('/dashboard', verifyUser, verifyRole(['Doctor']), async (req, res) => {
    try {
        console.log(`[DoctorDashboard] Fetching profile for ID: ${req.user._id}`);
        const doctorsColl = getCollection('doctors');
        const doctor = await doctorsColl.findOne({ _id: new ObjectId(req.user._id) });
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        res.json({
            profile: {
                id: doctor._id.toString(),
                name: doctor.name,
                specialization: doctor.specialization
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/doctor/patients
 */
router.get('/patients', verifyUser, verifyRole(['Doctor']), async (req, res) => {
    try {
        const doctorId = req.user._id.toString();
        console.log(`[DoctorDashboard] Fetching assigned patients for ID: ${doctorId}`);
        const patientsColl = getCollection('patients');
        const patients = await patientsColl.find({ 'assignedDoctor.id': doctorId }).toArray();
        res.json(patients.map(p => ({
            id: p._id.toString(),
            name: p.name,
            status: p.status,
            issue: p.issue,
            vitals: p.vitals,
            doctorVisit: p.doctorVisit
        })));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/doctor/complete-consultation
 * Stage 8: Doctor completes consultation and generates random bill
 */
router.put('/complete-consultation', verifyUser, verifyRole(['Doctor']), async (req, res) => {
    try {
        const { patientId, feedback, prescriptions, noMedicine } = req.body;
        const patientsColl = getCollection('patients');
        const patient = await patientsColl.findOne({ _id: new ObjectId(patientId) });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const billNo = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
        
        const consultationFee = 300;
        let prescriptionFee = 0;
        
        if (!noMedicine && prescriptions?.length > 0) {
            // Random amount between 100 and 1000 if medicines prescribed
            prescriptionFee = Math.floor(Math.random() * 901) + 100; 
        }

        const totalAmount = consultationFee + prescriptionFee;

        const billing = {
            billNo,
            consultationFee,
            prescriptionFee,
            totalAmount,
            medicinalCharges: prescriptionFee, // Explicit for UI
            status: 'pending',
            generatedAt: new Date()
        };

        const finalPrescriptions = noMedicine ? [] : prescriptions;

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { 
                    status: 'billing_pending',
                    doctorFeedback: feedback,
                    prescriptions: finalPrescriptions, 
                    pharmacyStatus: noMedicine ? 'none' : 'ready_for_collection',
                    billing: billing,
                    consultationCompletedAt: new Date()
                }
            }
        );

        // Archive into medical_history
        const historyColl = getCollection('medical_history');
        await historyColl.insertOne({
            patientId: patientId,
            patientName: patient.name,
            doctorId: req.user._id.toString(),
            doctorName: req.user.name,
            date: new Date().toISOString().split('T')[0],
            feedback,
            prescriptions: finalPrescriptions,
            billNo,
            totalAmount,
            vitals: patient.vitals
        });

        emitToPatient(req.io, patientId, 'consultation:completed', { billing, prescriptions: finalPrescriptions });
        
        if (patient.assignedNurse) {
            emitToNurse(req.io, patient.assignedNurse.id, 'bill:pending', { 
                patientId: patientId, 
                patientName: patient.name,
                billNo,
                amount: totalAmount 
            });
        }

        res.json({ message: 'Consultation completed.', billNo, totalAmount });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/**
 * GET /api/doctor/notifications
 */
router.get('/notifications', verifyUser, verifyRole(['Doctor']), async (req, res) => {
    try {
        const notificationsColl = getCollection('notifications');
        const doctorId = req.user._id.toString();
        const notes = await notificationsColl
            .find({ recipientId: doctorId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
