# Tickets API Documentation

This document explains the ticket APIs and the flow behind:

```text
https://it.excellentpublicity.co/dashboard/create
```

It covers user-wise ticket history, ticket creation, updates, comments, deletion, audit history, uploads, and helper APIs.

## Base URL

```text
https://it.excellentpublicity.co
```

Local development:

```text
http://localhost:3000
```

## Authentication

The dashboard ticket APIs use the current web session from cookies:

```http
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

Current protected ticket APIs do not read `Authorization: Bearer <accessToken>` yet. For browser/WebView clients, send credentials/cookies with each request.

## Roles

| Role | Ticket Access |
| --- | --- |
| `USER` | Can create tickets, view own tickets, update own ticket priority, delete own tickets, and comment from pages they can access. |
| `AGENT` | Can view all tickets, update status, resolve tickets, comment, delete, view audit history, see similar tickets. |
| `ADMIN` | Same as agent, plus broader system permissions elsewhere. |

## Ticket Enums

### Status

```text
OPEN
IN_PROGRESS
RESOLVED
CANCELLED
REOPENED
CLOSED
```

### Priority

```text
LOW
MEDIUM
HIGH
```

## Dashboard Create Page Flow

Page:

```http
GET /dashboard/create
```

Optional query params:

| Param | Example | Description |
| --- | --- | --- |
| `inventoryId` | `?inventoryId=item-uuid` | Preselects an assigned inventory item. |
| `type` | `inventory`, `email`, `personal` | Prefills issue type. |
| `title` | `Laptop issue` | Prefills title. |
| `description` | `Screen flickers` | Prefills description. |
| `priority` | `HIGH` | Prefills priority; default is `MEDIUM`. |
| `template` | `1` | Shows "template applied" notice. |

### Create Page Steps

1. User opens `/dashboard/create`.
2. Page calls `GET /api/inventory` to load the user's linked devices.
3. If `inventoryId` is present, the page preselects that device.
4. User selects issue type:
   - `inventory`: laptop/desktop/peripheral issue.
   - `email`: email/drive/software access issue.
   - `personal`: custom product/service issue.
5. User enters title, priority, and description.
6. User optionally uploads attachments/screenshots with `POST /api/upload`.
7. Page submits `POST /api/tickets`.
8. On success, page redirects to `/dashboard`.

## User-Wise Ticket History

### Dashboard Pages

```http
GET /dashboard
GET /dashboard/tickets
```

These are HTML pages, not JSON APIs.

For `USER` role:

- `/dashboard` shows the user's latest 20 tickets.
- `/dashboard/tickets` shows only tickets created by that user.

For `AGENT` and `ADMIN`:

- `/dashboard` and `/dashboard/tickets` can show tickets across the system.

### Ticket List API

```http
GET /api/tickets
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

For `USER`, returns only that user's created tickets. For `AGENT` and `ADMIN`, returns all tickets.

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/tickets" \
  -b "access_token=<jwt>; refresh_token=<jwt>"
```

### Success Response

Status: `200 OK`

```json
[
  {
    "id": "ticket-uuid",
    "shareToken": "public-share-token",
    "title": "Laptop battery issue",
    "description": "Battery drains quickly.",
    "status": "OPEN",
    "priority": "MEDIUM",
    "userId": "user-uuid",
    "inventoryItemId": "inventory-item-uuid",
    "productName": "Dell Latitude 5440 (EP-001)",
    "componentName": "Battery / Power",
    "categoryId": null,
    "aiSuggestedPriority": null,
    "aiSuggestedCategoryId": null,
    "firstResponseAt": null,
    "resolvedAt": null,
    "slaBreached": false,
    "resolutionDetails": null,
    "attachmentUrls": [],
    "createdAt": "2026-07-05T10:00:00.000Z",
    "updatedAt": "2026-07-05T10:00:00.000Z",
    "user": {
      "username": "karan",
      "email": "user@example.com"
    }
  }
]
```

### Errors

Status: `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

Status: `500 Internal Server Error`

```json
{
  "error": "Failed to fetch tickets"
}
```

## Ticket List Page Filters

The HTML page `/dashboard/tickets` supports these query params:

```http
GET /dashboard/tickets?search=laptop&status=OPEN&priority=HIGH
```

