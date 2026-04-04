const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
const { getCollection } = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ error: 'Please fill in all required fields.' });
        }

        let collectionName = '';
        if (role === 'Doctor') collectionName = 'doctors';
        else if (role === 'Nurse') collectionName = 'nurses';
        else if (role === 'Patient') collectionName = 'patients';
        else if (role === 'Admin') collectionName = 'admins';
        else return res.status(400).json({ error: 'Invalid role.' });

        const collection = getCollection(collectionName);
        const user = await collection.findOne({ email });

        if (!user) {
            if (['Doctor', 'Nurse', 'Admin'].includes(role)) {
                return res.status(401).json({ error: 'Invalid credentials. Please contact your administrator.' });
            }
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        return res.json({
            token,
            _id: user._id.toString(),
            role: user.role,
            name: user.name,
            email: user.email,
            specialization: user.specialization || null,
            type: user.type || null,
            status: user.status || null,
        });
    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone, dob, gender, bloodGroup, address } = req.body;
        if (!name || !email || !password || !phone || !dob || !gender || !bloodGroup || !address) {
            return res.status(400).json({ error: 'Please fill in all required fields.' });
        }

        const patientCollection = getCollection('patients');
        const existingPatient = await patientCollection.findOne({ email });
        if (existingPatient) {
            return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const result = await patientCollection.insertOne({
            name,
            email,
            password: hashedPassword,
            phone,
            dob,
            gender,
            bloodGroup,
            address,
            role: 'Patient',
        });

        const token = jwt.sign({ id: result.insertedId, role: 'Patient' }, JWT_SECRET, { expiresIn: '1h' });
        return res.status(201).json({
            token,
            _id: result.insertedId.toString(),
            role: 'Patient',
            name,
            email,
            phone,
            dob,
            gender,
            bloodGroup,
            address,
        });
    } catch (err) {
        console.error('Signup Error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
