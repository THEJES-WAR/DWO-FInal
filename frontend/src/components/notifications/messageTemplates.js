export const notificationTemplates = {
  'nurse_assigned': (data) => `Hello ${data.patientName}, Nurse ${data.nurse.name} from ${data.nurse.ward} has been assigned to you. Please visit the nurse station. Suggested time: ${data.nurseVisit?.suggestedTime || 'Now'}.`,
  
  'appointment_booked': (data) => `Your appointment with Dr. ${data.doctorName} (${data.specialty}) is confirmed for ${data.date} at ${data.time} in ${data.room}.`,
  
  'appointment_cancelled': (data) => `Dr. ${data.doctorName} has cancelled your ${data.date} appointment. Please rebook below.`,
  
  'feedback_given': (data) => `Dr. ${data.doctorName} has reviewed your case and shared feedback. Please check the feedback section.`,
  
  'prescription_ready': (data) => `Your prescription from Dr. ${data.doctorName} is ready. Check in with Nurse ${data.nurseName} to proceed.`,
  
  'bill_generated': (data) => `Your bill of ₹${data.amount} has been generated. Please complete payment at the billing counter.`,
  
  'bill_paid': () => `Your payment has been confirmed. Thank you.`,
  
  'patient_discharged': () => `You have been successfully discharged. Your visit summary has been saved to your history.`
};

export const getTemplate = (type, data) => {
    return notificationTemplates[type] ? notificationTemplates[type](data) : data.message || 'New notification received.';
};
