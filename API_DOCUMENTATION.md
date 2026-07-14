# 📖 Society Management System - API Specification

This document provides detailed API specifications for the Society Management System RESTful backend. All endpoints are versioned under `/api/v1` and require header authorization unless marked public.

---

## 🔑 Global Configurations & Headers

### Headers
For all protected endpoints, the following headers must be provided:
```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

### Roles (RBAC Validation)
*   `ADMIN` - Complete system control, user onboarding, deactivations, financial setup, logs.
*   `COMMITTEE` - Process service tickets, resolve complaints, publish notice bulletins.
*   `RESIDENT` - File complaints, submit service requests, check dues/bulletins.

---

## 🔐 1. Authentication Modules

### Login User (Public)
*   **Endpoint:** `POST /api/v1/auth/login`
*   **Body:**
    ```json
    {
      "email": "admin@society.com",
      "password": "Admin@123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "token": "eyJhbGciOi...",
        "user": {
          "id": "f9829a24-e593-42a4-bcf8-98b03d42a820",
          "email": "admin@society.com",
          "firstName": "Super",
          "lastName": "Admin",
          "role": "ADMIN",
          "isActive": true
        }
      }
    }
    ```

### Get Current User Profile (Protected)
*   **Endpoint:** `GET /api/v1/auth/me`
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "user": {
          "id": "f9829a24-e593-42a4-bcf8-98b03d42a820",
          "email": "admin@society.com",
          "firstName": "Super",
          "lastName": "Admin",
          "role": "ADMIN",
          "isActive": true
        }
      }
    }
    ```

### Change Password (Protected)
*   **Endpoint:** `PUT /api/v1/auth/change-password`
*   **Body:**
    ```json
    {
      "oldPassword": "Admin@123",
      "newPassword": "AdminSecureNew123"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Password changed successfully"
    }
    ```

---

## 🏢 2. Property Assets & Flats (Admin Only)

### Onboard Flat Unit
*   **Endpoint:** `POST /api/v1/flats`
*   **Body:**
    ```json
    {
      "block": "Wing A",
      "number": "101",
      "floor": 1
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "flat": {
          "id": "4454ec72-af6e-4b87-846e-54157343e069",
          "block": "Wing A",
          "number": "101",
          "floor": 1,
          "createdAt": "2026-07-14T15:20:49.967Z"
        }
      }
    }
    ```

### List All Flats
*   **Endpoint:** `GET /api/v1/flats`
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "flats": [
          {
            "id": "4454ec72-af6e-4b87-846e-54157343e069",
            "block": "Wing A",
            "number": "101",
            "floor": 1
          }
        ]
      }
    }
    ```

---

## 👥 3. Resident Profiles (Admin Only)

### Onboard Resident Profile
*   **Endpoint:** `POST /api/v1/residents`
*   **Body:**
    ```json
    {
      "email": "jay@society.com",
      "firstName": "Jay",
      "lastName": "Surani",
      "phone": "9876543210",
      "flatId": "4454ec72-af6e-4b87-846e-54157343e069",
      "status": "OWNER"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "resident": {
          "id": "fc10cb3d-9b38-4aaa-a5c8-ec8010736d8f",
          "userId": "0f85e833-3962-4291-8d06-02be5b636eac",
          "flatId": "4454ec72-af6e-4b87-846e-54157343e069",
          "status": "OWNER"
        }
      }
    }
    ```

### Get Resident Directory (Admin/Committee)
*   **Endpoint:** `GET /api/v1/residents?page=1&limit=10&search=Jay&status=OWNER`
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "data": {
        "residents": [
          {
            "id": "fc10cb3d-9b38-4aaa-a5c8-ec8010736d8f",
            "status": "OWNER",
            "user": {
              "id": "0f85e833-3962-4291-8d06-02be5b636eac",
              "email": "jay@society.com",
              "firstName": "Jay",
              "lastName": "Surani",
              "phone": "9876543210"
            },
            "flat": {
              "block": "Wing A",
              "number": "101"
            }
          }
        ],
        "pagination": {
          "total": 1,
          "pages": 1,
          "page": 1,
          "limit": 10
        }
      }
    }
    ```