| Param | Description |
| --- | --- |
| `search` | Searches title, description, or ticket ID. |
| `status` | Filters by status. Use `ALL` or omit for all. |
| `priority` | Filters by priority. Use `ALL` or omit for all. |
| `filter=assigned` | Filters to tickets owned by the logged-in user. |

These filters are implemented on the server-rendered page, not in `GET /api/tickets`.

## Create Ticket

```http
POST /api/tickets
Content-Type: application/json
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | Yes | Ticket summary. |
| `description` | string | Yes | Detailed issue description. |
| `priority` | string | No | `LOW`, `MEDIUM`, or `HIGH`. Page sends this. |
| `inventoryItemId` | string or null | No | Inventory item UUID for device issue. |
| `productName` | string or null | No | Display name for device/product/service. |
| `componentName` | string or null | No | Device component, for example `Battery / Power`. |
| `isPersonalIssue` | boolean | No | `true` for email/custom issues. |
| `attachmentUrls` | string[] | No | URLs returned by `/api/upload`. |
| `categoryId` | string or null | No | Manual category ID. |
| `tagIds` | string[] | No | Tag IDs to attach. |
| `useAITriage` | boolean | No | Defaults to `true`, but AI runs only when priority is not provided. |
| `notifyAgents` | boolean | No | Defaults to `true`; sends email notifications to active agents/admins. |

### Inventory Issue Example

```bash
curl -i -X POST "https://it.excellentpublicity.co/api/tickets" \
  -H "Content-Type: application/json" \
  -b "access_token=<jwt>; refresh_token=<jwt>" \
  -d '{
    "title": "Laptop battery issue",
    "description": "Battery drains from 100% to 20% within one hour.",
    "priority": "MEDIUM",
    "isPersonalIssue": false,
    "inventoryItemId": "inventory-item-uuid",
    "productName": "Dell Latitude 5440 (EP-001)",
    "componentName": "Battery / Power",
    "attachmentUrls": [
      "https://res.cloudinary.com/example/image/upload/ticket_system_uploads/photo.jpg"
    ],
    "notifyAgents": true
  }'
```

### Email / Drive Issue Example

```json
{
  "title": "Cannot access company email",
  "description": "Gmail says password changed but I did not change it.",
  "priority": "HIGH",
  "isPersonalIssue": true,
  "inventoryItemId": null,
  "productName": "Email Service",
  "componentName": null,
  "attachmentUrls": [],
  "notifyAgents": true
}
```

### Custom Issue Example

```json
{
  "title": "Conference room display not working",
  "description": "The HDMI input is not detected.",
  "priority": "LOW",
  "isPersonalIssue": true,
  "inventoryItemId": null,
  "productName": "Conference Room A Display",
  "componentName": null
}
```

### Success Response

Status: `200 OK`

```json
{
  "id": "ticket-uuid",
  "shareToken": "public-share-token",
  "title": "Laptop battery issue",
  "description": "Battery drains from 100% to 20% within one hour.",
  "status": "OPEN",
  "priority": "MEDIUM",
  "userId": "user-uuid",
  "inventoryItemId": "inventory-item-uuid",
  "productName": "Dell Latitude 5440 (EP-001)",
  "componentName": "Battery / Power",
  "attachmentUrls": [
    "https://res.cloudinary.com/example/image/upload/ticket_system_uploads/photo.jpg"
  ],
  "category": null,
  "tags": [],
  "createdAt": "2026-07-05T10:00:00.000Z",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

### Create Side Effects

- Creates the ticket with status `OPEN`.
- Generates `shareToken` for public tracking.
- Writes an audit log with action `CREATE`.
- If `notifyAgents` is true, emails active `AGENT` and `ADMIN` users.
- If `useAITriage` is true and priority is not provided, AI may suggest priority, category, and tags.

### Create Errors

Status: `400 Bad Request`

```json
{
  "error": "Title and description are required"
}
```

Status: `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

Status: `403 Forbidden`

```json
{
  "error": "You do not have any linked devices. Please select \"Personal Issue\" if this is a custom product."
}
```

Status: `429 Too Many Requests`

```json
{
  "error": "Too many tickets created. Please wait a few minutes before trying again."
}
```

Status: `500 Internal Server Error`

```json
{
  "error": "Failed to create ticket"
}
```

Rate limit: 5 created tickets per 10 minutes per user.

## Upload Attachments

Both ticket creation and comments upload files first, then send returned URLs to the ticket/comment API.

```http
POST /api/upload
Content-Type: multipart/form-data
```

### Example Request

```bash
curl -i -X POST "https://it.excellentpublicity.co/api/upload" \
  -b "access_token=<jwt>; refresh_token=<jwt>" \
  -F "file=@screenshot.png"
```

### Success Response

```json
{
  "url": "https://res.cloudinary.com/example/image/upload/ticket_system_uploads/screenshot.png"
}
```

Errors:

```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "Upload limit reached. Please wait a few minutes."
}
```

```json
{
  "error": "Upload failed"
}
```

Rate limit: 20 uploads per 10 minutes per logged-in user or IP.

## Ticket Detail Page

```http
GET /dashboard/{ticketId}
```

This is an HTML page, not a JSON API. It loads ticket details directly from the database.

For `USER`, the page only allows access to their own tickets. `AGENT` and `ADMIN` can view any ticket.

The page includes:

- Ticket title, status, priority, created date.
- Reporter details.
- Product/device/component info.
- Description and attachments.
- Category and tags.
- Comments.
- Audit history tab.
- SLA badge.
- Similar resolved tickets for staff.
- Status/delete actions.
- Convert-to-knowledge-base action for resolved/closed tickets.

Current gap: there is no `GET /api/tickets/{id}` JSON endpoint.

## Update Ticket

```http
PATCH /api/tickets/{ticketId}
Content-Type: application/json
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Request Body

