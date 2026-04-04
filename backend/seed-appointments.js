require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

// Sample appointment data
const sampleAppointments = [
  {
    patientId: null, // Will be set when booked
    doctorId: null, // Will be set when booked
    doctorName: "Dr. Arjun Mehta",
    doctorEmail: "arjunmehta@gmail.com",
    specialization: "Cardiology",
    date: "2026-03-25",
    time: "10:00",
    status: "available",
    duration: 30,
    createdAt: new Date()
  },
  {
    patientId: null,
    doctorId: null,
    doctorName: "Dr. Priya Nair",
    doctorEmail: "priyanair@gmail.com",
    specialization: "Cardiology",
    date: "2026-03-25",
    time: "11:00",
    status: "available",
    duration: 30,
    createdAt: new Date()
  },
  {
    patientId: null,
    doctorId: null,
    doctorName: "Dr. Amit Sharma",
    doctorEmail: "amitsharma@gmail.com",
    specialization: "Neurology",
    date: "2026-03-25",
    time: "14:00",
    status: "available",
    duration: 45,
    createdAt: new Date()
  },
  {
    patientId: null,
    doctorId: null,
    doctorName: "Dr. Vikram Singh",
    doctorEmail: "vikramsingh@gmail.com",
    specialization: "Orthopedics",
    date: "2026-03-26",
    time: "09:00",
    status: "available",
    duration: 30,
    createdAt: new Date()
  },
  {
    patientId: null,
    doctorId: null,
    doctorName: "Dr. Anjali Rao",
    doctorEmail: "anjalirao@gmail.com",
    specialization: "Pediatrics",
    date: "2026-03-26",
    time: "10:30",
    status: "available",
    duration: 30,
    createdAt: new Date()
  }
];

async function seedAppointments() {
  const client = new MongoClient(MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');

    // Clear existing appointments
    await db.collection('appointments').deleteMany({});
    console.log('✓ Cleared existing appointments');

    // Insert sample appointments
    const result = await db.collection('appointments').insertMany(sampleAppointments);
    console.log(`✓ Inserted ${result.insertedCount} sample appointments`);

    // Create indexes
    await db.collection('appointments').createIndex({ doctorEmail: 1, date: 1, time: 1 });
    await db.collection('appointments').createIndex({ patientId: 1 });
    await db.collection('appointments').createIndex({ status: 1 });
    console.log('✓ Created indexes');

    console.log('\n✅ Appointments seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedAppointments();
