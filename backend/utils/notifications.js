const { getCollection } = require('../db');

/**
 * Helper to log notifications to MongoDB
 */
async function logNotification(recipientId, recipientRole, message, type = 'info', senderName = 'System') {
    try {
        const notificationsColl = await getCollection('notifications');
        await notificationsColl.insertOne({
            recipientId: recipientId.toString(),
            recipientRole,
            message,
            type,
            timestamp: new Date(),
            read: false,
            senderName
        });
    } catch (err) {
        console.error('Failed to log notification:', err);
    }
}

module.exports = { logNotification };
