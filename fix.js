const fs = require('fs');
let content = fs.readFileSync('backend/routes/nurse.routes.js', 'utf8');

const targetStr = `        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { 
                    status: 'discharged',
                    dischargedAt: new Date(),
                    isHistorical: true
                }
            }
        );`;

const newStr = `        const historyObject = {
            visitId: new ObjectId(),
            dischargedAt: new Date(),
            issue: patient.issue,
            vitals: patient.vitals,
            nurseVisit: patient.nurseVisit,
            doctorVisit: patient.doctorVisit,
            assignedNurse: patient.assignedNurse,
            assignedDoctor: patient.assignedDoctor,
            prescriptions: patient.prescriptions,
            billing: patient.billing,
            doctorFeedback: patient.doctorFeedback,
            vitalsProcess: patient.vitalsProcess
        };

        await patientsColl.updateOne(
            { _id: new ObjectId(patientId) },
            { 
                $set: { status: 'registered' },
                $push: { visitHistory: historyObject },
                $unset: {
                    issue: "", vitals: "", nurseVisit: "", doctorVisit: "",
                    assignedNurse: "", assignedDoctor: "", prescriptions: "",
                    billing: "", doctorFeedback: "", vitalsProcess: "",
                    isHistorical: "", dischargedAt: ""
                }
            }
        );`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, newStr);
    content = content.replace(
        "emitToPatient(req.io, patientId, 'patient:discharged', { message: 'You have been discharged. Thank you for choosing MedPlus+.' });",
        "emitToPatient(req.io, patientId, 'patient:discharged', { message: 'You have been discharged. Your visit details are safely archived. Thank you for choosing MedPlus+.' });"
    );
    fs.writeFileSync('backend/routes/nurse.routes.js', content);
    console.log("Success");
} else {
    // If exact spaces differ, use a regex
    console.log("Exact match not found, using regex");
    const regex = /await patientsColl\.updateOne\([\s\S]*?status: 'discharged',[\s\S]*?isHistorical: true[\s\S]*?}\s*\);\s*/;
    content = content.replace(regex, newStr + "\n\n        ");
    content = content.replace(
        "emitToPatient(req.io, patientId, 'patient:discharged', { message: 'You have been discharged. Thank you for choosing MedPlus+.' });",
        "emitToPatient(req.io, patientId, 'patient:discharged', { message: 'You have been discharged. Your visit details are safely archived. Thank you for choosing MedPlus+.' });"
    );
    fs.writeFileSync('backend/routes/nurse.routes.js', content);
    console.log("Regex fallback applied.");
}
