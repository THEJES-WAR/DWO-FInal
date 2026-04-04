require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

// Data to seed
const seedData = {
  doctors: [
    {
      specialization: "Cardiology",
      doctors: [
        { name: "Dr. Arjun Mehta" },
        { name: "Dr. Priya Nair" },
        { name: "Dr. Kiran Reddy" },
        { name: "Dr. Sneha Iyer" },
        { name: "Dr. Rahul Verma" }
      ]
    },
    {
      specialization: "Neurology",
      doctors: [
        { name: "Dr. Amit Sharma" },
        { name: "Dr. Kavya Menon" },
        { name: "Dr. Rakesh Gupta" },
        { name: "Dr. Divya Pillai" },
        { name: "Dr. Ankit Jain" }
      ]
    },
    {
      specialization: "Orthopedics",
      doctors: [
        { name: "Dr. Vikram Singh" },
        { name: "Dr. Pooja Desai" },
        { name: "Dr. Manoj Kumar" },
        { name: "Dr. Neha Kapoor" },
        { name: "Dr. Suresh Babu" }
      ]
    },
    {
      specialization: "Pediatrics",
      doctors: [
        { name: "Dr. Anjali Rao" },
        { name: "Dr. Rohit Das" },
        { name: "Dr. Meera Nair" },
        { name: "Dr. Varun Khanna" },
        { name: "Dr. Shalini Gupta" }
      ]
    },
    {
      specialization: "Dermatology",
      doctors: [
        { name: "Dr. Aditi Sharma" },
        { name: "Dr. Karthik Subramanian" },
        { name: "Dr. Nisha Verma" },
        { name: "Dr. Rajesh Iyer" },
        { name: "Dr. Snehal Patil" }
      ]
    }
  ],
  nurses: {
    headNurse: [
      { name: "Lakshmi" },
      { name: "Mary" },
      { name: "Kavitha" },
      { name: "Sunita" },
      { name: "Asha" }
    ],
    helperNurse: [
      { name: "Rani" },
      { name: "Geeta" },
      { name: "Pooja" },
      { name: "Latha" },
      { name: "Rekha" }
    ]
  }
};

async function seedDatabase() {
  const client = new MongoClient(MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log('✓ Connected to MongoDB');

    // Hash password
    const hashedPassword = await bcrypt.hash('pass123', 10);

    // Seed Doctors
    console.log('\n📋 Seeding Doctors...');
    for (const spec of seedData.doctors) {
      for (const doc of spec.doctors) {
        const nameWithoutPrefix = doc.name.replace('Dr. ', '').trim();
        const email = `${nameWithoutPrefix.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

        const doctorDoc = {
          name: doc.name,
          specialization: spec.specialization,
          email,
          password: hashedPassword,
          createdAt: new Date()
        };

        try {
          await db.collection('doctors').updateOne(
            { email },
            { $set: doctorDoc },
            { upsert: true }
          );
          console.log(`  ✓ ${doc.name} (${email})`);
        } catch (err) {
          console.log(`  ✗ ${doc.name}: ${err.message}`);
        }
      }
    }

    // Seed Nurses
    console.log('\n👩‍⚕️ Seeding Nurses...');

    // Head Nurses
    for (const nurse of seedData.nurses.headNurse) {
      const email = `${nurse.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
      const nurseDoc = {
        name: `Nurse ${nurse.name}`,
        type: 'Head Nurse',
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

      try {
        await db.collection('nurses').updateOne(
          { email },
          { $set: nurseDoc },
          { upsert: true }
        );
        console.log(`  ✓ Nurse ${nurse.name} (${email})`);
      } catch (err) {
        console.log(`  ✗ Nurse ${nurse.name}: ${err.message}`);
      }
    }

    // Helper Nurses
    for (const nurse of seedData.nurses.helperNurse) {
      const email = `${nurse.name.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
      const nurseDoc = {
        name: `Helper ${nurse.name}`,
        type: 'Helper Nurse',
        email,
        password: hashedPassword,
        createdAt: new Date()
      };

      try {
        await db.collection('nurses').updateOne(
          { email },
          { $set: nurseDoc },
          { upsert: true }
        );
        console.log(`  ✓ Helper ${nurse.name} (${email})`);
      } catch (err) {
        console.log(`  ✗ Helper ${nurse.name}: ${err.message}`);
      }
    }

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedDatabase();
