const express = require('express');
const bcrypt = require('bcryptjs');
const { getCollection } = require('../db');

const router = express.Router();

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
    const user = req.headers['x-user'];
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'Admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid user data' });
    }
};

// GET all users (doctors, nurses, patients)
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const role = req.query.role; // 'Doctor', 'Nurse', 'Patient' or undefined for all
        
        let doctors = [];
        let nurses = [];
        let patients = [];

        if (!role || role === 'Doctor') {
            doctors = await getCollection('doctors').find({}).project({ password: 0 }).toArray();
        }
        if (!role || role === 'Nurse') {
            nurses = await getCollection('nurses').find({}).project({ password: 0 }).toArray();
        }
        if (!role || role === 'Patient') {
            patients = await getCollection('patients').find({}).project({ password: 0 }).toArray();
        }

        res.json({
            doctors: role === 'Doctor' || !role ? doctors : [],
            nurses: role === 'Nurse' || !role ? nurses : [],
            patients: role === 'Patient' || !role ? patients : [],
            total: doctors.length + nurses.length + patients.length
        });
    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST new user (doctor, nurse, or patient)
router.post('/users', verifyAdmin, async (req, res) => {
    try {
        const { name, email, password, role, phone, dob, gender, bloodGroup, address } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const collectionName = role === 'Doctor' ? 'doctors' : role === 'Nurse' ? 'nurses' : 'patients';
        const collection = getCollection(collectionName);

        // Check if email already exists
        const existing = await collection.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: `${role} with this email already exists` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
        };

        // Add patient-specific fields
        if (role === 'Patient') {
            if (!phone || !dob || !gender || !bloodGroup || !address) {
                return res.status(400).json({ error: 'Patient requires all fields: phone, dob, gender, bloodGroup, address' });
            }
            userData.phone = phone;
            userData.dob = dob;
            userData.gender = gender;
            userData.bloodGroup = bloodGroup;
            userData.address = address;
        }

        const result = await collection.insertOne(userData);

        res.status(201).json({
            id: result.insertedId,
            name,
            email,
            role,
            message: `${role} created successfully`
        });
    } catch (err) {
        console.error('Create user error:', err);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT update user
router.put('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;

        if (!name && !email && !password && !role) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const collectionName = role === 'Doctor' ? 'doctors' : role === 'Nurse' ? 'nurses' : 'patients';
        const collection = getCollection(collectionName);

        const updateData = {};
        if (name) updateData.name = name;
        if (email) {
            const existing = await collection.findOne({ email, _id: { $ne: new (require('mongodb')).ObjectId(id) } });
            if (existing) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            updateData.email = email;
        }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const result = await collection.updateOne(
            { _id: new (require('mongodb')).ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: `${role} updated successfully` });
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE user
router.delete('/users/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query;

        if (!role) {
            return res.status(400).json({ error: 'Role query parameter required' });
        }

        const collectionName = role === 'Doctor' ? 'doctors' : role === 'Nurse' ? 'nurses' : 'patients';
        const collection = getCollection(collectionName);

        const result = await collection.deleteOne({
            _id: new (require('mongodb')).ObjectId(id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: `${role} deleted successfully` });
    } catch (err) {
        console.error('Delete user error:', err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;
