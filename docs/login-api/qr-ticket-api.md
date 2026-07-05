# QR Ticket / Public Report API Documentation

This document explains the public QR ticket page and all APIs used by:

```text
http://localhost:3000/report/EP-001
```

Production example:

```text
https://it.excellentpublicity.co/report/EP-001
```

## What This Page Does

`/report/{pid}` is a public, no-login page printed into a QR sticker for each inventory device.

Example:

```text
/report/EP-001
```

When a user scans the QR sticker:

1. The server finds the inventory device by `pid`.
2. The page shows device information.
3. Assigned-person information is shown masked by default.
4. The user picks a common problem or writes a custom issue.
5. The user can attach photos.
6. The page creates a ticket using `POST /api/quick-report`.
7. The success screen shows a ticket ID and public tracking URL.

No login is required to create the QR ticket.

## QR Sticker Creation Flow

QR stickers are generated from the dashboard print page:

```http
GET /dashboard/inventory/print-qr?id={inventoryItemId}
GET /dashboard/inventory/print-qr?ids={id1},{id2},{id3}
GET /dashboard/inventory/print-qr?all=1
```

Access:

- Requires login.
- Only `ADMIN` and `AGENT` can access.

Each QR sticker encodes:

```text
{baseUrl}/report/{pid}
```

Example:

```text
https://it.excellentpublicity.co/report/EP-001
```

## Page URL

```http
GET /report/{pid}
```

Example:

```bash
open "http://localhost:3000/report/EP-001"
```

This returns an HTML page, not JSON.

### Server-Side Data Loaded By The Page

The page fetches:

- Inventory item by `pid`.
- Assigned user details, if linked.
- Active common problems for the dropdown.
- Masked person details.
- Device details.

If the device does not exist, the page returns a Next.js `404`.

### Device Data Shown

```json
{
  "pid": "EP-001",
  "type": "LAPTOP",
  "brand": "Dell",
  "model": "Latitude 5440",
  "serialNumber": "ABC123456",
  "os": "Windows 11 Pro",
  "location": "Ahmedabad",
  "department": "IT"
}
```

### Person Data Shown By Default

Personal data is masked until OTP verification.

```json
{
  "nameMasked": "K**** S*****",
  "emailMasked": "k***n@example.com",
  "phoneMasked": "99******99",
  "hasName": true,
  "hasEmail": true,
  "hasPhone": true,
  "canReveal": true,
  "status": "ACTIVE",
  "canActivate": false
}
```

## APIs Used On This Page

| Purpose | Method | Endpoint | Auth |
| --- | --- | --- | --- |
| Upload photo | `POST` | `/api/upload` | No login required |
| Create QR ticket | `POST` | `/api/quick-report` | No login required |
| Lookup device/person summary | `GET` | `/api/quick-report/lookup?pid=EP-001` | No login required |
| Send reveal OTP | `POST` | `/api/quick-report/request-reveal` | No login required |
| Verify reveal OTP | `POST` | `/api/quick-report/verify-reveal` | OTP cookie required |
| Send account activation link | `POST` | `/api/quick-report/send-activation` | No login required |
| List common problems | `GET` | `/api/common-problems` | No login required |
| Send email-signature link | `POST` | `/api/email-signature/send-link` | No login required |

## Upload Photo

The QR page lets the user attach up to 3 photos. The UI blocks files larger than 5 MB. Files are uploaded one by one before creating the ticket.

```http
POST /api/upload
Content-Type: multipart/form-data
```

### Form Data

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | file | Yes | Image file selected from camera/gallery. |

### Example Request

```bash
curl -i -X POST "http://localhost:3000/api/upload" \
  -F "file=@screen-photo.jpg"
```

### Success Response

Status: `200 OK`

```json
{
  "url": "https://res.cloudinary.com/example/image/upload/ticket_system_uploads/photo.jpg"
}
```

### Errors

Status: `400 Bad Request`

```json
{
  "error": "No file provided"
}
```

Status: `429 Too Many Requests`

```json
{
  "error": "Upload limit reached. Please wait a few minutes."
}
```

Status: `500 Internal Server Error`

```json
{
  "error": "Upload failed"
}
```

Rate limit: 20 uploads per 10 minutes per logged-in user or IP.

## Create QR Ticket

This is the main endpoint used when the user taps `Send report`.