| Field | Type | Who Can Update | Description |
| --- | --- | --- | --- |
| `status` | string | `ADMIN`, `AGENT` | Updates ticket status. |
| `priority` | string | Owner, `ADMIN`, `AGENT` | Updates priority. |
| `resolutionDetails` | string | `ADMIN`, `AGENT` | Adds resolution notes when resolving. |

### Status Update Example

```bash
curl -i -X PATCH "https://it.excellentpublicity.co/api/tickets/ticket-uuid" \
  -H "Content-Type: application/json" \
  -b "access_token=<jwt>; refresh_token=<jwt>" \
  -d '{
    "status": "IN_PROGRESS"
  }'
```

### Resolve Ticket Example

```json
{
  "status": "RESOLVED",
  "resolutionDetails": "Replaced the faulty charger and verified charging."
}
```

When status changes to `RESOLVED` or `CLOSED`, the API sets `resolvedAt` if it was empty.

When `resolutionDetails` is provided, the API also creates a comment:

```text
**Resolution Notes:**
Replaced the faulty charger and verified charging.
```

### Priority Update Example

```json
{
  "priority": "HIGH"
}
```

### Success Response

Status: `200 OK`

```json
{
  "id": "ticket-uuid",
  "title": "Laptop battery issue",
  "status": "RESOLVED",
  "priority": "MEDIUM",
  "resolvedAt": "2026-07-05T12:00:00.000Z",
  "resolutionDetails": "Replaced the faulty charger and verified charging.",
  "updatedAt": "2026-07-05T12:00:00.000Z"
}
```

### Update Side Effects

- Writes an audit log with action `STATUS_CHANGE` or `UPDATE`.
- Adds a resolution comment when `resolutionDetails` is submitted.
- Tracks `resolvedAt` for resolved/closed tickets.

### Update Errors

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Ticket not found"
}
```

```json
{
  "error": "Forbidden"
}
```

```json
{
  "error": "Failed to update ticket"
}
```

## Delete Ticket

```http
DELETE /api/tickets/{ticketId}
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

Owner, `AGENT`, and `ADMIN` can delete a ticket.

### Example Request

```bash
curl -i -X DELETE "https://it.excellentpublicity.co/api/tickets/ticket-uuid" \
  -b "access_token=<jwt>; refresh_token=<jwt>"
```

### Success Response

Status: `200 OK`

```json
{
  "message": "Ticket deleted successfully"
}
```

### Delete Side Effects

- Writes an audit log with action `DELETE`.
- Deletes the ticket.
- Related comments and ticket tags are deleted by database relations.

### Delete Errors

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Ticket not found"
}
```

```json
{
  "error": "Forbidden"
}
```

```json
{
  "error": "Failed to delete ticket"
}
```

## Add Comment

```http
POST /api/tickets/{ticketId}/comments
Content-Type: application/json
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `content` | string | No | Comment text. Required if no attachments. |
| `attachmentUrls` | string[] | No | Uploaded file URLs. Required if no content. |