### Deactivate Resident Profile
*   **Endpoint:** `DELETE /api/v1/residents/:id`
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Resident profile deactivated successfully"
    }
    ```

---

## 👥 4. Committee Members (Admin Only)

### Promote User to Committee
*   **Endpoint:** `POST /api/v1/committee`
*   **Body:**
    ```json
    {
      "userId": "0f85e833-3962-4291-8d06-02be5b636eac",
      "designation": "Secretary"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "User promoted to committee successfully"
    }
    ```

### Demote Committee Member
*   **Endpoint:** `DELETE /api/v1/committee/:id`
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Committee profile demoted successfully"
    }
    ```

---

## 💰 5. Billing & Invoicing (Admin/Committee)

### Batch Generate Invoices
*   **Endpoint:** `POST /api/v1/bills/batch-generate`
*   **Body:**
    ```json
    {
      "amount": 2000,
      "billingMonth": "2026-07",
      "dueDate": "2026-08-05"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Successfully generated 2 new invoices. 0 flats with existing invoices were skipped.",
      "data": {
        "totalFlats": 2,
        "createdCount": 2,
        "skippedCount": 0
      }
    }
    ```

### Apply Penalty Fee (Admin Only)
*   **Endpoint:** `POST /api/v1/bills/:id/penalty`
*   **Body:**
    ```json
    {
      "penaltyAmount": 150
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Penalty fee successfully added to invoice."
    }
    ```

### Record Cash Settlement (Self-Collection Blocked)
*   **Endpoint:** `POST /api/v1/bills/:id/record-cash`
*   **Body:**
    ```json
    {
      "amountPaid": 2150,
      "paidByName": "Jay Surani",
      "discount": 0
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Cash payment recorded successfully."
    }
    ```

---

## 📢 6. Notice Board & Bulletins

### Publish Notice bulletin (Admin/Committee)
*   **Endpoint:** `POST /api/v1/announcements`
*   **Body:**
    ```json
    {
      "title": "Scheduled Elevator Servicing",
      "content": "Elevator A will be shut down for annual service tomorrow between 1 PM and 4 PM."
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "message": "Announcement notice successfully broadcasted"
    }
    ```

### Delete Notice bulletin (Admin/Committee)
*   **Endpoint:** `DELETE /api/v1/announcements/:id`
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Announcement notice successfully deleted"
    }
    ```

---

## 🔧 7. Service Requests (Residents/Admins/Committee)

### Raise Service Request (Resident)
*   **Endpoint:** `POST /api/v1/service-requests`
*   **Body:**
    ```json
    {
      "title": "Plumbing leak",
      "description": "Kitchen wash basin pipeline leaking",
      "category": "Plumbing"
    }
    ```
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "request-uuid-here",
        "title": "Plumbing leak",
        "status": "PENDING"
      }
    }
    ```

### Review Service Request (Admin/Committee)
*   **Endpoint:** `PATCH /api/v1/service-requests/:id/review`
*   **Body:**
    ```json
    {
      "status": "APPROVED"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Service request reviewed successfully"
    }
    ```

---

## ⚠️ 8. Complaint Ticketing (Cloud Storage Upload)

### File Complaint (Resident)
*   **Endpoint:** `POST /api/v1/complaints`
*   **Headers:** `Content-Type: multipart/form-data`
*   **Body (Form Data):**
    *   `title`: string
    *   `description`: string
    *   `category`: string
    *   `image`: file (binary cloud upload stream)
*   **Success Response (201 Created):**
    ```json
    {
      "status": "success",
      "data": {
        "id": "complaint-uuid",
        "title": "Stray dog menace",
        "imageUrl": "https://res.cloudinary.com/..."
      }
    }
    ```

### Update Complaint Status (Admin/Committee)
*   **Endpoint:** `PATCH /api/v1/complaints/:id/status`
*   **Body:**
    ```json
    {
      "status": "RESOLVED"
    }
    ```
*   **Success Response (200 OK):**
    ```json
    {
      "status": "success",
      "message": "Complaint status updated successfully"
    }
    ```
