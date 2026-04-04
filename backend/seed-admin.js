require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vgthejeswar_db_user:<db_password>@cluster0.8b7rdha.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'MedPlusDB';

const STAGES = [
  'Arrival',               // 0
  'Nurse Check-in',        // 1
  'Doctor Consultation',   // 2
  'Prescription',          // 3
  'Nurse Medication',      // 4
  'Lab/Scan',              // 5
  'Billing',               // 6
  'Discharge'              // 7
];

const DEPARTMENTS = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'];
const WARD_TYPES = ['OPD', 'General', 'ICU', 'Emergency'];

// Helpers
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const subtractMinutes = (date, mins) => new Date(date.getTime() - mins * 60000);
const subtractDays = (date, days) => new Date(date.getTime() - days * 86400000);

async function seedAdminData() {
  const client = new MongoClient(MONGO_URI, { tls: true, tlsAllowInvalidCertificates: false });
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Clear relevant collections
    const collections = ['doctors', 'nurses', 'patients', 'admins', 'journeys'];
    for (const col of collections) {
      await db.collection(col).deleteMany({});
    }

    const hashedPassword = await bcrypt.hash('pass123', 10);

    // 1. Admin
    await db.collection('admins').insertOne({ name: 'System Admin', email: 'admin@medplus.com', password: hashedPassword, role: 'Admin' });

    // 2. Doctors
    const docs = [];
    for(let i=1; i<=8; i++) {
        docs.push({
            _id: new ObjectId(),
            name: `Dr. Doc${i}`,
            email: `doc${i}@med.com`,
            specialization: randomItem(DEPARTMENTS),
            password: hashedPassword,
            role: 'Doctor',
            status: 'Available'
        });
    }
    await db.collection('doctors').insertMany(docs);

    // 3. Nurses
    const nurses = [];
    for(let i=1; i<=10; i++) {
        nurses.push({
            _id: new ObjectId(),
            name: `Nurse ${i}`,
            email: `nurse${i}@med.com`,
            type: i <= 3 ? 'Head Nurse' : 'Helper Nurse',
            password: hashedPassword,
            role: 'Nurse'
        });
    }
    await db.collection('nurses').insertMany(nurses);

    // 4. Patients & Journeys
    const patients = [];
    const journeys = [];
    const now = new Date();

    // Generate 50 journeys for the past 7 days (for historical charts)
    for(let i=1; i<=50; i++) {
        const pId = new ObjectId();
        patients.push({
            _id: pId, name: `Historical Patient ${i}`, email: `hp${i}@gmail.com`, 
            age: randomInt(18, 80), password: hashedPassword, role: 'Patient'
        });

        // past date
        const journeyDate = subtractDays(now, randomInt(1, 7));
        journeys.push({
            patientId: pId.toString(),
            patientName: `Historical Patient ${i}`,
            age: patients[patients.length-1].age,
            ward: randomItem(WARD_TYPES),
            department: randomItem(DEPARTMENTS),
            currentStage: 'Discharge', // completed
            status: 'On Track',
            assignedDoctor: randomItem(docs).name,
            assignedNurse: randomItem(nurses).name,
            arrivalDate: journeyDate,
            stages: STAGES.map(s => ({ name: s, status: 'Done', timeSpent: randomInt(5, 30) })),
            totalTime: randomInt(60, 180), // 1-3 hours
            isHistorical: true
        });
    }

    // Generate 30 Active Journeys for TODAY (Live Pipeline)
    for(let i=1; i<=30; i++) {
        const pId = new ObjectId();
        patients.push({
            _id: pId, name: `Active Patient ${i}`, email: `ap${i}@gmail.com`, 
            age: randomInt(18, 80), password: hashedPassword, role: 'Patient'
        });

        const currentStageIdx = randomInt(0, 6); // 0 to 6 (Arrival to Billing)
        const currentStageName = STAGES[currentStageIdx];
        
        let status = 'On Track';
        const isDelayed = Math.random() > 0.7; // 30% chance of delay
        if(isDelayed) status = 'Delayed';
        if(isDelayed && Math.random() > 0.5) status = 'Critical'; // 15% critical
        
        const timeAtCurrentStage = isDelayed ? randomInt(35, 90) : randomInt(5, 25);
        const arrivalTime = subtractMinutes(now, (currentStageIdx * 15) + timeAtCurrentStage);

        const stageData = [];
        for(let j=0; j<=currentStageIdx; j++) {
            if(j === currentStageIdx) {
                stageData.push({ name: STAGES[j], status: 'In Progress', timeSpent: timeAtCurrentStage });
            } else {
                stageData.push({ name: STAGES[j], status: 'Done', timeSpent: randomInt(10, 20) });
            }
        }
        for(let j=currentStageIdx+1; j<STAGES.length; j++) {
            stageData.push({ name: STAGES[j], status: 'Pending', timeSpent: 0 });
        }

        journeys.push({
            patientId: pId.toString(),
            patientName: `Active Patient ${i}`,
            age: patients[patients.length-1].age,
            ward: randomItem(WARD_TYPES),
            department: randomItem(DEPARTMENTS),
            currentStage: currentStageName,
            status: status, // 'On Track', 'Delayed', 'Critical'
            assignedDoctor: currentStageIdx >= 2 ? randomItem(docs).name : null,
            assignedNurse: currentStageIdx >= 1 ? randomItem(nurses).name : null,
            arrivalDate: arrivalTime,
            stages: stageData,
            totalTime: Math.floor((now - arrivalTime) / 60000), // mins
            isHistorical: false
        });
    }

    await db.collection('patients').insertMany(patients);
    await db.collection('journeys').insertMany(journeys);

    console.log('✅ Admin Workflow DB Seeded Successfully! (Journeys, Doctors, Nurses)');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedAdminData();
