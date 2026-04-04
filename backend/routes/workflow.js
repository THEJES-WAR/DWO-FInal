const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');

const router = express.Router();

// Middleware to verify user (similar to auth)
const verifyUser = (req, res, next) => {
  const user = req.headers['x-user'];
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    req.user = JSON.parse(user);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid user data' });
  }
};

// 1. DOCTOR: Mark Unavailable & Cancel Appointments
router.post('/doctor/unavailable', verifyUser, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') return res.status(403).json({ error: 'Only doctors can do this' });
    
    const appointments = getCollection('appointments');
    const notifications = getCollection('notifications');
    const doctors = getCollection('doctors');

    // Update doctor status
    await doctors.updateOne({ email: req.user.email }, { $set: { status: 'Unavailable' } });

    // Cancel all booked appointments today downwards that are not already cancelled
    const today = new Date().toISOString().split('T')[0];
    const affectedAppts = await appointments.find({
      doctorEmail: req.user.email,
      status: 'booked',
      date: { $gte: today }
    }).toArray();

    for (let appt of affectedAppts) {
      await appointments.updateOne({ _id: appt._id }, { $set: { status: 'Cancelled_By_Doctor' } });
      
      // Notify Patient
      await notifications.insertOne({
        patientId: appt.patientId,
        message: `Dr. ${req.user.name} is unavailable. Your appointment on ${appt.date} at ${appt.time} has been cancelled. Please reschedule.`,
        appointmentId: appt._id.toString(),
        isRead: false,
        createdAt: new Date()
      });
    }

    res.json({ message: 'Marked unavailable and cancelled ' + affectedAppts.length + ' appointments', count: affectedAppts.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. PATIENT: Get Notifications
router.get('/patient/notifications', verifyUser, async (req, res) => {
  try {
    if (req.user.role !== 'Patient') return res.status(403).json({ error: 'Patient only' });
    const notifications = await getCollection('notifications').find({ patientId: req.user._id }).sort({ createdAt: -1 }).toArray();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. PATIENT: Get Reschedule Options for a Cancelled Appointment
router.get('/patient/reschedule-options/:appointmentId', verifyUser, async (req, res) => {
  try {
    const appointments = getCollection('appointments');
    const appt = await appointments.findOne({ _id: new ObjectId(req.params.appointmentId) });
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    const today = new Date().toISOString().split('T')[0];

    // Option 1: Same Doctor, Next Available Slot
    const sameDoctorNext = await appointments.findOne({
      doctorEmail: appt.doctorEmail,
      status: 'available',
      date: { $gte: today }
    }, { sort: { date: 1, time: 1 } });

    // Option 2: Different Doctor, Same Specialty, Earliest Available
    const sameSpecialtyOtherDocs = await appointments.find({
      specialization: appt.specialization,
      doctorEmail: { $ne: appt.doctorEmail },
      status: 'available',
      date: { $gte: today }
    }).sort({ date: 1, time: 1 }).limit(3).toArray();

    res.json({
      original: appt,
      sameDoctor: sameDoctorNext,
      sameSpecialty: sameSpecialtyOtherDocs
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3.1 PATIENT: Confirm Reschedule
router.post('/patient/reschedule', verifyUser, async (req, res) => {
    try {
      const { oldAppointmentId, newAppointmentId } = req.body;
      const appointments = getCollection('appointments');
      
      const oldAppt = await appointments.findOne({ _id: new ObjectId(oldAppointmentId) });
      const newAppt = await appointments.findOne({ _id: new ObjectId(newAppointmentId) });
  
      if (!oldAppt || !newAppt || newAppt.status !== 'available') return res.status(400).json({ error: 'Invalid slots' });
  
      await appointments.updateOne({ _id: newAppt._id }, {
        $set: {
          status: 'booked',
          patientId: oldAppt.patientId,
          patientName: oldAppt.patientName,
          patientEmail: oldAppt.patientEmail,
          rescheduledFrom: oldAppt._id.toString()
        }
      });
  
      await appointments.updateOne({ _id: oldAppt._id }, { $set: { status: 'Rescheduled' } });
      res.json({ message: 'Rescheduled successfully', appointment: newAppt });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

// 4. NURSE: Get Vitals Context (Memory Logic)
router.get('/nurse/vitals-context/:patientId', verifyUser, async (req, res) => {
  try {
    const vitals = getCollection('vitals');
    const lastVitals = await vitals.find({ patientId: req.params.patientId }).sort({ recordedAt: -1 }).limit(1).toArray();
    
    if (lastVitals.length === 0) {
      return res.json({ hasHistory: false, message: 'New patient, collect all vitals.' });
    }

    const last = lastVitals[0];
    const daysOld = (new Date() - new Date(last.recordedAt)) / (1000 * 60 * 60 * 24);

    if (daysOld < 30) {
      return res.json({
        hasHistory: true,
        reuseHeightWeight: true,
        lastVitals: last,
        message: 'Patient seen recently. Height and Weight pre-filled.'
      });
    }

    res.json({ hasHistory: true, reuseHeightWeight: false, lastVitals: last, message: 'Vitals outdated. Collect all new vitals.' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. NURSE / ADMIN: Tasks Queue
router.get('/tasks', verifyUser, async (req, res) => {
  try {
    const tasks = getCollection('tasks');
    let query = {};
    if (req.user.role === 'Nurse') {
        const nurses = getCollection('nurses');
        const nurseProfile = await nurses.findOne({ email: req.user.email });
        if(nurseProfile) {
            query.assignedToType = nurseProfile.type; // 'Head Nurse' or 'Helper Nurse'
        }
    }
    const myTasks = await tasks.find(query).sort({ createdAt: 1 }).toArray();
    res.json(myTasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. ADMIN: Bottleneck Analytics
router.get('/admin/analytics', verifyUser, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin only' });

    const tasks = getCollection('tasks');
    const appointments = getCollection('appointments');

    const pendingTasks = await tasks.countDocuments({ status: 'Pending' });
    const completedTasks = await tasks.countDocuments({ status: 'Completed' });
    
    const bookedAppts = await appointments.countDocuments({ status: 'booked' });
    const cancelledAppts = await appointments.countDocuments({ status: 'Cancelled_By_Doctor' });

    // Grouping tasks by type
    const taskBreakdown = await tasks.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]).toArray();

    // Identify Bottlenecks (Tasks pending for more than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const bottlenecks = await tasks.find({ status: 'Pending', createdAt: { $lt: oneHourAgo } }).toArray();

    let suggestions = [];
    if (bottlenecks.length > 5) {
      suggestions.push('High volume of delayed tasks. Consider reassigning available Helper Nurses.');
    }
    if (cancelledAppts > 5) {
      suggestions.push('High cancellation rate detected. Review doctor schedules.');
    }

    res.json({
      overview: {
        pendingTasks,
        completedTasks,
        bookedAppts,
        cancelledAppts
      },
      taskBreakdown: taskBreakdown.map(t => ({ name: t._id, value: t.count })),
      bottlenecks: bottlenecks.length,
      suggestions: suggestions.length ? suggestions : ['Workflows are operating optimally.']
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