```http
POST /api/quick-report
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pid` | string | Yes | Device public ID, for example `EP-001`. |
| `description` | string | Yes | Issue description. Max saved length is 4000 characters. |
| `attachmentUrls` | string[] | No | Uploaded image URLs from `/api/upload`. Max 6 URLs are accepted. |
| `reporterName` | string | No | Optional free-text reporter name. |
| `reporterContact` | string | No | Optional free-text email/phone. |

### Example Request

```bash
curl -i -X POST "http://localhost:3000/api/quick-report" \
  -H "Content-Type: application/json" \
  -d '{
    "pid": "EP-001",
    "description": "Screen flickers and turns black when charger is connected.",
    "attachmentUrls": [
      "https://res.cloudinary.com/example/image/upload/ticket_system_uploads/photo.jpg"
    ]
  }'
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "ticketId": "ticket-uuid",
  "shareToken": "public-share-token",
  "trackUrl": "http://localhost:3000/track/public-share-token"
}
```

### Ticket Created In Database

The endpoint creates a ticket with:

```json
{
  "title": "[QR] Dell Latitude 5440 (EP-001)",
  "priority": "MEDIUM",
  "status": "OPEN",
  "inventoryItemId": "inventory-item-uuid",
  "productName": "Dell Latitude 5440 (EP-001)",
  "attachmentUrls": ["uploaded-photo-url"],
  "shareToken": "public-share-token"
}
```

The ticket owner is resolved in this order:

1. Device assigned user.
2. Oldest active `ADMIN`.
3. Any active `AGENT`.

If no staff user exists, the API returns `503`.

### Notifications

After creating the ticket, the endpoint sends email notifications in the background:

- To all active `ADMIN` and `AGENT` users.
- To the assigned user, if the device has an assigned email.

### Errors

Status: `400 Bad Request`

```json
{
  "error": "Please write what is wrong with the device."
}
```

Status: `404 Not Found`

```json
{
  "error": "Device not found."
}
```

Status: `429 Too Many Requests`

```json
{
  "error": "You have submitted several reports just now. Please wait a few minutes."
}
```

Status: `503 Service Unavailable`

```json
{
  "error": "No IT staff are available to receive this report yet. Please email support directly."
}
```

Status: `500 Internal Server Error`

```json
{
  "error": "Could not submit the report."
}
```

Rate limit: 5 QR reports per 10 minutes per `pid` and IP.

## Lookup Device Summary

This endpoint returns the same kind of safe, masked data that the QR page needs. It is useful for mobile apps or external clients building their own QR report screen.

```http
GET /api/quick-report/lookup?pid=EP-001
```

### Example Request

```bash
curl -i "http://localhost:3000/api/quick-report/lookup?pid=EP-001"
```

### Success Response

Status: `200 OK`

```json
{
  "device": {
    "pid": "EP-001",
    "type": "LAPTOP",
    "brand": "Dell",
    "model": "Latitude 5440",
    "serialNumber": "ABC123456",
    "os": "Windows 11 Pro",
    "location": "Ahmedabad",
    "department": "IT"
  },
  "person": {
    "nameMasked": "K**** S*****",
    "emailMasked": "k***n@example.com",
    "phoneMasked": "99******99",
    "hasContact": true
  }
}
```

### Errors

Status: `400 Bad Request`

```json
{
  "error": "Missing pid"
}
```

Status: `404 Not Found`

```json
{
  "error": "Device not found"
}
```

## Get Common Problems

The current `/report/{pid}` page loads common problems server-side, but this public JSON endpoint is available for custom clients.

```http
GET /api/common-problems
```

### Example Request

```bash
curl -i "http://localhost:3000/api/common-problems"
```

### Success Response

Status: `200 OK`

```json
{
  "items": [
    {
      "id": "common-problem-uuid",
      "label": "Laptop not turning on"
    },
    {
      "id": "common-problem-uuid",
      "label": "Internet not working"
    }
  ]
}
```

On server error, this API returns:

```json
{
  "items": []
}
```

## Reveal Assigned Person Details

The QR page shows assigned-person data masked by default. To reveal full name/email/phone, the page uses a 2-step OTP flow.

### Step 1: Request Reveal OTP

```http
POST /api/quick-report/request-reveal
Content-Type: application/json
```

### Request Body

```json
{
  "pid": "EP-001"
}
```

### Example Request

```bash
curl -i -X POST "http://localhost:3000/api/quick-report/request-reveal" \
  -H "Content-Type: application/json" \
  -d '{ "pid": "EP-001" }'
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "maskedEmail": "k***n@example.com",
  "expiresInSec": 600
}
```

The response sets an HTTP-only cookie:

