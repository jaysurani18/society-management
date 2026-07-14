# Society Management System (Backend API)

A production-grade, multi-tenant residential society management platform built with Node.js, Express, and PostgreSQL. The system implements robust Role-Based Access Control (RBAC), database transaction-safe financial ledger mechanics, secure multi-part cloud media streaming, and an immutable system-wide append-only audit log trail.

## 🚀 Key Architectural Strengths

*   **Decoupled Architecture & Centralized Gateway:** Built using native ES Modules with all 12 isolated feature domains aggregated behind a unified `v1` master router pathing structure, ensuring clean version boundaries.
*   **Asset-Centric Invoicing:** Maintenance bills are structurally anchored to the physical property asset (`Flat`) rather than individual user accounts. This prevents historical ledger fragmentation when residents move or profiles change.
*   **Race-Condition Safe Cash Reconciliation:** Implements an authenticated manual cash collection workflow enclosed within strict isolated database transactions (`prisma.$transaction`). Includes automatic receipt number generation, row-level checking, and absolute protection against double-collection flaws.
*   **Cloud Media Pipelines:** Multi-part file handling utilizes a non-volatile streaming memory buffer pattern (`multer`) that routes binary streams securely to Cloudinary, ensuring zero reliance on local disk storage.
*   **Immutable Append-Only Audit Trail:** Critical system mutations instantly commit structured audit logs tracking execution states, context parameters, and actor IDs for complete tracking transparency.

---

## 🛠️ Technology Stack

*   **Runtime:** Node.js (v18+) with native ES Modules configuration (`"type": "module"`)
*   **Framework:** Express.js with custom centralized Layered Service-Repository architecture
*   **Database Engine:** PostgreSQL
*   **Data Access Layer:** Prisma ORM with automated structural migrations
*   **Payload Validation:** Zod Schema-first structural sanitizers
*   **Security Context:** JWT authentication, custom multi-role RBAC middleware, Bcrypt.js (10 hashing rounds), Helmet header guards, and CORS isolation
*   **System Tracking:** Winston structured file/console logging logger with Morgan HTTP streaming

---

## 📁 System Repository Architecture

```text
src/
├── app.js                   # Application bootstrapper & global config
├── server.js                # Process execution & graceful shutdown hooks
├── config/                  # Third-party SDK client setups (Prisma, Cloudinary)
├── middleware/              # Authentication, error isolation, and upload filters
├── routes/                  # Central API V1 Gateway routing bundle
├── utils/                   # Shared custom tracking errors and logging engines
└── modules/                 # Modular Domain Directories
    ├── announcements/       # Notice board controls
    ├── audit/               # Read-only audit trail viewer
    ├── auth/                # Security session token issuance
    ├── bills/               # Automated batch invoicing and penalties
    ├── committee/           # Designation assignment transactions
    ├── complaints/          # Conversation threads & cloud attachments
    ├── dashboard/           # Dynamic role-tailored real-time summaries
    ├── flats/               # Property asset configuration
    ├── payments/            # Cash ledger reconciliation engine
    ├── reports/             # Analytics throughput and aggregation logic
    ├── residents/           # Onboarding, listings, and soft-deletes
    └── service-requests/    # Lifecycle state machine workflows
```

---

## ⚙️ Environment Configuration

Create a `.env` file inside the root directory and populate the variables listed below:

```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/society_management?schema=public"
JWT_SECRET="your_core_access_token_generation_key_string"
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_space_name"
CLOUDINARY_API_KEY="your_cloudinary_credential_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_secure_secret_hash"
```

---

## ⚙️ Local Installation & Launch Guide

### 1. Initialize System Workspace

Clone this repository to your local computer, open your terminal context inside the backend target directory, and pull down the structural dependencies:

```bash
npm install
```

### 2. Run Database Structure Migrations

Confirm your local PostgreSQL server is actively running, then deploy the structural schema files and populate local clients using the migration command:

```bash
npx prisma migrate dev --name structural_schema_baseline
```

### 3. Initialize Server Runtime

Boot the hot-reloading native development node application:

```bash
npm run dev
```

The application will boot and bind securely to port `5000`.

---

## 🔏 Core API Interface Map

| Method | Endpoint | Authorized Roles | Functional Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | Initial profile configuration |
| `POST` | `/api/v1/auth/login` | Public | Emits access tokens |
| `POST` | `/api/v1/flats` | `ADMIN` | Deploys apartment unit rows |
| `POST` | `/api/v1/residents` | `ADMIN` | Onboards profile with transaction safety |
| `GET` | `/api/v1/residents` | `ADMIN`, `COMMITTEE` | Paginated index with contains filters |
| `DELETE` | `/api/v1/residents/:id` | `ADMIN` | Deactivates profile and marks state `LEFT` |
| `POST` | `/api/v1/complaints` | `RESIDENT` | Streams binary image text attachments |
| `PATCH` | `/api/v1/complaints/:id/status` | `ADMIN`, `COMMITTEE` | Advances conversational issue tokens |
| `POST` | `/api/v1/bills/batch-generate` | `ADMIN` | Automates baseline flat bill runs |
| `POST` | `/api/v1/bills/:id/record-cash` | `ADMIN`, `COMMITTEE` | Resolves unpaid cash ledger markers |
| `GET` | `/api/v1/dashboard/summary` | All (Authenticated) | Returns role-tailored statistics |
| `GET` | `/api/v1/audit-logs` | `ADMIN` | Pulls append-only execution tables |

---

## 💡 Key Architectural Defenses (Interview Talking Points)

1. **How System Integrity is Maintained During Resident Departure:** The platform completely isolates the `User` identity from the structural property entity (`Flat`). When a resident transitions out, the application executes a safe soft-delete that updates their user profile state flag to `LEFT` and marks `isActive: false` within a transaction. Historical ledger rows and matching cash tracking payments remain perfectly preserved against the un-altered `Flat` asset id.
2. **Elimination of IDOR (Insecure Direct Object Reference) Vectors:** The service layers do not accept vulnerable client-provided client identifiers when performing private operations. Every resident lookup command checks the token identity records parsed from the `req.user` JWT context, completely blocking malicious actors from tampering with query inputs to inspect other properties' bills or private complaint files.
3. **Double-Collection Avoidance Under Concurrent Strikes:** The payment settlement framework handles actions inside database transactions. When an administrative officer commits a cash payment against an open invoice, the record row checks that status values explicitly read `UNPAID`. Any concurrent attempt to click or clear the item throws a validation termination error, maintaining accurate balance sheets.
