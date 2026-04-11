# Digital Workflow Optimization System (DWOS) - MedPlus+

DWOS is a comprehensive hospital management and workflow optimization platform designed to streamline patient care, automate billing, and provide real-time analytics for administrative oversight. It features a multi-role architecture (Patient, Doctor, Nurse, and Admin) with real-time updates and data-driven insights.

## 🚀 Key Features

- **Multi-Role Portals:** Tailored interfaces for Patients, doctors, Nurses, and Administrators.
- **7-Stage Patient Journey:** Real-time tracking of patients from registration to checkout.
- **Automated Billing:** Dynamic calculation of medicinal costs and standardized consultation fees.
- **Real-Time Analytics:** Interactive dashboards for bottleneck identification and workflow efficiency using Recharts.
- **Socket.IO Integration:** Instant notifications and live data updates across all portals.
- **Medical History Management:** Structured phase-ordered history with PDF export for prescriptions and receipts.
- **Workflow Monitoring:** Admin tools to oversee and edit active workflows and assignments.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS v4 (PostCSS)
- **Icons:** Lucide React
- **Charts:** Recharts
- **PDF Generation:** html2pdf.js
- **Real-Time:** Socket.io-client

### Backend
- **Runtime:** Node.js
- **Framework:** Express 5
- **Database:** SQLite (via `db.js`)
- **Real-Time:** Socket.io
- **Authentication:** JWT & bcryptjs

## 📦 Project Structure

```bash
.
├── backend/            # Express server, SQLite database, and Socket.io logic
│   ├── routes/         # API endpoints (Doctor, Patient, Nurse, Admin)
│   ├── socket/         # Socket.io event handlers
│   ├── middleware/     # Auth and validation middleware
│   └── seed.js         # Initial database seeding scripts
└── frontend/           # React component-based UI
    ├── src/
    │   ├── pages/      # Role-specific dashboards and views
    │   ├── components/ # Reusable UI components
    │   └── assets/     # Static resources
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Seed the database with initial data:
   ```bash
   node seed.js
   # Or run specific seeds:
   node seed-admin.js
   node seed-workflow.js
   ```
4. Start the server:
   ```bash
   node server.js
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📊 Workflow Overview

The system optimizes healthcare workflows by categorizing patient interactions into distinct stages:
1. **Registration** (Patient/Admin)
2. **Vitals/Triage** (Nurse)
3. **Consultation** (Doctor)
4. **Lab/Pharmacy** (If applicable)
5. **Billing/Checkout** (Billing Staff/Admin)

Administrators can monitor these stages in real-time to identify bottlenecks and reassign resources as needed.

## 📄 License
This project is for internal hospital management and workflow optimization research.
