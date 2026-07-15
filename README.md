# 🏢 Society Management System (Full-Stack Platform)

Welcome to the **Society Management System**, a production-grade, full-stack application designed to streamline residential society administration, automate maintenance invoicing workflows, organize committee assignments, track resident complaints with media attachments, and record cash payment settlements.

The platform is designed around strict **Role-Based Access Control (RBAC)**, database-safe transactions, and robust data isolation. It features separate frontend and backend workspaces inside a unified code repository.

---

## 🚀 Architectural & Design Strengths

1.  **Asset-Centric Billing Architecture:** Maintenance invoices are structurally bound to the physical property asset (`Flat`) rather than user records. This ensures historical payment ledgers remain completely intact even when residents relocate or change occupancy status.
2.  **Self-Collection Financial Controls:** To prevent fraudulent practices, the system validates cash settlements at the database transaction layer. Committee members cannot record cash collections for bills issued to their own flat units.
3.  **Non-Blocking Batch Invoicing:** When running monthly batch maintenance invoices, the generator skips already-billed flats without failing or rolling back the transaction. It returns the exact count of generated and skipped bills, enabling seamless incremental bill generation.
4.  **Print-to-PDF Vector Receipt Engine:** Bypasses heavy third-party client canvas rendering. paid invoices open in a print-ready viewport that connects directly with the browser's native print-to-PDF utility, ensuring vector-sharp printouts.
5.  **Streaming Cloud Media Pipeline:** Resident complaint images are streamed directly to Cloudinary using RAM buffers via `multer-storage-cloudinary`. Files never write to local disk storage, eliminating file-system leak concerns.
6.  **Immutable System Activity Log:** Critical operations (logins, onboarding, bill runs, password changes) instantly append structured entries to the read-only `AuditLog` database table for transparent tracking.

---

## 🛠️ Complete Technology Stack

### 💻 Client Workspace (Frontend)
*   **Framework Core:** React.js (v18+) with Vite (hot-reloading asset bundling)
*   **Styling Engine:** Vanilla TailwindCSS utilizing a flat, high-contrast, professional design system (border-slate-200, clean layout splits, zero soft drop-shadows)
*   **Icon Library:** Lucide React
*   **HTTP Client:** Axios (Centralized configuration with custom response/request interceptors to automatically bind JWT session headers)

### ⚙️ Server Workspace (Backend)
*   **Runtime:** Node.js (v18+) configuring native ES Modules (`"type": "module"`)
*   **Framework:** Express.js employing a Domain-Driven, Layered Controller-Service-Repository architecture
*   **Database Engine:** Serverless PostgreSQL hosted on Neon
*   **Data Access Layer:** Prisma ORM with automated client generation
*   **Validation Layer:** Zod schema-first structural request validators
*   **Security Context:** JWT tokens, Bcrypt.js (10 hashing rounds) for passwords, Helmet header headers, CORS isolation, and custom RBAC middleware
*   **Logging Engine:** Winston structured file/console logging with Morgan HTTP requests streaming

---

## 📁 Repository Directory Layout

```text
society-management/
├── backend/                         # RESTful API Server Workspace
│   ├── prisma/                      # Prisma ORM setup
│   │   ├── schema.prisma            # Database schema definitions
│   │   └── seed.js                  # Database seeder script
│   ├── scripts/                     # Utility and test scripts
│   │   ├── db-reset-seed.js         # database teardown and seed script
│   │   └── test-api.js              # Integration test suite runner
│   └── src/
│       ├── app.js                   # Express application setup
│       ├── server.js                # App listener and process shutdown hooks
│       ├── config/                  # Third-party SDK clients (Prisma, Cloudinary)
│       ├── middleware/              # Auth, error, and file-upload filters
│       ├── routes/                  # API V1 router entry point
│       └── modules/                 # Isolated Domain Modules
│           ├── announcements/       # Notice bulletins creation & deletion
│           ├── audit/               # Read-only audit trail logging
│           ├── auth/                # Sign-ins, token issuance & credentials
│           ├── bills/               # Batch invoicing, penalties & receipts
│           ├── committee/           # Designation assignment transactions
│           ├── complaints/          # Complaint tickets, images & comments
│           ├── dashboard/           # Tailored summary widgets
│           ├── flats/               # Property asset configuration
│           ├── payments/            # Cash settlement reconciliation
│           ├── reports/             # Financial collection analytics
│           └── residents/           # Occupancy onboarding & soft-deletes
│
└── frontend/                        # React SPA Client Workspace
    ├── public/                      # Static assets
    └── src/
        ├── components/              # Shared UI components
        ├── context/                 # Auth context state providers
        ├── services/                # Axios connection layers
        ├── routes/                  # Route guards & page mappings
        └── pages/                   # Role-based dashboard interfaces
            ├── admin/               # Administrative panel (AdminDashboard.jsx)
            ├── committee/           # Committee panel (CommitteeDashboard.jsx)
            ├── resident/            # Resident panel (ResidentDashboard.jsx)
            └── shared/              # Shared screens (Login.jsx, ProfileSettings.jsx)
```

