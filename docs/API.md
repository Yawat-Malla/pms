# API Documentation

This document provides comprehensive documentation for all API endpoints in the Program Management System.

## Authentication

All API endpoints (except authentication endpoints) require authentication. Include the session token in your requests.

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "wardId": "ward-uuid-here"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "wardId": "ward-uuid-here"
  }
}
```

#### POST /api/auth/signin
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

## Program Management

### GET /api/programs
Retrieve a list of programs with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by program status
- `wardId` (string): Filter by ward
- `fiscalYearId` (string): Filter by fiscal year
- `search` (string): Search in program names and descriptions

**Response:**
```json
{
  "programs": [
    {
      "id": "program-uuid",
      "code": "PRG-2024-001",
      "name": "Road Construction Project",
      "description": "Construction of new road infrastructure",
      "status": "DRAFT",
      "budget": 1000000.00,
      "startDate": "2024-01-01T00:00:00Z",
      "endDate": "2024-12-31T00:00:00Z",
      "ward": {
        "id": "ward-uuid",
        "name": "Ward 1",
        "code": "W001"
      },
      "fiscalYear": {
        "id": "fy-uuid",
        "year": "2024",
        "isActive": true
      },
      "createdBy": {
        "id": "user-uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalCount": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### POST /api/programs
Create a new program.

**Request Body:**
```json
{
  "code": "PRG-2024-002",
  "name": "School Building Project",
  "description": "Construction of new school building",
  "fiscalYearId": "fy-uuid",
  "wardId": "ward-uuid",
  "budget": "500000.00",
  "programTypeId": "pt-uuid",
  "fundingSourceId": "fs-uuid",
  "startDate": "2024-02-01",
  "endDate": "2024-11-30",
  "tags": ["education", "infrastructure"],
  "responsibleOfficer": "Jane Smith"
}
```

### PUT /api/programs
Update an existing program.

**Request Body:**
```json
{
  "id": "program-uuid",
  "name": "Updated School Building Project",
  "description": "Updated description",
  "status": "SUBMITTED"
}
```

### DELETE /api/programs?id=program-uuid
Delete a program (only DRAFT programs can be deleted).

## Approval Management

### GET /api/approvals
Retrieve pending approvals.

**Query Parameters:**
- `status` (string): Filter by approval status
- `step` (string): Filter by approval step
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "approvals": [
    {
      "id": "approval-uuid",
      "step": "planning_officer",
      "status": "pending",
      "priority": "medium",
      "submittedAt": "2024-01-15T10:00:00Z",
      "program": {
        "id": "program-uuid",
        "name": "Road Construction Project",
        "code": "PRG-2024-001"
      }
    }
  ]
}
```

### PUT /api/approvals
Approve or reject a program.

**Request Body:**
```json
{
  "approvalId": "approval-uuid",
  "action": "approve",
  "remarks": "Approved with conditions"
}
```

## Payment Management

### GET /api/payments
Retrieve payment records.

**Query Parameters:**
- `status` (string): Filter by payment status
- `programId` (string): Filter by program
- `category` (string): Filter by payment category

**Response:**
```json
{
  "payments": [
    {
      "id": "payment-uuid",
      "amount": 50000.00,
      "description": "First installment for road construction",
      "category": "construction",
      "status": "pending",
      "dueDate": "2024-02-15T00:00:00Z",
      "program": {
        "id": "program-uuid",
        "name": "Road Construction Project"
      },
      "requestedBy": {
        "id": "user-uuid",
        "name": "John Doe"
      }
    }
  ]
}
```

### POST /api/payments
Create a new payment request.

**Request Body:**
```json
{
  "programId": "program-uuid",
  "amount": 50000.00,
  "description": "Payment for materials",
  "category": "materials",
  "dueDate": "2024-03-01",
  "supportingDocuments": ["doc1.pdf", "doc2.pdf"]
}
```

## Document Management

### GET /api/documents
Retrieve documents.

**Query Parameters:**
- `programId` (string): Filter by program
- `type` (string): Filter by document type
- `status` (string): Filter by approval status

### POST /api/documents
Upload a new document.

**Request Body:**
```json
{
  "programId": "program-uuid",
  "name": "Project Proposal",
  "type": "proposal",
  "description": "Detailed project proposal document",
  "fileUrl": "/uploads/proposal.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

### POST /api/upload
Upload a file.

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "success": true,
  "file": {
    "name": "document.pdf",
    "size": 1024000,
    "type": "application/pdf",
    "url": "/uploads/1234567890_document.pdf",
    "filename": "1234567890_document.pdf"
  }
}
```

## Monitoring & Reporting

### GET /api/monitoring
Retrieve monitoring records.

### POST /api/monitoring
Create a monitoring record.

**Request Body:**
```json
{
  "programId": "program-uuid",
  "title": "Monthly Progress Report",
  "description": "Progress update for January 2024",
  "status": "on_track",
  "progressPercentage": 25,
  "milestones": [
    {
      "name": "Site preparation",
      "targetDate": "2024-02-01",
      "status": "completed",
      "description": "Site cleared and prepared"
    }
  ],
  "challenges": "Weather delays",
  "nextSteps": "Begin foundation work",
  "budgetUtilization": 20
}
```

### GET /api/reports
Generate various reports.

**Query Parameters:**
- `type` (string): Report type (summary, detailed, financial)
- `startDate` (string): Start date for report
- `endDate` (string): End date for report
- `wardId` (string): Filter by ward
- `format` (string): Output format (json, csv, pdf)

## Dashboard & Analytics

### GET /api/dashboard
Get dashboard summary data.

**Response:**
```json
{
  "summary": {
    "totalPrograms": 25,
    "totalBudget": 5000000.00,
    "totalSpent": 1250000.00,
    "budgetUtilization": 25.0,
    "pendingApprovals": 5,
    "pendingPayments": 8
  },
  "programsByStatus": {
    "DRAFT": 5,
    "SUBMITTED": 3,
    "APPROVED": 10,
    "ACTIVE": 5,
    "COMPLETED": 2
  },
  "recentPrograms": [...],
  "recentActivities": [...],
  "upcomingDeadlines": [...]
}
```

### GET /api/analytics
Get detailed analytics data.

**Query Parameters:**
- `type` (string): Analytics type (overview, budget, performance, timeline, ward-comparison, trends)
- `wardId` (string): Filter by ward
- `fiscalYearId` (string): Filter by fiscal year
- `startDate` (string): Start date
- `endDate` (string): End date

## Notifications

### GET /api/notifications
Get user notifications.

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "title": "Program Approved",
      "message": "Your program 'Road Construction Project' has been approved.",
      "type": "success",
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "timeAgo": "2 hours ago",
      "link": "/programs/program-uuid"
    }
  ],
  "unreadCount": 3
}
```

### PUT /api/notifications
Mark notifications as read/unread.

**Request Body:**
```json
{
  "id": "notification-uuid",
  "isRead": true
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details (for validation errors)"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
