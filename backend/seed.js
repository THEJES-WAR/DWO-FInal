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
        { name: "Dr. Arjun Mehta", phone: "+91 98400 10001" },
        { name: "Dr. Priya Nair", phone: "+91 98400 10002" },
        { name: "Dr. Kiran Reddy", phone: "+91 98400 10003" },
        { name: "Dr. Sneha Iyer", phone: "+91 98400 10004" },
        { name: "Dr. Rahul Verma", phone: "+91 98400 10005" }
      ]
    },
    {
      specialization: "Neurology",
      doctors: [
        { name: "Dr. Amit Sharma", phone: "+91 98400 10006" },
        { name: "Dr. Kavya Menon", phone: "+91 98400 10007" },
        { name: "Dr. Rakesh Gupta", phone: "+91 98400 10008" },
        { name: "Dr. Divya Pillai", phone: "+91 98400 10009" },
        { name: "Dr. Ankit Jain", phone: "+91 98400 10010" }
      ]
    },
    {
      specialization: "Orthopedics",
      doctors: [
        { name: "Dr. Vikram Singh", phone: "+91 98400 10011" },
        { name: "Dr. Pooja Desai", phone: "+91 98400 10012" },
        { name: "Dr. Manoj Kumar", phone: "+91 98400 10013" },
        { name: "Dr. Neha Kapoor", phone: "+91 98400 10014" },
        { name: "Dr. Suresh Babu", phone: "+91 98400 10015" }
      ]
    },
    {
      specialization: "Pediatrics",
      doctors: [
        { name: "Dr. Anjali Rao", phone: "+91 98400 10016" },
        { name: "Dr. Rohit Das", phone: "+91 98400 10017" },
        { name: "Dr. Meera Nair", phone: "+91 98400 10018" },
        { name: "Dr. Varun Khanna", phone: "+91 98400 10019" },
        { name: "Dr. Shalini Gupta", phone: "+91 98400 10020" }
      ]
    },
    {
      specialization: "Dermatology",
      doctors: [
        { name: "Dr. Aditi Sharma", phone: "+91 98400 10021" },
        { name: "Dr. Karthik Subramanian", phone: "+91 98400 10022" },
        { name: "Dr. Nisha Verma", phone: "+91 98400 10023" },
        { name: "Dr. Rajesh Iyer", phone: "+91 98400 10024" },
        { name: "Dr. Snehal Patil", phone: "+91 98400 10025" }
      ]
    }
  ],
  nurses: {
    headNurse: [
      { name: "Lakshmi", phone: "+91 94400 20001" },
      { name: "Mary", phone: "+91 94400 20002" },
      { name: "Kavitha", phone: "+91 94400 20003" },
      { name: "Sunita", phone: "+91 94400 20004" },
      { name: "Asha", phone: "+91 94400 20005" }
    ],
    helperNurse: [
      { name: "Rani", phone: "+91 94400 20006" },
      { name: "Geeta", phone: "+91 94400 20007" },
      { name: "Pooja", phone: "+91 94400 20008" },
      { name: "Latha", phone: "+91 94400 20009" },
      { name: "Rekha", phone: "+91 94400 20010" }
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
          phone: doc.phone || '+91 98400 00000',
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
        phone: nurse.phone || '+91 94400 00000',
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
        phone: nurse.phone || '+91 94400 00000',
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
