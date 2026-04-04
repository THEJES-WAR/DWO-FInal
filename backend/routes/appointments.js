const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollection } = require('../db');

const router = express.Router();

// Middleware to verify user
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

// Get available appointments
router.get('/available', verifyUser, async (req, res) => {
  try {
    const { specialization, date } = req.query;
    const appointments = await getCollection('appointments');

    let query = { status: 'available' };
    if (specialization) query.specialization = specialization;
    if (date) query.date = date;

    const availableSlots = await appointments
      .find(query)
      .sort({ date: 1, time: 1 })
      .toArray();

    res.json(availableSlots);
  } catch (err) {
    console.error('Get available appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get patient's appointments
router.get('/my-appointments', verifyUser, async (req, res) => {
  try {
    const appointments = await getCollection('appointments');
    const patients = await getCollection('patients');

    // Get patient ID from email
    const patient = await patients.findOne({ email: req.user.email });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const myAppointments = await appointments
      .find({ patientId: patient._id.toString() })
      .sort({ date: -1, time: -1 })
      .toArray();

    res.json(myAppointments);
  } catch (err) {
    console.error('Get my appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Book appointment
router.post('/book', verifyUser, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointments = await getCollection('appointments');
    const patients = await getCollection('patients');

    // Get patient
    const patient = await patients.findOne({ email: req.user.email });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Check if appointment exists and is available
    const appointment = await appointments.findOne({
      _id: new ObjectId(appointmentId),
      status: 'available'
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not available' });
    }

    // Book the appointment
    const result = await appointments.updateOne(
      { _id: new ObjectId(appointmentId) },
      {
        $set: {
          patientId: patient._id.toString(),
          patientName: patient.name,
          patientEmail: patient.email,
          status: 'booked',
          bookedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Failed to book appointment' });
    }

    // Get updated appointment
    const updatedAppointment = await appointments.findOne({ _id: new ObjectId(appointmentId) });
    res.json({ message: 'Appointment booked successfully', appointment: updatedAppointment });

  } catch (err) {
    console.error('Book appointment error:', err);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Cancel appointment with smart rescheduling
router.post('/cancel/:appointmentId', verifyUser, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { autoReschedule = true } = req.body;
    const appointments = await getCollection('appointments');

    // Get the appointment to cancel
    const appointment = await appointments.findOne({
      _id: new ObjectId(appointmentId),
      status: 'booked'
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user owns this appointment
    const patients = await getCollection('patients');
    const patient = await patients.findOne({ email: req.user.email });

    if (!patient || appointment.patientId !== patient._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this appointment' });
    }

    let rescheduledAppointment = null;

    if (autoReschedule) {
      // Find next available slot with same doctor
      const nextSlot = await appointments.findOne({
        doctorEmail: appointment.doctorEmail,
        status: 'available',
        date: { $gte: appointment.date }
      }).sort({ date: 1, time: 1 });

      if (nextSlot) {
        // Reschedule to next available slot with same doctor
        await appointments.updateOne(
          { _id: nextSlot._id },
          {
            $set: {
              patientId: appointment.patientId,
              patientName: appointment.patientName,
              patientEmail: appointment.patientEmail,
              status: 'booked',
              bookedAt: new Date(),
              rescheduledFrom: appointment._id.toString()
            }
          }
        );
        rescheduledAppointment = await appointments.findOne({ _id: nextSlot._id });
      } else {
        // Find next available doctor in same specialization
        const nextDoctorSlot = await appointments.findOne({
          specialization: appointment.specialization,
          status: 'available',
          date: { $gte: appointment.date }
        }).sort({ date: 1, time: 1 });

        if (nextDoctorSlot) {
          // Reschedule to next available doctor in same specialty
          await appointments.updateOne(
            { _id: nextDoctorSlot._id },
            {
              $set: {
                patientId: appointment.patientId,
                patientName: appointment.patientName,
                patientEmail: appointment.patientEmail,
                status: 'booked',
                bookedAt: new Date(),
                rescheduledFrom: appointment._id.toString()
              }
            }
          );
          rescheduledAppointment = await appointments.findOne({ _id: nextDoctorSlot._id });
        }
      }
    }

    // Cancel the original appointment
    await appointments.updateOne(
      { _id: new ObjectId(appointmentId) },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: req.user.email
        },
        $unset: {
          patientId: 1,
          patientName: 1,
          patientEmail: 1
        }
      }
    );

    res.json({
      message: 'Appointment cancelled successfully',
      rescheduledAppointment,
      rescheduled: !!rescheduledAppointment
    });

  } catch (err) {
    console.error('Cancel appointment error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Get doctor's appointments (for doctors)
router.get('/doctor-appointments', verifyUser, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') {
      return res.status(403).json({ error: 'Only doctors can access this endpoint' });
    }

    const appointments = await getCollection('appointments');
    const doctorAppointments = await appointments
      .find({ doctorEmail: req.user.email })
      .sort({ date: -1, time: -1 })
      .toArray();

    res.json(doctorAppointments);
  } catch (err) {
    console.error('Get doctor appointments error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Doctor cancels appointment (admin functionality)
router.post('/doctor-cancel/:appointmentId', verifyUser, async (req, res) => {
  try {
    if (req.user.role !== 'Doctor') {
      return res.status(403).json({ error: 'Only doctors can cancel appointments' });
    }

    const { appointmentId } = req.params;
    const appointments = await getCollection('appointments');

    // Get the appointment
    const appointment = await appointments.findOne({
      _id: new ObjectId(appointmentId),
      doctorEmail: req.user.email,
      status: 'booked'
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Smart rescheduling logic
    let rescheduledAppointment = null;

    // 1. Try to find next available slot with same doctor
    const nextSlot = await appointments.findOne({
      doctorEmail: appointment.doctorEmail,
      status: 'available',
      date: { $gte: appointment.date }
    }).sort({ date: 1, time: 1 });

    if (nextSlot) {
      // Reschedule patient to next available slot with same doctor
      await appointments.updateOne(
        { _id: nextSlot._id },
        {
          $set: {
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            patientEmail: appointment.patientEmail,
            status: 'booked',
            bookedAt: new Date(),
            rescheduledFrom: appointment._id.toString(),
            rescheduledBy: 'doctor_cancellation'
          }
        }
      );
      rescheduledAppointment = await appointments.findOne({ _id: nextSlot._id });
    } else {
      // 2. Find next available doctor in same specialization
      const nextDoctorSlot = await appointments.findOne({
        specialization: appointment.specialization,
        status: 'available',
        date: { $gte: appointment.date }
      }).sort({ date: 1, time: 1 });

      if (nextDoctorSlot) {
        // Reschedule to next available doctor in same specialty
        await appointments.updateOne(
          { _id: nextDoctorSlot._id },
          {
            $set: {
              patientId: appointment.patientId,
              patientName: appointment.patientName,
              patientEmail: appointment.patientEmail,
              status: 'booked',
              bookedAt: new Date(),
              rescheduledFrom: appointment._id.toString(),
              rescheduledBy: 'doctor_cancellation'
            }
          }
        );
        rescheduledAppointment = await appointments.findOne({ _id: nextDoctorSlot._id });
      }
    }

    // Cancel the original appointment
    await appointments.updateOne(
      { _id: new ObjectId(appointmentId) },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: req.user.email,
          cancellationReason: 'doctor_cancelled'
        },
        $unset: {
          patientId: 1,
          patientName: 1,
          patientEmail: 1
        }
      }
    );

    res.json({
      message: 'Appointment cancelled and patient rescheduled',
      originalAppointment: appointment,
      rescheduledAppointment,
      rescheduled: !!rescheduledAppointment
    });

  } catch (err) {
    console.error('Doctor cancel appointment error:', err);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