### Example Request

```bash
curl -i -X POST "https://it.excellentpublicity.co/api/tickets/ticket-uuid/comments" \
  -H "Content-Type: application/json" \
  -b "access_token=<jwt>; refresh_token=<jwt>" \
  -d '{
    "content": "I tried restarting and the issue still happens.",
    "attachmentUrls": []
  }'
```

### Attachment Comment Example

```json
{
  "content": "",
  "attachmentUrls": [
    "https://res.cloudinary.com/example/image/upload/ticket_system_uploads/error.png"
  ]
}
```

### Success Response

Status: `200 OK`

```json
{
  "id": "comment-uuid",
  "content": "I tried restarting and the issue still happens.",
  "ticketId": "ticket-uuid",
  "userId": "user-uuid",
  "attachmentUrls": [],
  "createdAt": "2026-07-05T12:30:00.000Z",
  "user": {
    "username": "karan",
    "email": "user@example.com",
    "role": "USER"
  }
}
```

### Comment Side Effects

- Writes an audit log with action `CREATE` and entity type `Comment`.
- If the comment is the first staff response from an `AGENT` or `ADMIN`, sets `ticket.firstResponseAt`.

### Comment Errors

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Content or attachment is required"
}
```

```json
{
  "error": "Ticket not found"
}
```

```json
{
  "error": "Failed to create comment"
}
```

Note: this route requires login and checks that the ticket exists, but currently does not independently enforce owner/staff authorization inside the API. The ticket detail page enforces access before rendering the comment form.

## Ticket Audit History

The audit history tab on `/dashboard/{ticketId}` calls:

```http
GET /api/tickets/{ticketId}/audit
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/tickets/ticket-uuid/audit" \
  -b "access_token=<jwt>; refresh_token=<jwt>"
```

### Success Response

Status: `200 OK`

```json
{
  "logs": [
    {
      "id": "audit-log-uuid",
      "action": "CREATE",
      "changes": null,
      "metadata": {
        "title": "Laptop battery issue",
        "priority": "MEDIUM",
        "categoryId": null,
        "aiSuggested": false
      },
      "user": {
        "id": "user-uuid",
        "username": "karan",
        "email": "user@example.com",
        "role": "USER"
      },
      "createdAt": "2026-07-05T10:00:00.000Z"
    },
    {
      "id": "audit-log-uuid",
      "action": "STATUS_CHANGE",
      "changes": {
        "status": {
          "from": "OPEN",
          "to": "IN_PROGRESS"
        }
      },
      "metadata": null,
      "user": {
        "id": "agent-uuid",
        "username": "agent",
        "email": "agent@example.com",
        "role": "AGENT"
      },
      "createdAt": "2026-07-05T11:00:00.000Z"
    }
  ]
}
```

### Audit Actions

```text
CREATE
UPDATE
STATUS_CHANGE
DELETE
```

### Audit Errors

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Failed to fetch audit logs"
}
```

Note: this route requires login, but currently does not enforce owner/staff authorization inside the API. The ticket detail page itself enforces access before rendering the history tab.

## Simple Ticket Status Tracking

```http
GET /api/tickets/track?id={ticketId}
```

This is a lightweight public status lookup by ticket ID.

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/tickets/track?id=ticket-uuid"
```

### Success Response

```json
{
  "id": "ticket-uuid",
  "status": "OPEN",
  "updatedAt": "2026-07-05T10:00:00.000Z"
}
```

### Errors

```json
{
  "error": "Ticket ID is required"
}
```

```json
{
  "error": "Ticket not found"
}
```

```json
{
  "error": "Internal server error"
}
```

For the full public QR/share-token tracking flow, see [QR Ticket API](./qr-ticket-api.md).

## AI Triage Helper

```http
POST /api/ai/triage
Content-Type: application/json
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

This endpoint analyzes title and description and returns suggested priority, category, and tags.

### Request Body

```json
{
  "title": "Laptop battery issue",
  "description": "Battery drains within one hour."
}
```

### Success Response

```json
{
  "priority": "MEDIUM",
  "categoryId": "category-uuid",
  "categoryName": "Hardware",
  "tagIds": ["tag-uuid"],
  "tagNames": ["battery"]
}
```

