const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://vgthejeswar_db_user:<db_password>@cluster0.8b7rdha.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'MedPlusDB';

async function cleanup() {
    const client = new MongoClient(MONGO_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const patients = db.collection('patients');

        console.log('Searching for patients with "ap1" in email or ID...');
        const match = await patients.find({ 
            $or: [
                { email: /ap1/i },
                { _id: /ap1/i }
            ]
        }).toArray();

        if (match.length > 0) {
            console.log('Found patients:', match.map(p => ({ id: p._id, name: p.name, email: p.email })));
            const result = await patients.deleteMany({ 
                $or: [
                    { email: /ap1/i },
                    { _id: /ap1/i }
                ]
            });
            console.log(`Deleted ${result.deletedCount} patient(s).`);
        } else {
            console.log('No patients found matching "ap1".');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

cleanup();
