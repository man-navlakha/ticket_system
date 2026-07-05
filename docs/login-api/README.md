# Login API Documentation

This document is for the mobile app team integrating login with the ticket system backend.

Related docs: [User Devices API](./devices-api.md)

## Base URL

Use the deployed app URL as the API base URL.

```text
https://it.excellentpublicity.co
```

For local testing from a physical phone, do not use `localhost` because that points to the phone itself. Use the computer's LAN IP or a tunnel URL.

```text
http://192.168.1.10:3000
```

## Authentication Flow

1. Call `POST /api/auth/login` with the user's email/username and password.
2. The API returns the logged-in user and an `accessToken`.
3. The API also sets two HTTP-only cookies:
   - `access_token`, valid for 15 minutes.
   - `refresh_token`, valid for 7 days.
4. For protected APIs, send the saved cookies with every request.
5. If the access session expires, call `POST /api/auth/refresh` with the saved `refresh_token` cookie.
6. To log out, call `POST /api/auth/logout`.

Important: the current backend reads authentication from cookies. It does not currently authenticate protected routes from the `Authorization: Bearer <token>` header.

## Login

```http
POST /api/auth/login
Content-Type: application/json
```

### Request Body

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `identifier` | string | Yes | User email address or username. Matching is case-insensitive. |
| `password` | string | Yes | User password. |

### Example Request

```bash
curl -i -X POST "https://it.excellentpublicity.co/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "user-password"
  }'
```

### Success Response

Status: `200 OK`

```json
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "username",
    "firstName": "First",
    "lastName": "Last",
    "phoneNumber": "9999999999",
    "department": "IT",
    "location": "Ahmedabad",
    "role": "USER",
    "status": "ACTIVE"
  },
  "accessToken": "jwt-access-token"
}
```

### Success Cookies

The response also includes `Set-Cookie` headers.

```http
Set-Cookie: access_token=<jwt>; HttpOnly; Path=/; Max-Age=900; SameSite=Lax
Set-Cookie: refresh_token=<jwt>; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax
```

In production, cookies are also marked `Secure`, so they require HTTPS.

### User Fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | User UUID. |
| `email` | string | User email. |
| `username` | string or null | Login username, if set. |
| `firstName` | string or null | User first name. |
| `lastName` | string or null | User last name. |
| `phoneNumber` | string or null | User phone number. |
| `department` | string or null | User department. |
| `location` | string or null | User location. |
| `role` | string | One of `USER`, `AGENT`, `ADMIN`. |
| `status` | string | One of `PENDING`, `ACTIVE`, `SUSPENDED`. |

## Login Errors

### Missing Required Fields

Status: `400 Bad Request`

```json
{
  "error": "Missing required fields"
}
```

### Invalid Credentials

Status: `401 Unauthorized`

```json
{
  "error": "Invalid credentials"
}
```

### Pending Account

Status: `403 Forbidden`

```json
{
  "error": "Please complete your account setup first. Check your email for the invitation link."
}
```

The API may also return:

```json
{
  "error": "Please complete your account setup first."
}
```

### Suspended Account

Status: `403 Forbidden`

```json
{
  "error": "Please contact support because your account was suspended."
}
```

### Server Error

Status: `500 Internal Server Error`

```json
{
  "error": "Internal Server Error"
}
```

## Check Current Session

Use this endpoint after app launch to check if the user is still logged in.

```http
GET /api/auth/me
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/auth/me" \
  -b "access_token=<jwt>; refresh_token=<jwt>"
```

### Success Response

Status: `200 OK`

```json
{
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "role": "USER",
    "username": "username",
    "firstName": "First",
    "lastName": "Last",
    "phoneNumber": "9999999999",
    "department": "IT",
    "location": "Ahmedabad",
    "status": "ACTIVE"
  }
}
```

### Unauthorized Response

Status: `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

## Refresh Access Token

Use this when the session expires or a protected request returns `401 Unauthorized`.

```http
POST /api/auth/refresh
Cookie: refresh_token=<jwt>
```

### Example Request

```bash
curl -i -X POST "https://it.excellentpublicity.co/api/auth/refresh" \
  -b "refresh_token=<jwt>"
```

### Success Response

Status: `200 OK`

```json
{
  "accessToken": "new-jwt-access-token"
}
```

The response also updates the `access_token` HTTP-only cookie.

### Refresh Errors

Status: `401 Unauthorized`

```json
{
  "error": "No refresh token found"
}
```

```json
{
  "error": "Invalid or expired refresh token"
}
```

```json
{
  "error": "User not found"
}
```

## Logout

```http
POST /api/auth/logout
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

### Example Request

```bash
curl -i -X POST "https://it.excellentpublicity.co/api/auth/logout" \
  -b "access_token=<jwt>; refresh_token=<jwt>"
```

### Success Response

Status: `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

The response clears both auth cookies.

## Mobile App Requirements

- Send `Content-Type: application/json` for login.
- Use HTTPS in production because auth cookies are `Secure`.
- Use an HTTP client that stores and sends cookies.
- Persist cookies securely in the app's cookie jar or secure storage supported by the platform.
- Send cookies on all protected API requests.
- For browser-based clients or WebViews, pass credentials with requests.
- Treat `401 Unauthorized` as an expired or missing session.
- On `401`, try `POST /api/auth/refresh`, then retry the original request once.
- If refresh also returns `401`, clear local session data and show the login screen.
- Native mobile HTTP clients do not use browser CORS, but a browser/WebView app calling from another origin will need backend CORS support with credentials enabled.

## JavaScript / React Native Example

Cookie handling depends on the React Native networking setup. Use a client setup that preserves cookies between requests.

```js
const API_BASE_URL = 'https://it.excellentpublicity.co';

export async function login(identifier, password) {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ identifier, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Unauthorized');
  }

  return data.user;
}
```

## Axios Example

```js
import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://it.excellentpublicity.co',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function login(identifier, password) {
  const { data } = await api.post('/api/auth/login', {
    identifier,
    password,
  });

  return data;
}

export async function refreshSession() {
  const { data } = await api.post('/api/auth/refresh');
  return data;
}

export async function logout() {
  const { data } = await api.post('/api/auth/logout');
  return data;
}
```

## Flutter / Dart Example

Use a client that supports cookie persistence. The example below shows the request shape only.

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

const apiBaseUrl = 'https://it.excellentpublicity.co';

Future<Map<String, dynamic>> login(String identifier, String password) async {
  final response = await http.post(
    Uri.parse('$apiBaseUrl/api/auth/login'),
    headers: {
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'identifier': identifier,
      'password': password,
    }),
  );

  final data = jsonDecode(response.body) as Map<String, dynamic>;

  if (response.statusCode != 200) {
    throw Exception(data['error'] ?? 'Login failed');
  }

  return data;
}
```

## Protected API Request Example

After login, call protected endpoints with the same cookie jar.

```bash
curl -i "https://it.excellentpublicity.co/api/tickets" \
  -b "access_token=<jwt>; refresh_token=<jwt>"
```

## Notes For Backend Changes

If the mobile team wants to use `Authorization: Bearer <accessToken>` instead of cookies, the backend needs a small auth update. Currently, protected APIs call `getCurrentUser()`, and that helper reads only `access_token` and `refresh_token` from cookies.
