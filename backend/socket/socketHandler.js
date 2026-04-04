// backend/socket/socketHandler.js

const setupSocket = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`);

        socket.on('join_room', ({ role, id }) => {
            if (!role || !id) return;
            // Room format: role:id (e.g., patient:123, nurse:456)
            // Or 'admin' for all admins
            const roomName = role === 'Admin' ? 'admin' : `${role.toLowerCase()}:${id}`;
            socket.join(roomName);
            console.log(`[Socket] ${socket.id} joined room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`);
        });
    });
};

/**
 * Utility to emit to specific rooms
 */
const emitToPatient = (io, patientId, event, payload) => {
    io.to(`patient:${patientId}`).emit(event, payload);
};

const emitToNurse = (io, nurseId, event, payload) => {
    io.to(`nurse:${nurseId}`).emit(event, payload);
};

const emitToDoctor = (io, doctorId, event, payload) => {
    io.to(`doctor:${doctorId}`).emit(event, payload);
};

const emitToAdmin = (io, event, payload) => {
    io.to('admin').emit(event, payload);
};

module.exports = {
    setupSocket,
    emitToPatient,
    emitToNurse,
    emitToDoctor,
    emitToAdmin
};
