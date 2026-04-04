const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vgthejeswar_db_user:<db_password>@cluster0.8b7rdha.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'MedPlusDB';

const client = new MongoClient(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    tls: true,
    tlsInsecure: false,
    retryWrites: true,
    maxPoolSize: 10,
});

let db = null;

const getCollection = (name) => {
    if (!db) throw new Error('Database not initialized');
    return db.collection(name);
};

const seedUsers = async () => {
    const doctorColl = getCollection('doctors');
    const nurseColl = getCollection('nurses');
    const patientColl = getCollection('patients');
    const adminColl = getCollection('admins');

    const [doctorCount, nurseCount, patientCount, adminCount] = await Promise.all([
        doctorColl.countDocuments(),
        nurseColl.countDocuments(),
        patientColl.countDocuments(),
        adminColl.countDocuments(),
    ]);

    // Fixing seeded accounts to user-provided credentials
    const doctorPass = await bcrypt.hash('pass123', 10); // doctor1@gmail.com pass123
    const nursePass = await bcrypt.hash('pass123', 10); // nurse1@gmail.com pass123
    const patientPass = await bcrypt.hash('pass-pass123', 10); // patient1@gmail.com pass-pass123
    const adminPass = await bcrypt.hash('password123', 10);

    if (doctorCount === 0) {
        await doctorColl.insertOne({
            name: 'Dr. Seed One',
            email: 'doctor1@gmail.com',
            password: doctorPass,
            role: 'Doctor',
        });
        console.log('Seeded doctor: doctor1@gmail.com (pass: pass123)');
    }

    if (nurseCount === 0) {
        await nurseColl.insertOne({
            name: 'Nurse Seed One',
            email: 'nurse1@gmail.com',
            password: nursePass,
            role: 'Nurse',
        });
        console.log('Seeded nurse: nurse1@gmail.com (pass: pass123)');
    }

    if (patientCount === 0) {
        await patientColl.insertOne({
            name: 'Patient One',
            email: 'patient1@gmail.com',
            password: patientPass,
            phone: '+1234567890',
            dob: '1990-01-01',
            gender: 'Other',
            bloodGroup: 'O+',
            address: '123 Demo St',
            role: 'Patient',
        });
        console.log('Seeded patient: patient1@gmail.com (pass: pass-pass123)');
    }

    if (adminCount === 0) {
        await adminColl.insertOne({
            name: 'Admin User',
            email: 'admin@medplus.com',
            password: adminPass,
            role: 'Admin',
        });
        console.log('Seeded admin: admin@medplus.com (pass: password123)');
    }
};

const connectDB = async () => {
    try {
        await client.connect();
        db = client.db(DB_NAME);

        await getCollection('doctors').createIndex({ email: 1 }, { unique: true });
        await getCollection('nurses').createIndex({ email: 1 }, { unique: true });
        await getCollection('patients').createIndex({ email: 1 }, { unique: true });
        await getCollection('admins').createIndex({ email: 1 }, { unique: true });

        await seedUsers();

        console.log(`MongoDB connected to ${DB_NAME}`);
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) throw new Error('Database not initialized. Call connectDB first.');
    return db;
};

module.exports = { connectDB, getDB, getCollection };

