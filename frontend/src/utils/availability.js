export const generate30MinSlots = (shifts) => {
    const slots = [];
    shifts.forEach(([start, end]) => {
        let current = new Date(`2000-01-01T${start}:00`);
        const endTime = new Date(`2000-01-01T${end}:00`);

        while (current < endTime) {
            const hours = String(current.getHours()).padStart(2, '0');
            const minutes = String(current.getMinutes()).padStart(2, '0');
            slots.push(`${hours}:${minutes}`);
            current.setMinutes(current.getMinutes() + 30);
        }
    });
    return slots;
};

export const HOSPITAL_SHIFTS = [
    ['08:00', '13:00'], // 8 AM - 1 PM
    ['14:00', '18:00'], // 2 PM - 6 PM
    ['19:00', '22:00']  // 7 PM - 10 PM
];

export const DEFAULT_SLOTS = generate30MinSlots(HOSPITAL_SHIFTS);
