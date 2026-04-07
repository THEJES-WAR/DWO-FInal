const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');

const router = express.Router();

/* ─── Middleware ─── */
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

/* ─── Helpers ─── */
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

    // Only include patients who have actually started the care workflow (nurse assigned / symptoms submitted)
    const allPatients = await patientsColl.find({
      status: { $ne: 'registered' },
      assignedNurse: { $exists: true, $ne: null }
    }).toArray();

    const active       = allPatients.filter(p => p.status !== 'discharged');
    const totalDoctors = await doctorsColl.countDocuments({});
    const totalNurses  = await nursesColl.countDocuments({});

    const funnelData = [
      { name: 'Nurse Check-in', count: 0 },
      { name: 'Doctor Select',  count: 0 },
      { name: 'Consultation',   count: 0 },
      { name: 'Billing',        count: 0 },
      { name: 'Pre-Discharge',  count: 0 },
      { name: 'Discharged',     count: 0 },
    ];

    allPatients.forEach(p => {
      let idx = statusToFunnelIdx(p.status);
      // Adjust index because we removed 'Registration' (idx 0) from the funnel display
      const adjustedIdx = idx - 1; 
      if (adjustedIdx >= 0 && funnelData[adjustedIdx]) {
        funnelData[adjustedIdx].count++;
      } else if (p.status === 'discharged') {
        funnelData[5].count++; // Manual safeguard for discharged
      }
    });

    const deptMap = {};
    active.forEach(p => {
      const dept = p.assignedDoctor?.specialization || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    });
    const deptData = Object.entries(deptMap).map(([name, value]) => ({ name, value }));

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

    // Only patients who have submitted symptoms (nurse assigned) and are in the active pipeline
    const ACTIVE_STATUSES = [
      'pending_vitals', 'vitals_scheduled', 'vitals_collected',
      'doctor_pending', 'billing_pending', 'pharmacy_pending',
      'payment_completed', 'discharged'
    ];

    const patients = await patientsColl.find({
      assignedNurse: { $exists: true, $ne: null },
      status: { $in: ACTIVE_STATUSES }
    }).toArray();

    res.json(patients.map(p => ({
      id: p._id.toString(),
      name: p.name,
      email: p.email,
      status: p.status,
      stage: statusToStage(p.status),
      assignedNurse: p.assignedNurse || null,
      assignedDoctor: p.assignedDoctor || null,
      issue: p.issue || null,
      doctorVisit: p.doctorVisit || null,
      createdAt: p.createdAt || null,
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

/* ─── GET /api/admin-new/all-appointments ─── */
router.get('/all-appointments', verifyAdmin, async (req, res) => {
  try {
    const apptColl    = getCollection('appointments');
    const patientColl = getCollection('patients');

    const now   = new Date();
    const today = now.toISOString().split('T')[0];

    const allAppts = await apptColl.find({}).sort({ date: 1, time: 1 }).toArray();

    const enriched = await Promise.all(allAppts.map(async (appt) => {
      let staffName = appt.doctorName || appt.nurseName || appt.staffName || 'Unknown Staff';
      let staffRole = appt.staffRole || (appt.doctorEmail ? 'Doctor' : appt.nurseEmail ? 'Nurse' : 'Staff');
      let patientName = appt.patientName || appt.patientEmail || 'Unknown';

      if (appt.patientEmail && (!appt.patientName || appt.patientName === 'Unknown')) {
        const p = await patientColl.findOne({ email: appt.patientEmail }, { projection: { name: 1 } });
        if (p) patientName = p.name;
      }

      const apptDateTime = new Date(`${appt.date}T${appt.time || '00:00'}:00`);
      const isOverdue = apptDateTime < now && !['completed','cancelled','Cancelled_By_Patient'].includes(appt.status);
      const isMissed  = apptDateTime < now && appt.status === 'booked';
      const isToday   = appt.date === today;

      return {
        id: appt._id.toString(),
        date: appt.date,
        time: appt.time || '09:00',
        status: appt.status,
        patientName,
        patientEmail: appt.patientEmail || '',
        staffName,
        staffRole,
        specialization: appt.specialization || appt.department || '',
        isOverdue,
        isMissed,
        isToday,
        apptDateTime: apptDateTime.toISOString(),
      };
    }));

    const alerts    = enriched.filter(a => a.isMissed);
    const upcoming  = enriched.filter(a => !a.isMissed && !['completed','cancelled','Cancelled_By_Patient'].includes(a.status));
    const completed = enriched.filter(a => ['completed','cancelled','Cancelled_By_Patient'].includes(a.status));

    res.json({ all: enriched, alerts, upcoming, completed, total: allAppts.length });
  } catch (err) {
    console.error(err);
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
      message: message || 'Admin Reminder: Please attend to your pending patient task.',
      createdAt: new Date(),
      read: false,
    };

    const result = await notificationsColl.insertOne(newNote);
    const saved  = { ...newNote, _id: result.insertedId.toString() };

    if (req.io) {
      req.io.to(`${targetRole.toLowerCase()}:${targetId}`).emit('admin:reminder', saved);
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
