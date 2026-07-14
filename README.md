# 🏢 Society Management System

A production-grade, full-stack residential society management platform designed to simplify administration, automate financial ledger invoicing, and streamline communication between admins, committee members, and residents. 

Built with **React (Vite)** on the frontend, **Node.js (Express)** on the backend, and **PostgreSQL (via Neon)** as the database engine.

---

## 🛠️ Technology Stack

### 💻 Frontend (Client)
*   **Core:** React.js, Vite (Fast dev server & build compiler)
*   **Styling:** Vanilla TailwindCSS with a flat, high-contrast, professional design system (border-slate-200, clean borders, zero soft drop-shadows)
*   **Icons:** Lucide React
*   **API Client:** Axios (Centralized API client setup with request/response interceptors to automatically forward JWT session tokens)

### ⚙️ Backend (Server API)
*   **Runtime:** Node.js (v18+) with native ES Modules
*   **Framework:** Express.js utilizing a clean Domain-Driven, Layered Controller-Service architecture
*   **Database Engine:** PostgreSQL (Hosted on Neon serverless postgres)
*   **ORM:** Prisma Client with relational constraints
*   **Payload Validation:** Zod Schema-first structural validators
*   **Security:** JWT session tokens, Bcrypt.js (10 hashing rounds) for passwords, Helmet headers, CORS policies, and multi-role RBAC middleware

---

## 📁 System Architecture Directory Map

```text
society-management/
├── backend/                  # RESTful API Server Engine
│   ├── prisma/               # Schema models & migrations
│   └── src/
│       ├── config/           # Database & cloud storage configurations
│       ├── middleware/       # Authentication, error, and file-upload filters
│       ├── routes/           # Routing gateways
│       └── modules/          # Domain Feature Directories (auth, bills, users, etc.)
└── frontend/                 # React SPA Client
    ├── public/               # Static assets
    └── src/
        ├── components/       # Shared UI components
        ├── context/          # Auth state managers
        ├── pages/            # Role-based dashboard interfaces
        ├── services/         # Axios API connection layers
        └── routes/           # React router guards & page mapping
```

---

## ⚙️ Local Setup & Run Guide

### 1. Database Setup
Confirm you have a PostgreSQL database connection string ready (e.g. from Neon or a local instance). 

### 2. Configure Backend Environment
Create a `.env` file inside the `backend/` directory:
```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/neondb?sslmode=require"
JWT_SECRET="your-jwt-secure-secret-key-phrase"
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 3. Initialize & Start Backend API
```bash
cd backend
npm install
npx prisma db push      # Push schema models directly to database
npx prisma generate     # Regenerate Prisma Client
npm run dev             # Start server on http://localhost:5000
```

### 4. Configure Frontend Environment
Create a `.env` file inside the `frontend/` directory:
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
```

### 5. Initialize & Start Frontend Client
```bash
cd ../frontend
npm install
npm run dev             # Start dev client on http://localhost:5173
```

---

## 🔏 Role-Based Access Control (RBAC) Matrix

Every API endpoint and client page routing boundary is guarded by authentication. Under **Security Best Practices**, public registration and forgot/reset password views have been removed:
*   **Admins** register resident profiles directly inside the Occupancy Directory and can trigger secure temporary password resets.
*   **Residents & Committee Members** manage credentials and change passwords from their secure profile settings page.

| Functional Capabilities | Admin | Committee Member | Resident |
| :--- | :---: | :---: | :---: |
| **Manage Residents / Onboard Flat Units** | ✅ | ❌ | ❌ |
| **Deactivate Resident Profile (State: LEFT)** | ✅ | ❌ | ❌ |
| **Promote Residents / Demote Committee** | ✅ | ❌ | ❌ |
| **Publish Notice Board Bulletins** | ✅ | ✅ | ❌ |
| **Delete Notice Board Bulletins** | ✅ | ✅ | ❌ |
| **View notice bulletins & Announcements** | ✅ | ✅ | ✅ |
| **Batch Generate Monthly Bills** | ✅ | ✅ | ❌ |
| **Record Cash Settlement / Reconcile Dues** | ✅ | ✅ *(Other Flats Only)* | ❌ |
| **Apply Late Penalty Fees** | ✅ | ❌ | ❌ |
| **Submit Service Requests / File Complaints** | ❌ | ❌ | ✅ |
| **Review & Approve/Reject Service Requests** | ✅ | ✅ | ❌ |
| **Assign & Resolve Resident Complaints** | ✅ | ✅ | ❌ |
| **Download Vector PDF Payment Receipts** | ✅ | ✅ | ✅ |
| **View Append-Only System Audit Logs** | ✅ | ❌ | ❌ |

---

## 📖 Complete API Documentation & Testing

For the full RESTful API route list, payloads, validation schemas, and success responses, please refer to the detailed [API Documentation](file:///d:/Durgesh/Personal%20Projects/society-management/API_DOCUMENTATION.md) file.

Additionally, a pre-configured [Postman Collection](file:///d:/Durgesh/Personal%20Projects/society-management/postman_collection.json) is available in the root directory for direct testing.

---

## 💡 Key Architectural Defenses (Technical Highlights)

*   **Non-Blocking Batch Invoicing:** When running batch maintenance bills for a month, the system automatically checks for duplicates. Rather than failing the entire transaction, it **skips** already-invoiced units and successfully bills any new resident flats, returning a count of created and skipped records.
*   **Cash Settlement Self-Collection Block:** To prevent conflicts of interest, the cash collection system runs a database-level validation checking the collector's ID. If a committee member attempts to record cash settlement on a bill belonging to their own flat, the system throws a `403 Forbidden` self-collection violation.
*   **Print-to-PDF Vector Receipt Viewer:** Eliminates third-party client canvas generation. Viewing or downloading paid invoice receipts opens a print-friendly document in a new tab and hooks directly into the browser's native print-to-PDF dialog, downloading clean vector PDFs.
*   **Cloud Media Streaming Buffer:** Multi-part complaint attachments stream through a RAM memory buffer directly to Cloudinary, ensuring zero persistent local disk writes for files.
*   **Audit Trail:** Critical actions (logins, updates, billing runs, deactivations) automatically commit a structured row to the read-only, append-only `AuditLog` table.