Errors:

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Title and description are required"
}
```

```json
{
  "error": "Failed to analyze ticket",
  "details": "..."
}
```

## Similar Resolved Tickets

Used on the ticket detail page sidebar for `AGENT` and `ADMIN`.

```http
POST /api/ai/similar-tickets
Content-Type: application/json
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Request Body

```json
{
  "description": "Battery drains within one hour.",
  "ticketId": "ticket-uuid",
  "limit": 5
}
```

### Success Response

```json
{
  "tickets": [
    {
      "id": "similar-ticket-uuid",
      "title": "Battery replacement required",
      "description": "Laptop battery drains quickly...",
      "status": "RESOLVED",
      "priority": "MEDIUM",
      "category": "Hardware",
      "tags": ["battery"],
      "createdAt": "2026-06-01T10:00:00.000Z",
      "resolvedAt": "2026-06-02T10:00:00.000Z",
      "lastComment": "Battery was replaced."
    }
  ],
  "count": 1
}
```

Errors:

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Forbidden"
}
```

```json
{
  "error": "Description is required"
}
```

```json
{
  "error": "Failed to find similar tickets"
}
```

## Convert Resolved Ticket To Knowledge Base

Used on the ticket detail page for staff when ticket status is `RESOLVED` or `CLOSED`.

```http
POST /api/kb/convert
Content-Type: application/json
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Request Body

```json
{
  "ticketId": "ticket-uuid"
}
```

### Success Response

```json
{
  "article": {
    "id": "article-uuid",
    "title": "How to fix rapid laptop battery drain",
    "summary": "A short summary of the issue and solution.",
    "content": "# Problem\n\n...\n\n# Solution\n\n...",
    "published": false,
    "category": {
      "id": "category-uuid",
      "name": "Hardware"
    },
    "tags": [
      {
        "id": "tag-uuid",
        "name": "battery"
      }
    ]
  }
}
```

Errors:

```json
{
  "error": "Unauthorized"
}
```

```json
{
  "error": "Forbidden"
}
```

```json
{
  "error": "Ticket ID is required"
}
```

```json
{
  "error": "Ticket not found"
}
```

```json
{
  "error": "Only resolved tickets can be converted to articles"
}
```

```json
{
  "error": "AI service is currently overloaded. Please try again in a few moments.",
  "details": "..."
}
```

## Complete Create Ticket Flow

1. User logs in.
2. User opens `/dashboard/create`.
3. Page loads assigned inventory from `GET /api/inventory`.
4. User chooses issue type:
   - `inventory`: sends inventory item and component.
   - `email`: sends `productName: "Email Service"` and `isPersonalIssue: true`.
   - `personal`: sends custom `productName` and `isPersonalIssue: true`.
5. User enters title, description, priority.
6. User optionally attaches screenshots/files.
7. Each file uploads to `/api/upload`.
8. Page sends `POST /api/tickets`.
9. API creates ticket with status `OPEN`.
10. API writes audit log.
11. API emails agents/admins if `notifyAgents` is true.
12. Page redirects to `/dashboard`.
13. User can view history at `/dashboard/tickets` or ticket details at `/dashboard/{ticketId}`.

## Complete Ticket Detail Flow

1. User opens `/dashboard/{ticketId}`.
2. Server loads the ticket, comments, category, tags, inventory item, and reporter.
3. If role is `USER`, server checks that ticket belongs to the logged-in user.
4. Page displays ticket details and comments.
5. Comment form uploads files with `/api/upload`, then posts to `/api/tickets/{ticketId}/comments`.
6. Staff can update status with `PATCH /api/tickets/{ticketId}`.
7. Staff can resolve with `resolutionDetails`.
8. The audit tab calls `GET /api/tickets/{ticketId}/audit`.
9. Staff sidebar calls `/api/ai/similar-tickets`.
10. Staff can convert resolved tickets to KB article using `/api/kb/convert`.

## Important Notes For Mobile/API Clients

- Existing ticket APIs are cookie-session based.
- `GET /api/tickets` is the API for user-wise ticket history.
- No JSON detail endpoint exists for `GET /api/tickets/{ticketId}` yet.
- Use `/api/upload` first for attachments, then pass returned URLs.
- For staff status updates, use `PATCH /api/tickets/{ticketId}`.
- For history/audit, use `GET /api/tickets/{ticketId}/audit`.
- For public QR ticket creation, use [QR Ticket API](./qr-ticket-api.md).
