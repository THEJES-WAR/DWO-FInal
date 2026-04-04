require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vgthejeswar_db_user:<db_password>@cluster0.8b7rdha.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'MedPlusDB';

// Current dynamic date helpers
const today = new Date();
const formatDate = (date) => date.toISOString().split('T')[0];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const subtractDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

async function seedWorkflow() {
  const client = new MongoClient(MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');

    // 1. Clear relevant collections
    const collections = ['doctors', 'nurses', 'patients', 'admins', 'appointments', 'vitals', 'tasks', 'notifications'];
    for (const col of collections) {
      await db.collection(col).deleteMany({});
    }
    console.log('✓ Cleared all previous workflow data');

    const hashedPassword = await bcrypt.hash('pass123', 10);

    // 2. Seed Admin
    await db.collection('admins').insertOne({
      name: 'System Admin',
      email: 'admin@medplus.com',
      password: hashedPassword,
      role: 'Admin',
      createdAt: new Date()
    });
    console.log('  ✓ Admin created (admin@medplus.com)');

    // 3. Seed Doctors (Cardiology & Neurology)
    const doctorsData = [
      { name: 'Dr. Arjun Mehta', email: 'arjun@gmail.com', specialization: 'Cardiology' },
      { name: 'Dr. Priya Nair', email: 'priya@gmail.com', specialization: 'Cardiology' },
      { name: 'Dr. Amit Sharma', email: 'amit@gmail.com', specialization: 'Neurology' }
    ];
    
    const docsWithId = doctorsData.map(d => ({
      _id: new ObjectId(),
      name: d.name,
      email: d.email,
      specialization: d.specialization,
      password: hashedPassword,
      role: 'Doctor',
      status: 'Available', // Can be 'Unavailable'
      createdAt: new Date()
    }));
    await db.collection('doctors').insertMany(docsWithId);
    console.log('  ✓ Doctors created');

    // 4. Seed Nurses
    const nursesData = [
      { name: 'Head Nurse Lakshmi', email: 'lakshmi@gmail.com', type: 'Head Nurse' },
      { name: 'Helper Nurse Rani', email: 'rani@gmail.com', type: 'Helper Nurse' }
    ];
    const nursesWithId = nursesData.map(n => ({
      _id: new ObjectId(),
      name: n.name,
      email: n.email,
      type: n.type,
      password: hashedPassword,
      role: 'Nurse',
      createdAt: new Date()
    }));
    await db.collection('nurses').insertMany(nursesWithId);
    console.log('  ✓ Nurses created');

    // 5. Seed Patients
    const patientsData = [
      { name: 'Patient One', email: 'patient1@gmail.com', phone: '1111111111' },
      { name: 'Patient Two', email: 'patient2@gmail.com', phone: '2222222222' }
    ];
    const patientsWithId = patientsData.map(p => ({
      _id: new ObjectId(),
      name: p.name,
      email: p.email,
      phone: p.phone,
      password: hashedPassword,
      role: 'Patient',
      createdAt: new Date()
    }));
    await db.collection('patients').insertMany(patientsWithId);
    console.log('  ✓ Patients created');

    // 6. Seed Vitals (Historical for Patient One, 2 weeks ago)
    await db.collection('vitals').insertOne({
      patientId: patientsWithId[0]._id.toString(),
      patientEmail: patientsWithId[0].email,
      height: '175cm',
      weight: '70kg',
      bp: '120/80',
      sugar: '95',
      pulse: '72',
      recordedAt: subtractDays(today, 14),
      recordedBy: nursesWithId[0].email
    });
    console.log('  ✓ Historical Vitals created');

    // 7. Seed Appointments
    // Setup 1: Appointment for Patient One with Dr. Arjun (Cardiology) today. 
    // We will cancel this via UI to test the rescheduling logic to Dr. Priya (Cardiology) or Dr. Arjun's next slot.
    const apptsData = [
      // Booked appt for Patient 1 today
      {
        doctorEmail: docsWithId[0].email, // Arjun
        doctorName: docsWithId[0].name,
        specialization: docsWithId[0].specialization,
        date: formatDate(today),
        time: "10:00",
        status: "booked",
        duration: 30,
        patientId: patientsWithId[0]._id.toString(),
        patientName: patientsWithId[0].name,
        patientEmail: patientsWithId[0].email,
        createdAt: new Date()
      },
      // Next available slot for Dr. Arjun tomorrow
      {
        doctorEmail: docsWithId[0].email, // Arjun
        doctorName: docsWithId[0].name,
        specialization: docsWithId[0].specialization,
        date: formatDate(addDays(today, 1)),
        time: "09:00",
        status: "available",
        duration: 30,
        createdAt: new Date()
      },
      // Next available slot for Dr. Priya (Same Specialty) today at 11:00
      {
        doctorEmail: docsWithId[1].email, // Priya
        doctorName: docsWithId[1].name,
        specialization: docsWithId[1].specialization,
        date: formatDate(today),
        time: "11:00",
        status: "available",
        duration: 30,
        createdAt: new Date()
      }
    ];
    await db.collection('appointments').insertMany(apptsData);
    console.log('  ✓ Appointments crafted for testing logic');

    // 8. Seed Nurse Tasks
    await db.collection('tasks').insertMany([
      {
        type: 'Vitals Collection',
        patientId: patientsWithId[0]._id.toString(),
        patientName: patientsWithId[0].name,
        assignedToType: 'Head Nurse',
        status: 'Pending',
        createdAt: new Date()
      },
      {
        type: 'Pharmacy Delivery',
        patientId: patientsWithId[1]._id.toString(),
        patientName: patientsWithId[1].name,
        assignedToType: 'Helper Nurse',
        status: 'Pending',
        createdAt: subtractDays(today, 2) // severely delayed
      },
      {
        type: 'Discharge Patient',
        patientId: patientsWithId[0]._id.toString(),
        patientName: patientsWithId[0].name,
        assignedToType: 'Helper Nurse',
        status: 'Pending',
        createdAt: new Date()
      },
      {
        type: 'Vitals Collection',
        patientId: patientsWithId[1]._id.toString(),
        patientName: patientsWithId[1].name,
        assignedToType: 'Head Nurse',
        status: 'Completed',
        createdAt: subtractDays(today, 1) // completed task
      },
      {
        type: 'Vitals Collection',
        patientId: patientsWithId[0]._id.toString(),
        patientName: 'Patient Three',
        assignedToType: 'Head Nurse',
        status: 'Pending',
        createdAt: subtractDays(today, 1) // delayed
      },
      {
        type: 'Pharmacy Delivery',
        patientId: patientsWithId[1]._id.toString(),
        patientName: 'Patient Four',
        assignedToType: 'Helper Nurse',
        status: 'Pending',
        createdAt: new Date()
      }
    ]);
    console.log('  ✓ Nurse Tasks created');

    console.log('\n✅ Workflow Seeding Completed Successfully! Passwords are "pass123".');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedWorkflow();
