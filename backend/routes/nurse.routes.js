const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');
const { verifyUser, verifyRole } = require('../middleware/auth');
const { emitToPatient, emitToNurse, emitToDoctor } = require('../socket/socketHandler');
const { defaultSlots, generateDefaultAvailability, normalizeDate, normalizeTime } = require('../utils/availability');
const { logNotification } = require('../utils/notifications');

const router = express.Router();

/**
 * GET /api/nurse/dashboard
 */
router.get('/dashboard', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const nursesColl = getCollection('nurses');
        const nurse = await nursesColl.findOne({ _id: new ObjectId(req.user._id) });

        if (!nurse) return res.status(404).json({ error: 'Nurse not found' });

        res.json({
            profile: {
                id: nurse._id.toString(),
                name: nurse.name,
                ward: nurse.ward || 'General Ward',
                contact: nurse.contact || nurse.phone || 'Extension 204'
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/nurse/patients
 */
router.get('/patients', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const patientsColl = getCollection('patients');
        const nurseId = req.user._id.toString();
        const patients = await patientsColl.find({ 'assignedNurse.id': nurseId }).toArray();
        res.json(patients.map(p => ({
            id: p._id.toString(),
            name: p.name,
            status: p.status,
            issue: p.issue,
            vitals: p.vitals,
            billing: p.billing,
            nurseVisit: p.nurseVisit,
            vitalsProcess: p.vitalsProcess || null,
            prescriptions: p.prescriptions || [],
            createdAt: p.createdAt || null
        })));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/nurse/collect-vitals
 * Stage 4: Nurse collects vitals (BP, Sugar, HR, Temp)
 */
router.put('/collect-vitals', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const {
            patientId,
            height,
            weight,
            bp,
            sugar,
            heartRate,
            temperature,
            oxygenSaturation,
            notes
        } = req.body;
        const patientsColl = getCollection('patients');
        const patient = await patientsColl.findOne({ _id: new ObjectId(patientId) });

        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        if (patient.assignedNurse?.id !== req.user._id.toString()) {
            return res.status(403).json({ error: 'This patient is not assigned to you' });
        }

        const vitalsPayload = {
            height,
            weight,
            bp,
            sugar,
            heartRate,
            temperature,
            oxygenSaturation,
            notes: notes || '',
            collectedAt: new Date()
        };

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { 
                    status: 'vitals_collected',
                    vitals: vitalsPayload
                }
            }
        );

        emitToPatient(req.io, patientId, 'vitals:collected', { vitals: vitalsPayload });
        await logNotification(patientId, 'Patient', 'Your vitals have been recorded. Please choose your specialist.', 'success', req.user.name);

        res.json({ message: 'Vitals collected successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/nurse/discharge-patient
 * Final Stage: Nurse discharges patient after billing
 */
router.put('/discharge-patient', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const { patientId } = req.body;
        const patientsColl = getCollection('patients');
        const patient = await patientsColl.findOne({ _id: new ObjectId(patientId) });

        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const historyObject = {
            visitId: new ObjectId(),
            date: new Date().toISOString(), // Fix "Invalid Date"
            dischargedAt: new Date(),
            nursePhase: {
                assignedAt: patient.issue?.submittedAt,
                vitalsAt: patient.vitals?.collectedAt,
                nurseName: patient.assignedNurse?.name,
                vitals: patient.vitals
            },
            doctorPhase: {
                doctorName: patient.assignedDoctor?.name,
                specialization: patient.assignedDoctor?.specialization,
                feedback: patient.doctorFeedback,
                prescriptions: patient.prescriptions,
                completedAt: patient.consultationCompletedAt
            },
            billingPhase: {
                billNo: patient.billing?.billNo,
                totalAmount: patient.billing?.totalAmount,
                consultationFee: patient.billing?.consultationFee,
                prescriptionFee: patient.billing?.prescriptionFee,
                paymentMethod: patient.billing?.method,
                paidAt: patient.billing?.paidAt
            }
        };

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { 
                    status: 'registered',
                    visitHistory: patient.visitHistory ? [...patient.visitHistory, historyObject] : [historyObject]
                },
                $unset: {
                    issue: "", vitals: "", nurseVisit: "", doctorVisit: "",
                    assignedNurse: "", assignedDoctor: "", prescriptions: "",
                    billing: "", doctorFeedback: "", vitalsProcess: "",
                    isHistorical: "", dischargedAt: "", pharmacyStatus: ""
                }
            }
        );

        emitToPatient(req.io, patientId, 'patient:discharged', { message: 'You have been discharged. Your visit details are safely archived.' });
        await logNotification(patientId, 'Patient', 'You have been discharged safely.', 'success', req.user.name);

        res.json({ message: 'Patient discharged successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/nurse/book-patient-slot
 * Nurse books the next available slot for the patient in their own schedule.
 */
router.post('/book-patient-slot', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const { patientId } = req.body;
        const nurseId = req.user._id.toString();
        const nursesColl = getCollection('nurses');
        const patientsColl = getCollection('patients');

        const nurse = await nursesColl.findOne({ _id: new ObjectId(nurseId) });
        const patient = await patientsColl.findOne({ _id: new ObjectId(patientId) });

        if (!nurse || !patient) return res.status(404).json({ error: 'Nurse or Patient not found' });

        const availability = (nurse.availability && nurse.availability.length > 0)
            ? nurse.availability
            : generateDefaultAvailability(7);

        const currentAvailability = availability.find(a => {
            const today = new Date().toISOString().split('T')[0];
            return normalizeDate(a.date) >= today;
        });

        if (!currentAvailability) {
            return res.status(400).json({ error: 'No upcoming slots available in your schedule.' });
        }

        const bookedPatients = await patientsColl.find({
            'assignedNurse.id': nurseId,
            'nurseVisit.date': normalizeDate(currentAvailability.date),
            status: { $in: ['vitals_scheduled', 'vitals_collected', 'doctor_pending', 'billing_pending'] }
        }).toArray();

        const bookedTimes = bookedPatients.map(p => normalizeTime(p.nurseVisit?.time));
        const slotsToUse = (currentAvailability.slots || defaultSlots).map(normalizeTime);
        const nextSlot = slotsToUse.find(slot => !bookedTimes.includes(slot));

        if (!nextSlot) {
            return res.status(400).json({ error: 'All slots for your next available day are fully booked.' });
        }

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { 
                    status: 'vitals_scheduled',
                    nurseVisit: {
                        date: normalizeDate(currentAvailability.date),
                        time: nextSlot,
                        bookedAt: new Date(),
                        bookedBy: 'Nurse'
                    }
                }
            }
        );

        emitToPatient(req.io, patientId, 'visit:confirmed', { date: normalizeDate(currentAvailability.date), time: nextSlot });
        await logNotification(patientId, 'Patient', `Nurse visit scheduled for ${normalizeDate(currentAvailability.date)} at ${nextSlot}.`, 'info', req.user.name);

        res.json({ message: `Slot booked for ${normalizeDate(currentAvailability.date)} at ${nextSlot}.`, date: normalizeDate(currentAvailability.date), time: nextSlot });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/**
 * GET /api/nurse/notifications
 */
router.get('/notifications', verifyUser, verifyRole(['Nurse']), async (req, res) => {
    try {
        const notificationsColl = getCollection('notifications');
        const nurseId = req.user._id.toString();
        const notes = await notificationsColl
            .find({ recipientId: nurseId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
