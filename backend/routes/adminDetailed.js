const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');

const router = express.Router();

// Middleware to verify Admin
const verifyAdmin = (req, res, next) => {
  const user = req.headers['x-user'];
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const parsed = JSON.parse(user);
    if (parsed.role !== 'Admin') return res.status(403).json({ error: 'Admin only access' });
    req.user = parsed;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid user data' });
  }
};

// Map patient status to a human-readable care stage
function statusToStage(status) {
  const map = {
    'registered':        'Arrival / Registration',
    'pending_vitals':    'Nurse Check-in',
    'vitals_scheduled':  'Nurse Check-in',
    'vitals_collected':  'Doctor Selection',
    'doctor_pending':    'Doctor Consultation',
    'billing_pending':   'Billing / Pharmacy',
    'pharmacy_pending':  'Pharmacy Dispensing',
    'payment_completed': 'Ready for Discharge',
    'discharged':        'Discharged',
  };
  return map[status] || status;
}

// Funnel position (0-7)
function statusToFunnelIdx(status) {
  const map = {
    'registered': 0,
    'pending_vitals': 1, 'vitals_scheduled': 1,
    'vitals_collected': 2,
    'doctor_pending': 3,
    'billing_pending': 4, 'pharmacy_pending': 4,
    'payment_completed': 5,
    'discharged': 6
  };
  return map[status] ?? 0;
}

/* ─── GET /api/admin-new/detailed-workflow ─── */
router.get('/detailed-workflow', verifyAdmin, async (req, res) => {
  try {
    const patientsColl = getCollection('patients');
    const doctorsColl  = getCollection('doctors');
    const nursesColl   = getCollection('nurses');

    // All non-discharged active patients
    const allPatients  = await patientsColl.find({}).toArray();
    const active       = allPatients.filter(p => p.status !== 'discharged');
    const totalDoctors = await doctorsColl.countDocuments({});
    const totalNurses  = await nursesColl.countDocuments({});

    // Build funnel data from actual patient statuses
    const funnelData = [
      { name: 'Registration',    count: 0 },
      { name: 'Nurse Check-in',  count: 0 },
      { name: 'Doctor Select',   count: 0 },
      { name: 'Consultation',    count: 0 },
      { name: 'Billing',         count: 0 },
      { name: 'Pre-Discharge',   count: 0 },
      { name: 'Discharged',      count: 0 },
    ];

    allPatients.forEach(p => {
      const idx = statusToFunnelIdx(p.status);
      if (funnelData[idx]) funnelData[idx].count++;
    });

    // Dept breakdown based on assigned doctor specialization
    const deptMap = {};
    active.forEach(p => {
      const dept = p.assignedDoctor?.specialization || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

    // Table data — sanitized list of all patients
    const tableData = allPatients.map(p => ({
      _id: p._id.toString(),
      patientId: p._id.toString(),
      name: p.name,
      email: p.email,
      status: p.status,
      stage: statusToStage(p.status),
      assignedNurse: p.assignedNurse || null,
      assignedDoctor: p.assignedDoctor || null,
      issue: p.issue || null,
      createdAt: p.createdAt || p._id.getTimestamp(),
      billing: p.billing || null,
    }));

    res.json({
      overview: {
        totalPatients: allPatients.length,
        activePatients: active.length,
        activeDoctors: totalDoctors,
        activeNurses: totalNurses,
        inProgress: active.length,
        avgWaitTime: active.length > 0 ? `${Math.max(5, Math.floor(active.length * 3.5))} mins` : '0 mins',
        bedOccupancy: totalNurses > 0 ? `${Math.min(99, Math.floor((active.length / Math.max(totalNurses, 1)) * 100))}%` : '0%',
        emergencies: active.filter(p => p.status === 'billing_pending').length,
      },
      tableData,
      funnelData,
      deptData,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─── GET /api/admin-new/live-patients ─── */
router.get('/live-patients', verifyAdmin, async (req, res) => {
  try {
    const patientsColl = getCollection('patients');
    const patients = await patientsColl.find({ status: { $ne: 'discharged' } }).toArray();
    res.json(patients.map(p => ({
      id: p._id.toString(),
      name: p.name,
      email: p.email,
      status: p.status,
      stage: statusToStage(p.status),
      assignedNurse: p.assignedNurse,
      assignedDoctor: p.assignedDoctor,
      issue: p.issue,
      createdAt: p.createdAt || p._id.getTimestamp(),
    })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─── GET /api/admin-new/staff ─── */
router.get('/staff', verifyAdmin, async (req, res) => {
  try {
    const [doctors, nurses] = await Promise.all([
      getCollection('doctors').find({}, { projection: { password: 0 } }).toArray(),
      getCollection('nurses').find({}, { projection: { password: 0 } }).toArray(),
    ]);

    const mappedDoctors = doctors.map(d => ({
      id: d._id.toString(),
      name: d.name,
      role: 'Doctor',
      specialization: d.specialization || 'General',
      email: d.email,
      phone: d.phone || '+91 98400 00000',
      status: 'Available',
      type: d.specialization || 'General Medicine',
    }));

    const mappedNurses = nurses.map(n => ({
      id: n._id.toString(),
      name: n.name,
      role: 'Nurse',
      specialization: n.type || 'General Nursing',
      email: n.email,
      phone: n.phone || '+91 94400 00000',
      status: 'Available',
      type: n.type || 'Head Nurse',
    }));

    res.json({ doctors: mappedDoctors, nurses: mappedNurses, total: doctors.length + nurses.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

/* ─── POST /api/admin-new/remind ─── */
router.post('/remind', verifyAdmin, async (req, res) => {
  try {
    const { patientId, message, targetRole, targetId, targetName } = req.body;
    const notificationsColl = getCollection('notifications');

    const newNote = {
      recipientId: targetId,
      recipientRole: targetRole,
      patientId: patientId || null,
      type: 'admin_reminder',
      senderName: 'System Admin',
      message: message || `Admin Reminder: Please attend to your pending patient task.`,
      createdAt: new Date(),
      read: false,
    };

    const result = await notificationsColl.insertOne(newNote);
    const saved  = { ...newNote, _id: result.insertedId.toString() };

    // Emit to correct socket room
    if (req.io) {
      // Patient room: patient:id, Doctor room: doctor:id
      const room = `${targetRole.toLowerCase()}:${targetId}`;
      req.io.to(room).emit('admin:reminder', saved);
      // Also try generic patient socket room used in other parts of app
      if (targetRole === 'Patient') {
        req.io.to(targetId).emit('admin:reminder', saved);
      }
    }

    res.json({ success: true, notification: saved });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending reminder' });
  }
});

module.exports = router;
