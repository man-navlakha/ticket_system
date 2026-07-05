# User Profile API Documentation

This document is for the mobile app team to fetch and update the logged-in user's profile.

## Base URL

```text
https://it.excellentpublicity.co
```

## Authentication

The profile endpoint supports either auth method:

```http
Authorization: Bearer <accessToken>
```

or the cookies received from `POST /api/auth/login`:

```http
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

Recommended for mobile: send the `accessToken` from the login response as a bearer token.

## Get My Profile

```http
GET /api/mobile/profile
Authorization: Bearer <accessToken>
```

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/mobile/profile" \
  -H "Authorization: Bearer <accessToken>"
```

### Success Response

Status: `200 OK`

```json
{
  "profile": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "karan",
    "firstName": "Karan",
    "lastName": "Sharma",
    "phoneNumber": "9999999999",
    "department": "IT",
    "location": "Ahmedabad",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-01-10T00:00:00.000Z",
    "displayName": "Karan Sharma",
    "avatarInitial": "K",
    "counts": {
      "devices": 2,
      "tickets": 5
    },
    "assignedDevices": [
      {
        "id": "inventory-item-uuid",
        "pid": "EP-001",
        "type": "LAPTOP",
        "status": "ACTIVE",
        "condition": "GOOD",
        "brand": "Dell",
        "model": "Latitude 5440",
        "displayName": "Dell Latitude 5440"
      }
    ],
    "recentTickets": [
      {
        "id": "ticket-uuid",
        "title": "Laptop battery issue",
        "status": "OPEN",
        "priority": "MEDIUM",
        "createdAt": "2026-07-01T00:00:00.000Z",
        "updatedAt": "2026-07-01T00:00:00.000Z"
      }
    ]
  }
}
```

## Update My Profile

Use `PATCH` for partial updates. `PUT` is also supported with the same request body.

```http
PATCH /api/mobile/profile
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Editable Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string or null | No | Display/login username. Must be unique if provided. |
| `firstName` | string or null | No | User first name. |
| `lastName` | string or null | No | User last name. |
| `phoneNumber` | string or null | No | User phone number. |
| `department` | string or null | No | User department. |
| `location` | string or null | No | User location. |

The API does not allow mobile clients to update `email`, `role`, `status`, `password`, or system fields.

### Example Request

```bash
curl -i -X PATCH "https://it.excellentpublicity.co/api/mobile/profile" \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Karan",
    "lastName": "Sharma",
    "phoneNumber": "9999999999",
    "department": "IT",
    "location": "Ahmedabad"
  }'
```

### Success Response

Status: `200 OK`

```json
{
  "message": "Profile updated successfully",
  "profile": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "karan",
    "firstName": "Karan",
    "lastName": "Sharma",
    "phoneNumber": "9999999999",
    "department": "IT",
    "location": "Ahmedabad",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-01-10T00:00:00.000Z",
    "displayName": "Karan Sharma",
    "avatarInitial": "K",
    "counts": {
      "devices": 2,
      "tickets": 5
    },
    "assignedDevices": [],
    "recentTickets": []
  },
  "accessToken": "new-jwt-access-token"
}
```

The response also updates the `access_token` HTTP-only cookie. If the mobile app uses bearer tokens, replace the old access token with the new `accessToken` from this response.

## Errors

### Unauthorized

Status: `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

### Invalid Request Body

Status: `400 Bad Request`

```json
{
  "error": "Invalid JSON body"
}
```

### No Editable Fields

Status: `400 Bad Request`

```json
{
  "error": "No editable profile fields provided"
}
```

### Blocked Fields

Status: `400 Bad Request`

```json
{
  "error": "Email, role, status, password, and system fields cannot be updated from this API"
}
```

### Username Already Taken

Status: `409 Conflict`

```json
{
  "error": "Username already taken"
}
```

### Server Error

Status: `500 Internal Server Error`

```json
{
  "error": "Failed to fetch profile"
}
```

or:

```json
{
  "error": "Failed to update profile"
}
```

## React Native Example

```js
const API_BASE_URL = 'https://it.excellentpublicity.co';

export async function getMyProfile(accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/mobile/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }

  return data.profile;
}

export async function updateMyProfile(accessToken, profilePatch) {
  const res = await fetch(`${API_BASE_URL}/api/mobile/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profilePatch),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  return data;
}
```

## Axios Example

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://it.excellentpublicity.co',
});

export async function getMyProfile(accessToken) {
  const { data } = await api.get('/api/mobile/profile', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data.profile;
}

export async function updateMyProfile(accessToken, profilePatch) {
  const { data } = await api.patch('/api/mobile/profile', profilePatch, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data;
}
```

## Notes

- This API only returns the logged-in user's own profile.
- `assignedDevices` is a lightweight profile preview. Use `GET /api/mobile/devices` for the full device list.
- `recentTickets` returns the latest 5 tickets only.
- Updating profile fields returns a fresh access token so mobile clients can keep local session data current.
