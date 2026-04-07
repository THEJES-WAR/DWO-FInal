const HOSPITAL_SHIFTS = [['08:00', '13:00'], ['14:00', '18:00'], ['19:00', '22:00']];

/**
 * Generates 30-minute time slots for given shifts.
 * Shifts format: [['HH:MM', 'HH:MM'], ...]
 */
const generate30MinSlots = (shifts) => {
    const slots = [];
    shifts.forEach(([start, end]) => {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        
        let currentTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        while (currentTotal < endTotal) {
            const h = Math.floor(currentTotal / 60);
            const m = currentTotal % 60;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            currentTotal += 30;
        }
    });
    return slots;
};

const generateDefaultAvailability = (daysAhead = 4) => {
    const availability = [];
    const slots = generate30MinSlots(HOSPITAL_SHIFTS);
    for (let i = 0; i < daysAhead; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        // Ensure local date string YYYY-MM-DD
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        availability.push({
            date: dateStr,
            slots: slots
        });
    }
    return availability;
};

const normalizeDate = (value) => {
    if (!value) return '';
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeTime = (value) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return trimmed;
    return `${match[1].padStart(2, '0')}:${match[2]}`;
};

module.exports = {
    generate30MinSlots,
    HOSPITAL_SHIFTS,
    defaultSlots: generate30MinSlots(HOSPITAL_SHIFTS),
    generateDefaultAvailability,
    normalizeDate,
    normalizeTime
};
