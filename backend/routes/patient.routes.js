const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');
const { verifyUser, verifyRole } = require('../middleware/auth');
const { emitToPatient, emitToNurse, emitToDoctor } = require('../socket/socketHandler');
const { logNotification } = require('../utils/notifications');
const { defaultSlots, generateDefaultAvailability, normalizeDate, normalizeTime } = require('../utils/availability');

const router = express.Router();

let roundRobinIndex = 0;

const UPCOMING_STATUSES = ['vitals_scheduled', 'doctor_pending', 'billing_pending'];

const ACTIVE_NURSE_BOOKING_STATUSES = [
    'pending_vitals',
    'vitals_scheduled',
    'vitals_collected',
    'doctor_pending',
    'billing_pending',
    'payment_completed'
];

/**
 * GET /api/patient/dashboard
 */
router.get('/dashboard', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const patientsColl = getCollection('patients');
        const appointmentsColl = getCollection('appointments');
        const notificationsColl = getCollection('notifications');

        const patientRecord = await patientsColl.findOne({ _id: new ObjectId(req.user._id) });
        if (!patientRecord) return res.status(404).json({ error: 'Patient not found' });

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
            assignedNurse: patientRecord.assignedNurse || null,
            assignedDoctor: patientRecord.assignedDoctor || null,
            nurseVisit: patientRecord.nurseVisit || null,
            vitals: patientRecord.vitals || null,
            doctorFeedback: patientRecord.doctorFeedback || '',
            prescriptions: patientRecord.prescriptions || [],
            billing: patientRecord.billing || null,
            visitHistory: patientRecord.visitHistory || [],
            appointments: await appointmentsColl.find({ patientId: req.user._id.toString() }).toArray(),
            notifications: await notificationsColl.find({ patientId: req.user._id.toString() }).limit(10).toArray()
        };

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/patient/submit-issue
 * Stage 2: Patient submits symptoms. Status -> pending_vitals.
 */
