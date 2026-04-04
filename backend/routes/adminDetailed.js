const express = require('express');
const { getCollection } = require('../db');

const router = express.Router();

// Middleware to verify Admin
const verifyAdmin = (req, res, next) => {
  const user = req.headers['x-user'];
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const parsed = JSON.parse(user);
    if(parsed.role !== 'Admin') return res.status(403).json({ error: 'Admin only access' });
    req.user = parsed;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid user data' });
  }
};

router.get('/detailed-workflow', verifyAdmin, async (req, res) => {
  try {
    const journeysColl = getCollection('journeys');
    const doctorsColl = getCollection('doctors');
    
    // Fetch all active journeys
    const activeJourneys = await journeysColl.find({ isHistorical: false }).toArray();
    
    // Overview Stats
    const totalPatients = activeJourneys.length;
    const activeDocs = await doctorsColl.countDocuments({ status: 'Available' });
    const inProgress = activeJourneys.filter(j => j.status !== 'Delayed' && j.status !== 'Critical').length;
    
    // Funnel Chart (Stage breakdown)
    const funnelData = [
      { name: 'Arrival', count: 0 },
      { name: 'Nurse Check-in', count: 0 },
      { name: 'Consultation', count: 0 },
      { name: 'Prescription', count: 0 },
      { name: 'Nurse Meds', count: 0 },
      { name: 'Lab/Scan', count: 0 },
      { name: 'Billing', count: 0 }
    ];
    
    const stageMap = {
      'Arrival': 0, 'Nurse Check-in': 1, 'Doctor Consultation': 2,
      'Prescription': 3, 'Nurse Medication': 4, 'Lab/Scan': 5, 'Billing': 6, 'Discharge': 7
    };
    
    activeJourneys.forEach(j => {
       const idx = stageMap[j.currentStage];
       if(idx < 7 && funnelData[idx]) funnelData[idx].count++;
    });

    // Delays breakdown
    const delayedJourneys = activeJourneys.filter(j => j.status === 'Delayed' || j.status === 'Critical');
    const criticalJourneys = activeJourneys.filter(j => j.status === 'Critical');

    // Pie Chart - Department distrib
    const deptData = [];
    activeJourneys.forEach(j => {
       const existing = deptData.find(d => d.name === j.department);
       if(existing) existing.value++;
       else deptData.push({ name: j.department, value: 1 });
    });

    res.json({
      overview: {
        totalPatients,
        activeDoctors: activeDocs,
        avgWaitTime: '24 mins',
        bedOccupancy: '78%',
        emergencies: criticalJourneys.length,
        inProgress
      },
      tableData: activeJourneys,
      funnelData,
      delayedBreakdown: delayedJourneys.length,
      deptData
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