---

## ⚙️ Environment Configuration

Set up environmental variables inside the respective directories before launching the applications:

### 1. Backend Environment (`/backend/.env`)
```env
PORT=5000
NODE_ENV=development
LOG_LEVEL=info

# Database Connection (Neon PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/neondb?sslmode=require"

# JWT Sign Parameters
JWT_SECRET="your-jwt-secure-secret-key-phrase"
JWT_EXPIRES_IN="1d"

# CORS Policies
ALLOWED_ORIGINS="http://localhost:5173"
FRONTEND_URL="http://localhost:5173"

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```

### 2. Frontend Environment (`/frontend/.env`)
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
```

---

## ⚙️ Local Installation & Run Guide

### 1. Launch the Backend API Server
Navigate to the `backend/` workspace, install dependencies, push database schema baseline structures, and boot the dev server:
```bash
cd backend
npm install
npx prisma db push      # Synchronize database with schema.prisma
npx prisma generate     # Compile Prisma Client
npm run dev             # Start Express server on http://localhost:5000
```

### 2. Launch the Frontend Client
Open a new terminal session, navigate to the `frontend/` workspace, install dependencies, and boot the dev server:
```bash
cd frontend
npm install
npm run dev             # Start React client on http://localhost:5173
```

---

## 🔏 Role-Based Access Control (RBAC) Matrix

To lock down sensitive endpoints, the platform validates sessions using role-specific middleware:
*   **Admins** manage the entire occupancy directory, add flats, promote members, view audit trails, and reset resident passwords.
*   **Residents & Committee Members** change passwords and update emergency/vehicle details under their private profile settings. Public self-registrations and forgot/reset password pages are removed under strict security guidelines.

| Feature Capabilities | Admin | Committee Member | Resident |
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

*   **API Specification:** For a complete list of endpoints, JSON payloads, headers, and success response schemas, see the detailed **[API Documentation](./API_DOCUMENTATION.md)**.
*   **Postman Collection:** A pre-configured API testing collection is saved at **[postman_collection.json](./postman_collection.json)** in the root folder. Import this file into Postman, set the environment variables, and test immediately.
*   **Integration Test Suite:** Execute the backend end-to-end integration tests using:
    ```bash
    cd backend
    npm run db:reset    # Teardown and seed default accounts
    node scripts/test-api.js
    ```

---

## 💡 Key Architectural Defenses (Technical Highlights)

1.  **Double-Collection Protection:** Manual cash reconciliation runs inside PostgreSQL isolated transactions (`prisma.$transaction`). The system locks the bill row, checks that the status reads `UNPAID`, and rejects any concurrent attempts to mark the bill as paid, preserving ledger integrity.
2.  **IDOR (Insecure Direct Object Reference) Protection:** Endpoint controllers do not rely on client-supplied parameters for sensitive personal lookups (like querying a resident's bills). The system extracts the caller's unique `userId` directly from the authenticated JWT session context (`req.user`), completely blocking URL-tampering.
3.  **Cross-Site Scripting (XSS) & Header Defenses:** Leverages `helmet` header guards to disable sniffing, override MIME types, and configure secure Content Security Policies (CSP) to block inline injection attempts.

---

## 📊 Database Schema Relationships (Entity ERD)

Below is the normalized entity-relationship flow of the PostgreSQL database schemas, showing how core roles, property assets, bills, complaints, and logs connect:

```mermaid
erDiagram
    User ||--o| ResidentProfile : "has (OWNER/TENANT)"
    User ||--o| CommitteeProfile : "promoted to"
    User ||--o{ AuditLog : "triggers action"
    Flat ||--o{ ResidentProfile : "allotted to"
    Flat ||--o{ MaintenanceBill : "invoiced against"
    MaintenanceBill ||--o| PaymentRecord : "reconciled by"
    User ||--o{ Complaint : "files complaint"
    User ||--o{ ComplaintComment : "comments on"
    Complaint ||--o{ ComplaintComment : "has thread"
    User ||--o{ ServiceRequest : "raises request"
```

---

## 🧪 Manual Verification Scenario Guides

To verify the platform's advanced behaviors locally, run these quick functional scenarios:

### Scenario A: Test Cash Collection Self-Collection Block
1. Promote **Durgesh Kanzariya** (`durgeshkanzariya@gmail.com`) to a **Committee Member** and assign him designation `Treasurer`.
2. Generate maintenance bills for flat `Wing A - 102` (Durgesh's flat).
3. Log in as **Durgesh Kanzariya** (using his committee account) and navigate to the **Committee Dashboard**.
4. Locate the outstanding bill for Flat `Wing A - 102` and click **Record Cash Settlement**.
5. Confirm the warning prompt. The system will throw a red `Self-collection error: You cannot record cash payments for your own flat unit` validation banner, proving the backend defense.

### Scenario B: Verify Non-Blocking Batch Billing Skip Logic
1. Log in as **Admin** (`admin@society.com`) and navigate to **Batch Billing**.
2. Run batch billing for month `2026-07` with a baseline amount. Bills will generate for all occupied flats.
3. Onboard a **new flat** (e.g., `Wing B - 201`) and assign a resident occupant.
4. Run batch billing for month `2026-07` again.
5. The system will process without transaction rollbacks: it skips the existing occupied flats, bills the new unit, and reports: `Successfully generated 1 new invoices. 2 flats with existing invoices were skipped.`

### Scenario C: Print Vector PDF Receipts
1. Log in as a **Resident** with outstanding dues.
2. Settle the dues at the society office (have Admin record the payment).
3. Go back to your **Resident Dashboard** and locate the bill in the **Billing & History Table** (status: `PAID`).
4. Click **View Receipt** to inspect the invoice on screen, or click **Download Receipt** to immediately open the browser's printing overlay and click **Save as PDF**.

---

## 📸 Interface Screenshots & Previews

### 👤 1. Admin Control Panel (Command Center)
*   **Command Center Overview Dashboard:**
    ![Admin Command Center Overview](./assets/admin1.png)
*   **Resident Directory & Committee Assignments:**
    ![Resident & Committee Directory](./assets/admin2.png)
*   **Batch Monthly Maintenance Invoicing:**
    ![Batch Invoicing](./assets/admin3.png)
*   **Notice Board Broadcasts & Registry:**
    ![Notices Management](./assets/admin4.png)
*   **System Activity Append-Only Logs:**
    ![Audit Logs Timeline](./assets/admin5.png)
*   **Financial Collection Analytics & Reports:**
    ![Financial Analytics](./assets/admin6.png)
*   **Flat Inventory Configuration & Registrations:**
    ![Flat Inventory Configuration](./assets/admin7.png)
*   **Onboard Property Units (Flat Registration Form):**
    ![Flat Onboarding Form](./assets/admin8.png)

### 👥 2. Committee Workspace Panel
*   **Committee Workspace Command Center:**
    ![Committee Dashboard Overview](./assets/committee1.png)
*   **Assigned Service Requests & Tickets Desk:**
    ![Committee Task Desk](./assets/committee2.png)
*   **Society Bulletins Board Feed:**
    ![Committee Notice Board](./assets/committee3.png)
*   **Financial Dues Ledger & Cash Collection:**
    ![Committee Financial Settlement](./assets/committee4.png)
*   **Interactive Discussion Thread (Service/Complaints):**
    ![Committee Thread Discussion](./assets/CommitteeThreadPage.png)

### 🏠 3. Resident Portal Dashboard
*   **Resident Command Center Grid:**
    ![Resident Command Center](./assets/resident1.png)
*   **Consolidated Bills & Payments Ledger:**
    ![Resident Bills and Payments](./assets/resident2.png)
*   **Service Request Desk & Tickets:**
    ![Resident Service Requests](./assets/resident3.png)
*   **Lodged Personal Complaints Registry:**
    ![Resident Complaints](./assets/resident4.png)
*   **Interactive Complaint Discussion Thread:**
    ![Resident Complaint Thread](./assets/ResidentComplaintPage.png)
*   **Announcements Notice Board Feed:**
    ![Resident Notices](./assets/resident5.png)
*   **Personal Profile & Security Settings:**
    ![Resident Profile Settings](./assets/resident6.png)