```http
Set-Cookie: qr-reveal-otp=<signed-jwt>; HttpOnly; Path=/; Max-Age=600; SameSite=Lax
```

The 6-digit code is emailed to the assigned user's email address. The raw OTP is not stored in the database; only a SHA-256 hash is stored inside the signed cookie.

### Request Reveal Errors

Status: `400 Bad Request`

```json
{
  "error": "Missing pid"
}
```

Status: `404 Not Found`

```json
{
  "error": "Device not found"
}
```

Status: `409 Conflict`

```json
{
  "error": "This device is not linked to a user account yet. You can still file the report without revealing personal details."
}
```

Status: `429 Too Many Requests`

```json
{
  "error": "Too many attempts. Please wait a few minutes."
}
```

Rate limit: 5 OTP requests per 10 minutes per `pid` and IP.

### Step 2: Verify Reveal OTP

```http
POST /api/quick-report/verify-reveal
Content-Type: application/json
Cookie: qr-reveal-otp=<signed-jwt>
```

### Request Body

```json
{
  "pid": "EP-001",
  "code": "123456"
}
```

### Example Request

```bash
curl -i -X POST "http://localhost:3000/api/quick-report/verify-reveal" \
  -H "Content-Type: application/json" \
  -b "qr-reveal-otp=<signed-jwt>" \
  -d '{ "pid": "EP-001", "code": "123456" }'
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "person": {
    "name": "Karan Sharma",
    "email": "karan@example.com",
    "phone": "9999999999",
    "department": "IT",
    "location": "Ahmedabad"
  }
}
```

On success, the API clears the `qr-reveal-otp` cookie. The code is single-use.

### Verify Reveal Errors

Status: `400 Bad Request`

```json
{
  "error": "Missing pid or code"
}
```

```json
{
  "error": "Code belongs to a different device."
}
```

```json
{
  "error": "Wrong code. Try again."
}
```

Status: `401 Unauthorized`

```json
{
  "error": "Verification expired. Please request a new code."
}
```

Status: `404 Not Found`

```json
{
  "error": "Device or user no longer available."
}
```

## Send Activation Link

If the assigned user exists but has status `PENDING`, the QR page can email them a fresh account activation/setup link.

```http
POST /api/quick-report/send-activation
Content-Type: application/json
```

### Request Body

```json
{
  "pid": "EP-001"
}
```

### Example Request

```bash
curl -i -X POST "http://localhost:3000/api/quick-report/send-activation" \
  -H "Content-Type: application/json" \
  -d '{ "pid": "EP-001" }'
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "maskedEmail": "k***n@example.com",
  "expiresInSec": 86400
}
```

The invite/setup link is emailed to the assigned user's own email address. The raw invite token is not returned to the browser.

### Activation Errors

Status: `400 Bad Request`

```json
{
  "error": "Missing pid"
}
```

Status: `403 Forbidden`

```json
{
  "error": "This account is suspended. Please contact support to reactivate it."
}
```

Status: `404 Not Found`

```json
{
  "error": "Device not found."
}
```

Status: `409 Conflict`

```json
{
  "error": "This device is not linked to a user account, so an activation link cannot be sent."
}
```

```json
{
  "error": "This account is already active. Try signing in - use the password reset link if needed."
}
```

Status: `429 Too Many Requests`

```json
{
  "error": "Too many activation requests for this device. Please wait 15 minutes and try again."
}
```

Status: `502 Bad Gateway`

```json
{
  "error": "We couldn't send the email right now. Please try again in a few minutes."
}
```

Rate limit: 3 activation requests per 15 minutes per `pid` and IP.

## Email Signature Link From QR Page

The QR page also shows a helper card for sending/copying the user's email-signature link.

```http
POST /api/email-signature/send-link
Content-Type: application/json
```

### Preferred Request Body

Use the device `pid`. The backend resolves the assigned user's email and sends the link there.

```json
{
  "pid": "EP-001",
  "slug": "karan-sharma"
}
```

### Manual Email Fallback

If no device email exists, the page can ask the user for a company email.

```json
{
  "email": "karan@excellentpublicity.com",
  "slug": "karan-sharma"
}
```

Manual email is restricted to:

```text
@excellentpublicity.com
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "maskedEmail": "k***n@excellentpublicity.com",
  "slug": "karan-sharma"
}
```

### Errors

Status: `400 Bad Request`

```json
{
  "error": "Enter a valid email address."
}
```

Status: `403 Forbidden`

```json
{
  "error": "Use your @excellentpublicity.com email."
}
```

Status: `409 Conflict`

