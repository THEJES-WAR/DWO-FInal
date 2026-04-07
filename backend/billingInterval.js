/**
 * billingInterval.js
 * Stage 9: Periodically checks for pending billing and fires reminders to nurses
 */

const { getCollection } = require('./db');
const { emitToNurse } = require('./socket/socketHandler');

const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

const startBillingReminders = (io) => {
    console.log('[BillingInterval] Billing reminder service started (every 2 minutes)');

    setInterval(async () => {
        try {
            const patientsColl = getCollection('patients');
            const notificationsColl = getCollection('notifications');

            // Find all patients with a pending bill that still has reminders active
            const pendingBillings = await patientsColl.find({
                'billing.status': 'pending',
                'billing.reminderActive': true
            }).toArray();

            for (const patient of pendingBillings) {
                const patientId = patient._id.toString();
                const totalAmount = patient.billing?.totalAmount || 0;

                // Find the nurse who handles billing (try assignedNurse first)
                const nurseId = patient.assignedNurse?.id;
                if (!nurseId) continue;

                // Save a reminder notification for the nurse
                const reminderNotif = {
                    nurseId,
                    type: 'bill_reminder',
                    message: `Reminder: Billing pending for ${patient.name} — ₹${totalAmount}. Please collect payment.`,
                    read: false,
                    createdAt: new Date()
                };
                await notificationsColl.insertOne(reminderNotif);

                // Emit to nurse
                emitToNurse(io, nurseId, 'bill:reminder', {
                    patientId,
                    patientName: patient.name,
                    totalAmount,
                    notification: reminderNotif
                });

                console.log(`[BillingInterval] Reminder sent for patient ${patient.name} to nurse ${nurseId}`);
            }
        } catch (err) {
            console.error('[BillingInterval] Error checking billing reminders:', err);
        }
    }, INTERVAL_MS);
};

module.exports = { startBillingReminders };
