require('./node_modules/dotenv').config({ path: '.env' });
const { MongoClient } = require('./node_modules/mongodb');
const bcrypt = require('./node_modules/bcryptjs');

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME || 'MedPlusDB';

const patients = [
  { name: 'Ramesh Kumar', email: 'ramesh.kumar@gmail.com' },
  { name: 'Sita Devi', email: 'sita.devi@gmail.com' },
  { name: 'Arun Prasad', email: 'arun.prasad@gmail.com' },
  { name: 'Lakshmi S', email: 'lakshmi.s@gmail.com' },
  { name: 'Vignesh R', email: 'vignesh.r@gmail.com' },
  { name: 'Meena K', email: 'meena.k@gmail.com' },
  { name: 'Karthik S', email: 'karthik.s@gmail.com' },
  { name: 'Divya P', email: 'divya.p@gmail.com' },
  { name: 'Suresh B', email: 'suresh.b@gmail.com' },
  { name: 'Anu R', email: 'anu.r@gmail.com' },
];

const nurses = [
  { name: 'Head Nurse Shalini R', email: 'shalini.r@medplus.com', type: 'Head Nurse' },
  { name: 'Head Nurse Pradeep K', email: 'pradeep.k@medplus.com', type: 'Head Nurse' },
  { name: 'Head Nurse Uma Devi', email: 'uma.devi@medplus.com', type: 'Head Nurse' },
  { name: 'Head Nurse Joseph A', email: 'joseph.a@medplus.com', type: 'Head Nurse' },
  { name: 'Head Nurse Kavitha S', email: 'kavitha.s@medplus.com', type: 'Head Nurse' },
  { name: 'Helper Mani K', email: 'mani.k@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Selvam R', email: 'selvam.r@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Raju P', email: 'raju.p@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Kumar V', email: 'kumar.v@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Babu S', email: 'babu.s@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Dinesh K', email: 'dinesh.k@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Murugan T', email: 'murugan.t@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Raja M', email: 'raja.m@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Prabhu R', email: 'prabhu.r@medplus.com', type: 'Helper Nurse' },
  { name: 'Helper Siva N', email: 'siva.n@medplus.com', type: 'Helper Nurse' },
];

const doctors = [
  { name: 'Dr. Harish Kumar', email: 'harish.kumar@medplus.com', specialization: 'Cardiology' },
  { name: 'Dr. Deepika Reddy', email: 'deepika.reddy@medplus.com', specialization: 'Cardiology' },
  { name: 'Dr. Arvind Nair', email: 'arvind.nair@medplus.com', specialization: 'Cardiology' },
  { name: 'Dr. Sunil Gupta', email: 'sunil.gupta@medplus.com', specialization: 'Cardiology' },
  { name: 'Dr. Nandhini S', email: 'nandhini.s@medplus.com', specialization: 'Cardiology' },
  { name: 'Dr. Vivek Sharma', email: 'vivek.sharma@medplus.com', specialization: 'Neurology' },
  { name: 'Dr. Keerthana Iyer', email: 'keerthana.iyer@medplus.com', specialization: 'Neurology' },
  { name: 'Dr. Prakash Menon', email: 'prakash.menon@medplus.com', specialization: 'Neurology' },
  { name: 'Dr. Rohit Verma', email: 'rohit.verma@medplus.com', specialization: 'Neurology' },
  { name: 'Dr. Anusha K', email: 'anusha.k@medplus.com', specialization: 'Neurology' },
  { name: 'Dr. Ramesh Babu', email: 'ramesh.babu@medplus.com', specialization: 'Pediatrics' },
  { name: 'Dr. Swathi R', email: 'swathi.r@medplus.com', specialization: 'Pediatrics' },
  { name: 'Dr. Kiran Kumar', email: 'kiran.kumar@medplus.com', specialization: 'Pediatrics' },
  { name: 'Dr. Meenakshi S', email: 'meenakshi.s@medplus.com', specialization: 'Pediatrics' },
  { name: 'Dr. Ajay Patel', email: 'ajay.patel@medplus.com', specialization: 'Pediatrics' },
  { name: 'Dr. Gokul Raj', email: 'gokul.raj@medplus.com', specialization: 'Orthopedics' },
  { name: 'Dr. Santhosh Kumar', email: 'santhosh.kumar@medplus.com', specialization: 'Orthopedics' },
  { name: 'Dr. Raghavendra S', email: 'raghavendra.s@medplus.com', specialization: 'Orthopedics' },
  { name: 'Dr. Pavan Reddy', email: 'pavan.reddy@medplus.com', specialization: 'Orthopedics' },
  { name: 'Dr. Lokesh M', email: 'lokesh.m@medplus.com', specialization: 'Orthopedics' },
];

async function upsertUsers(collection, users, passwordHash, mapUser) {
  let insertedOrUpdated = 0;

  for (const user of users) {
    await collection.updateOne(
      { email: user.email },
      {
        $set: {
          ...mapUser(user),
          password: passwordHash,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );
    insertedOrUpdated += 1;
  }

  return insertedOrUpdated;
}

async function seedCustomUsers() {
  const client = new MongoClient(MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });

  try {
    await client.connect();
    const db = client.db(DB_NAME);

    await Promise.all([
      db.collection('doctors').createIndex({ email: 1 }, { unique: true }),
      db.collection('nurses').createIndex({ email: 1 }, { unique: true }),
      db.collection('patients').createIndex({ email: 1 }, { unique: true }),
    ]);

    const passwordHash = await bcrypt.hash('pass123', 10);

    const patientCount = await upsertUsers(
      db.collection('patients'),
      patients,
      passwordHash,
      (user) => ({
        name: user.name,
        email: user.email,
        role: 'Patient',
        phone: '',
        dob: '',
        gender: '',
        bloodGroup: '',
        address: '',
      })
    );

    const nurseCount = await upsertUsers(
      db.collection('nurses'),
      nurses,
      passwordHash,
      (user) => ({
        name: user.name,
        email: user.email,
        role: 'Nurse',
        type: user.type,
        ward: ['General', 'ICU', 'Pediatrics', 'Emergency'][Math.floor(Math.random() * 4)],
        contact: '98765' + Math.floor(10000 + Math.random() * 90000),
        availability: [
          { date: '2026-04-06', slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] },
          { date: '2026-04-07', slots: ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] }
        ]
      })
    );

    const doctorCount = await upsertUsers(
      db.collection('doctors'),
      doctors,
      passwordHash,
      (user) => ({
        name: user.name,
        email: user.email,
        role: 'Doctor',
        specialization: user.specialization,
        status: 'Available',
        availability: [
          { date: '2026-04-06', slots: ['09:30', '10:30', '11:30', '14:30', '15:30', '16:30'] },
          { date: '2026-04-07', slots: ['09:30', '10:30', '11:30', '14:30', '15:30', '16:30'] }
        ]
      })
    );

    console.log(`Seeded/updated patients: ${patientCount}`);
    console.log(`Seeded/updated nurses: ${nurseCount}`);
    console.log(`Seeded/updated doctors: ${doctorCount}`);
    console.log('All custom users use password: pass123');
  } catch (err) {
    console.error('Failed to seed custom users:', err.message);
    process.exitCode = 1;
  } finally {
    await client.close().catch(() => {});
  }
}

seedCustomUsers();