```json
{
  "error": "No email on file for this device - enter yours instead.",
  "needsEmail": true
}
```

Status: `429 Too Many Requests`

```json
{
  "error": "Too many requests. Please wait a few minutes."
}
```

Status: `500 Internal Server Error`

```json
{
  "error": "Could not send the link."
}
```

## Public Tracking URL

After ticket creation, the success response includes:

```text
/track/{shareToken}
```

Example:

```text
http://localhost:3000/track/public-share-token
```

The track page is an HTML page, not JSON.

```http
GET /track/{shareToken}
```

Publicly visible:

- Ticket ID
- Title
- Status
- Priority
- Device
- Category
- Created date
- Last update date

Blur-gated until login:

- Description
- Reporter details
- Resolution details
- Conversation/comments

The reporter can post a reply without logging in by using OTP.

## Track Page Reply APIs

These APIs are not called by `/report/{pid}` directly, but they are part of the post-submit tracking flow.

### Request Comment OTP

```http
POST /api/track/{shareToken}/request-comment-otp
```

### Example Request

```bash
curl -i -X POST "http://localhost:3000/api/track/public-share-token/request-comment-otp"
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "maskedEmail": "k***n@example.com",
  "expiresInSec": 600
}
```

The response sets an HTTP-only cookie:

```http
Set-Cookie: track-comment-otp=<signed-jwt>; HttpOnly; Path=/; Max-Age=600; SameSite=Lax
```

Errors:

```json
{
  "error": "Missing token"
}
```

```json
{
  "error": "Too many attempts. Please wait a few minutes."
}
```

```json
{
  "error": "Ticket not found."
}
```

```json
{
  "error": "No reporter email on file for this ticket."
}
```

### Post Comment With OTP

```http
POST /api/track/{shareToken}/post-comment
Content-Type: application/json
Cookie: track-comment-otp=<signed-jwt>
```

### Request Body

```json
{
  "code": "123456",
  "content": "I am available after 3 PM for troubleshooting."
}
```

### Success Response

Status: `200 OK`

```json
{
  "ok": true,
  "commentId": "comment-uuid"
}
```

On success, the API clears the `track-comment-otp` cookie.

Errors:

```json
{
  "error": "Missing code or reply text."
}
```

```json
{
  "error": "Verification expired. Request a new code."
}
```

```json
{
  "error": "Code belongs to a different ticket."
}
```

```json
{
  "error": "Wrong code. Try again."
}
```

```json
{
  "error": "Could not post reply."
}
```

## Complete QR Ticket Flow

1. Admin or agent prints the QR sticker from `/dashboard/inventory/print-qr`.
2. Sticker QR points to `/report/{pid}`.
3. User scans the sticker, for example `/report/EP-001`.
4. Server loads the device, masked assignee info, and common problem list.
5. User selects a predefined problem or chooses `Other`.
6. If `Other`, user types a custom description.
7. User optionally attaches photos.
8. Each photo uploads to `/api/upload`, returning a URL.
9. Browser submits `POST /api/quick-report` with `pid`, final `description`, and `attachmentUrls`.
10. Backend creates a ticket linked to the device.
11. Backend emails active IT staff.
12. Backend emails the assigned user confirmation if an email exists.
13. Response returns `ticketId`, `shareToken`, and `trackUrl`.
14. Page shows the success screen with the ticket ID and track link.
15. User can open `/track/{shareToken}` later to see status.

## Frontend Description Logic

The page builds `description` like this:

- If the user picks a predefined problem, the description is that problem label.
- If the user selects `Other`, the page shows a text box and the description is the typed text.

The API itself accepts any `description` string, so another client can send a richer description if needed.

## Important Security Notes

- `/report/{pid}` is public by design because the QR sticker is physically attached to the device.
- Personal assignee data is masked by default.
- Full assignee details require OTP sent to the assignee's email.
- The reveal OTP expires in 10 minutes and is single-use.
- The track comment OTP expires in 10 minutes and is single-use.
- Public report creation is rate-limited by `pid` and IP.
- Activation links are emailed only to the assigned user's email; the link is never returned to the browser.

## Environment Requirements

For the full QR ticket flow, the backend needs:

- Database access through Prisma.
- Cloudinary credentials for photo uploads:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
- Email configuration for OTP, ticket notifications, and activation links.
- `JWT_SECRET` or `QR_REVEAL_SECRET` for reveal OTP cookies.
- `TRACK_COMMENT_SECRET` or `JWT_SECRET` for track comment OTP cookies.