router.post('/submit-issue', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const { description } = req.body;
        const patientsColl = getCollection('patients');
        const nursesColl = getCollection('nurses');

        const nurses = await nursesColl.find({ role: 'Nurse' }).toArray();
        if (nurses.length === 0) return res.status(500).json({ error: 'No nurses available' });

        // Calculate load for each nurse
        const nurseLoads = await Promise.all(nurses.map(async (n) => {
            const count = await patientsColl.countDocuments({ 
                'assignedNurse.id': n._id.toString(),
                status: { $in: ['pending_vitals', 'vitals_scheduled'] }
            });
            return { nurse: n, count };
        }));

        nurseLoads.sort((a, b) => a.count - b.count);
        const nurse = nurseLoads[0].nurse;

        const update = {
            $set: {
                status: 'pending_vitals',
                issue: { description, submittedAt: new Date() },
                assignedNurse: {
                    id: nurse._id.toString(),
                    name: nurse.name,
                    ward: nurse.ward,
                    contact: nurse.contact
                }
            }
        };

        await patientsColl.updateOne({ _id: new ObjectId(req.user._id) }, update);

        emitToNurse(req.io, nurse._id.toString(), 'patient:assigned', {
            patientId: req.user._id,
            patientName: req.user.name,
            message: `New patient ${req.user.name} assigned for vitals.`
        });
        await logNotification(nurse._id, 'Nurse', `Patient ${req.user.name} assigned to you for vitals.`, 'info', 'System');
        await logNotification(req.user._id, 'Patient', `You have been assigned to Nurse ${nurse.name}. Please book your vitals checkup.`, 'info', 'System');

        res.json({ message: 'Symptoms submitted. Please book your vitals checkup.', status: 'pending_vitals' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/patient/nurse-availability/:nurseId
 */
router.get('/nurse-availability/:nurseId', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const nursesColl = getCollection('nurses');
        const patientsColl = getCollection('patients');
        const nurse = await nursesColl.findOne({ _id: new ObjectId(req.params.nurseId) });
        if (!nurse) return res.status(404).json({ error: 'Nurse not found' });

        const bookedPatients = await patientsColl.find({
            'assignedNurse.id': req.params.nurseId,
            status: { $in: ACTIVE_NURSE_BOOKING_STATUSES }
        }).project({ nurseVisit: 1 }).toArray();

        const bookedSlotsByDate = bookedPatients.reduce((acc, entry) => {
            const visitDate = normalizeDate(entry.nurseVisit?.date);
            const visitTime = normalizeTime(entry.nurseVisit?.time);
            if (!visitDate || !visitTime) return acc;
            acc[visitDate] = acc[visitDate] || [];
            acc[visitDate].push(visitTime);
            return acc;
        }, {});

        const availability = (nurse.availability && nurse.availability.length > 0) 
            ? nurse.availability 
            : generateDefaultAvailability(4);

        const now = new Date();
        const todayStr = normalizeDate(now);
        const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const result = availability.map((entry) => {
            const entryDate = normalizeDate(entry.date);
            const bookedSlots = bookedSlotsByDate[entryDate] || [];
            const normalizedSlots = (entry.slots || []).map(normalizeTime);
            let openSlots = normalizedSlots.filter(slot => !bookedSlots.includes(slot));

            if (entryDate === todayStr) {
                openSlots = openSlots.filter(s => s > currentTimeStr);
            }

            return {
                date: entryDate,
                slots: normalizedSlots,
                bookedSlots,
                openSlots
            };
        });

        res.json({ availability: result });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/patient/book-nurse
 */
router.post('/book-nurse', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const { date, time } = req.body;
        const patientsColl = getCollection('patients');
        const nursesColl = getCollection('nurses');

        const patient = await patientsColl.findOne({ _id: new ObjectId(req.user._id) });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        if (!patient.assignedNurse) return res.status(400).json({ error: 'No nurse assigned' });

        const normalizedDate = normalizeDate(date);
        const normalizedTime = normalizeTime(time);
        if (!normalizedDate || !normalizedTime) return res.status(400).json({ error: 'Date and time are required' });

        const nurse = await nursesColl.findOne({ _id: new ObjectId(patient.assignedNurse.id) });
        if (!nurse) return res.status(404).json({ error: 'Assigned nurse not found' });

        const availability = (nurse.availability && nurse.availability.length > 0) 
            ? nurse.availability 
            : generateDefaultAvailability(7);

        const entryForDate = availability.find(e => normalizeDate(e.date) === normalizedDate);
        const validSlots = (entryForDate && entryForDate.slots?.length > 0)
            ? entryForDate.slots.map(normalizeTime)
            : defaultSlots.map(normalizeTime);

        if (!validSlots.includes(normalizedTime)) {
            // Permissive Check (Emergency Unblock)
            if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
                return res.status(400).json({ error: 'Invalid time format. Expected HH:MM' });
            }
        }

        await patientsColl.updateOne(
            { _id: patient._id },
            { 
                $set: { 
                    status: 'vitals_scheduled',
                    nurseVisit: {
                        date: normalizedDate,
                        time: normalizedTime,
                        bookedAt: new Date()
                    }
                }
            }
        );

        emitToNurse(req.io, patient.assignedNurse.id, 'visit:confirmed', {
            patientId: req.user._id,
            patientName: patient.name,
            date: normalizedDate,
            time: normalizedTime
        });
        emitToPatient(req.io, req.user._id, 'visit:confirmed', { date: normalizedDate, time: normalizedTime });
        await logNotification(patient.assignedNurse.id, 'Nurse', `Visit confirmed for ${patient.name} at ${normalizedTime}.`, 'success', req.user.name);
        await logNotification(req.user._id, 'Patient', `Your nurse visit is confirmed for ${normalizedDate} at ${normalizedTime}.`, 'success', req.user.name);

        res.json({ message: 'Nurse visit scheduled.', nurseVisit: { date: normalizedDate, time: normalizedTime } });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

/**
 * GET /api/patient/doctor-list
 */
router.get('/doctor-list', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const { specialization } = req.query;
        const doctorsColl = getCollection('doctors');
        const appointmentsColl = getCollection('appointments');
        
        const query = { status: 'Available' };
        if (specialization) query.specialization = specialization;
        
        const doctors = await doctorsColl.find(query).toArray();
        console.log(`[DoctorList] Found ${doctors.length} doctors for spec: ${specialization || 'ALL'}`);
        
        const result = await Promise.all(doctors.map(async d => {
            const availability = (d.availability && d.availability.length > 0) ? d.availability : generateDefaultAvailability(4);
            const bookedApps = await appointmentsColl.find({ 
                doctorId: d._id.toString(),
                status: { $in: ['scheduled', 'in_progress'] } 
            }).toArray();

            const bookedByDate = bookedApps.reduce((acc, app) => {
                const dNorm = normalizeDate(app.date);
                acc[dNorm] = acc[dNorm] || [];
                acc[dNorm].push(normalizeTime(app.time));
                return acc;
            }, {});

            const processedAvailability = availability.map(entry => {
                const entryDate = normalizeDate(entry.date);
                const booked = bookedByDate[entryDate] || [];
                const normSlots = (entry.slots || []).map(normalizeTime);
                
                const now = new Date();
                const todayStr = normalizeDate(now);
                const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                let openSlots = normSlots.filter(s => !booked.includes(s));
                if (entryDate === todayStr) {
                    openSlots = openSlots.filter(s => s > currentTimeStr);
                }

                return {
                    date: entryDate,
                    slots: normSlots,
                    bookedSlots: booked,
                    openSlots: openSlots
                };
            });

            return {
                id: d._id.toString(),
                name: d.name,
                specialization: d.specialization,
                availability: processedAvailability
            };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/patient/choose-doctor
 */
router.post('/choose-doctor', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const { doctorId, date, time } = req.body;
        const patientsColl = getCollection('patients');
        const doctorsColl = getCollection('doctors');

        const doctor = await doctorsColl.findOne({ _id: new ObjectId(doctorId) });
        if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

        const normalizedDate = normalizeDate(date);
        const normalizedTime = normalizeTime(time);

        const availability = (doctor.availability && doctor.availability.length > 0) 
            ? doctor.availability 
            : generateDefaultAvailability(7);

        const entryForDate = availability.find(e => normalizeDate(e.date) === normalizedDate);
        const validSlots = (entryForDate && entryForDate.slots?.length > 0)
            ? entryForDate.slots.map(normalizeTime)
            : defaultSlots.map(normalizeTime);

        if (!validSlots.includes(normalizedTime)) {
            if (!/^\d{2}:\d{2}$/.test(normalizedTime)) {
                return res.status(400).json({ error: 'Invalid time format. Expected HH:MM' });
            }
        }

        await patientsColl.updateOne(
            { _id: new ObjectId(req.user._id) },
            { 
                $set: { 
                    status: 'doctor_pending',
                    assignedDoctor: {
                        id: doctor._id.toString(),
                        name: doctor.name,
                        specialization: doctor.specialization
                    },
                    doctorVisit: { date: normalizedDate, time: normalizedTime }
                }
            }
        );

        emitToDoctor(req.io, doctorId, 'patient:queued', { patientId: req.user._id, patientName: req.user.name, time: normalizedTime });
        await logNotification(doctorId, 'Doctor', `New patient ${req.user.name} queued for ${normalizedTime}.`, 'info', req.user.name);
        await logNotification(req.user._id, 'Patient', `Appointment booked with ${doctor.name} at ${normalizedTime}.`, 'success', req.user.name);

        res.json({ message: 'Doctor selected.', doctorVisit: { date: normalizedDate, time: normalizedTime } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * POST /api/patient/pay-bill
 */
router.post('/pay-bill', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const { amount, method } = req.body;
        const patientsColl = getCollection('patients');
        const patient = await patientsColl.findOne({ _id: new ObjectId(req.user._id) });

        if (!patient.billing) return res.status(400).json({ error: 'No billing info' });

        const isCash = method === 'cash';

        await patientsColl.updateOne(
            { _id: new ObjectId(req.user._id) },
            { 
                $set: { 
                    'billing.status': isCash ? 'pending_cash' : 'paid',
                    'billing.method': method || 'card',
                    'billing.paidAt': isCash ? null : new Date(),
                    status: isCash ? 'payment_pending_cash' : 'payment_completed'
                }
            }
        );

        if (patient.assignedNurse) {
            emitToNurse(req.io, patient.assignedNurse.id, 'bill:paid', { 
                patientId: req.user._id, 
                amount,
                method
            });
        }

        res.json({ message: 'Payment successful!' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/patient/history
 */
router.get('/history', verifyUser, verifyRole(['Patient']), async (req, res) => {
    try {
        const patientsColl = getCollection('patients');
        const patient = await patientsColl.findOne({ _id: new ObjectId(req.user._id) });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });
        res.json(patient.visitHistory || []);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/patient/notifications
 */
router.get('/notifications', verifyUser, verifyRole(['Patient', 'Nurse', 'Doctor']), async (req, res) => {
    try {
        const notificationsColl = await getCollection('notifications');
        const notes = await notificationsColl.find({ recipientId: req.user._id.toString() }).sort({ createdAt: -1 }).limit(20).toArray();
        res.json(notes);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/patient/notifications/mark-read
 */
router.put('/notifications/mark-read', verifyUser, verifyRole(['Patient', 'Nurse', 'Doctor']), async (req, res) => {
    try {
        const notificationsColl = getCollection('notifications');
        await notificationsColl.updateMany(
            { recipientId: req.user._id.toString() },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * PUT /api/patient/notifications/:id/mark-read
 */
router.put('/notifications/:id/mark-read', verifyUser, verifyRole(['Patient', 'Nurse', 'Doctor']), async (req, res) => {
    try {
        const notificationsColl = getCollection('notifications');
        await notificationsColl.updateOne(
            { _id: new ObjectId(req.params.id), recipientId: req.user._id.toString() },
            { $set: { read: true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/patient/upcoming
 * Shared endpoint for sidebars (time-sorted)
 */
router.get('/upcoming', verifyUser, verifyRole(['Patient', 'Nurse', 'Doctor']), async (req, res) => {
    try {
        const patientsColl = getCollection('patients');
        let query = { status: { $in: UPCOMING_STATUSES } };
        
        if (req.user.role === 'Nurse') {
            query['assignedNurse.id'] = req.user._id.toString();
        } else if (req.user.role === 'Doctor') {
            query['assignedDoctor.id'] = req.user._id.toString();
        } else {
            query._id = new ObjectId(req.user._id);
        }

        const patients = await patientsColl.find(query).toArray();
        
        // Sort by time (nurse visit time or doctor visit time)
        const sorted = patients.sort((a, b) => {
            const timeA = a.doctorVisit?.time || a.nurseVisit?.time || '00:00';
            const timeB = b.doctorVisit?.time || b.nurseVisit?.time || '00:00';
            return timeA.localeCompare(timeB);
        });

        res.json(sorted.map(p => ({
            id: p._id.toString(),
            name: p.name,
            status: p.status,
            time: p.doctorVisit?.time || p.nurseVisit?.time,
            date: p.doctorVisit?.date || p.nurseVisit?.date,
            type: p.doctorVisit?.time ? 'Doctor' : 'Nurse'
        })));
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
