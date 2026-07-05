# User Devices API Documentation

This document is for the mobile app team to fetch the logged-in user's assigned devices and device details.

## Base URL

```text
https://it.excellentpublicity.co
```

## Authentication

These mobile device endpoints support either auth method:

```http
Authorization: Bearer <accessToken>
```

or the cookies received from `POST /api/auth/login`:

```http
Cookie: access_token=<jwt>; refresh_token=<jwt>
```

Recommended for mobile: send the `accessToken` from the login response as a bearer token. If the access token expires, call `POST /api/auth/refresh` with the saved refresh cookie, then retry once.

## Get My Device List

Returns only the devices assigned to the logged-in user.

```http
GET /api/mobile/devices
Authorization: Bearer <accessToken>
```

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/mobile/devices" \
  -H "Authorization: Bearer <accessToken>"
```

### Success Response

Status: `200 OK`

```json
{
  "count": 2,
  "devices": [
    {
      "id": "inventory-item-uuid",
      "pid": "EP-001",
      "displayName": "Dell Latitude 5440",
      "type": "LAPTOP",
      "status": "ACTIVE",
      "condition": "GOOD",
      "ownership": "COMPANY",
      "brand": "Dell",
      "model": "Latitude 5440",
      "serialNumber": "ABC123456",
      "os": "Windows 11 Pro",
      "ram": "16GB",
      "storage": "512GB SSD",
      "processor": "Intel Core i5",
      "graphicsCard": null,
      "hasCharger": true,
      "hasMouse": false,
      "department": "IT",
      "location": "Ahmedabad",
      "assignedUser": "Karan Sharma",
      "assignedDate": "2026-01-10T00:00:00.000Z",
      "returnDate": null,
      "maintenanceDate": null,
      "warrantyDate": "2027-01-10T00:00:00.000Z",
      "warrantyType": "Warranty",
      "createdAt": "2026-01-10T00:00:00.000Z",
      "updatedAt": "2026-07-05T00:00:00.000Z",
      "ticketCount": 3,
      "maintenanceCount": 1
    }
  ]
}
```

### Empty Response

If the user has no linked devices:

```json
{
  "count": 0,
  "devices": []
}
```

## Get My Device Details

Use the `id` from the device list response. This is the inventory item UUID, not the `pid`.

```http
GET /api/mobile/devices/{id}
Authorization: Bearer <accessToken>
```

### Example Request

```bash
curl -i "https://it.excellentpublicity.co/api/mobile/devices/inventory-item-uuid" \
  -H "Authorization: Bearer <accessToken>"
```

### Success Response

Status: `200 OK`

```json
{
  "device": {
    "id": "inventory-item-uuid",
    "pid": "EP-001",
    "displayName": "Dell Latitude 5440",
    "type": "LAPTOP",
    "status": "ACTIVE",
    "condition": "GOOD",
    "ownership": "COMPANY",
    "brand": "Dell",
    "model": "Latitude 5440",
    "serialNumber": "ABC123456",
    "os": "Windows 11 Pro",
    "ram": "16GB",
    "storage": "512GB SSD",
    "processor": "Intel Core i5",
    "graphicsCard": null,
    "hasCharger": true,
    "hasMouse": false,
    "department": "IT",
    "location": "Ahmedabad",
    "assignedUser": "Karan Sharma",
    "assignedDate": "2026-01-10T00:00:00.000Z",
    "returnDate": null,
    "maintenanceDate": null,
    "purchasedDate": "2026-01-05T00:00:00.000Z",
    "warrantyDate": "2027-01-10T00:00:00.000Z",
    "warrantyType": "Warranty",
    "systemSpecs": {
      "batteryHealth": "Good"
    },
    "createdAt": "2026-01-10T00:00:00.000Z",
    "updatedAt": "2026-07-05T00:00:00.000Z",
    "tickets": [
      {
        "id": "ticket-uuid",
        "title": "Laptop battery issue",
        "status": "OPEN",
        "priority": "MEDIUM",
        "productName": null,
        "componentName": "Battery",
        "createdAt": "2026-07-01T00:00:00.000Z",
        "updatedAt": "2026-07-01T00:00:00.000Z"
      }
    ],
    "maintenanceRecords": [
      {
        "id": "maintenance-record-uuid",
        "description": "Battery checked",
        "startDate": "2026-07-02T00:00:00.000Z",
        "endDate": null,
        "technician": "IT Team",
        "createdAt": "2026-07-02T00:00:00.000Z",
        "updatedAt": "2026-07-02T00:00:00.000Z"
      }
    ]
  }
}
```

## Errors

### Unauthorized

Status: `401 Unauthorized`

```json
{
  "error": "Unauthorized"
}
```

This means the access token/cookies are missing, invalid, expired, or the account is not active.

### Device Not Found

Status: `404 Not Found`

```json
{
  "error": "Device not found"
}
```

This means the device does not exist or is not assigned to the logged-in user.

### Server Error

Status: `500 Internal Server Error`

```json
{
  "error": "Failed to fetch devices"
}
```

or:

```json
{
  "error": "Failed to fetch device details"
}
```

## React Native Example

```js
const API_BASE_URL = 'https://it.excellentpublicity.co';

export async function getMyDevices(accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/mobile/devices`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch devices');
  }

  return data.devices;
}

export async function getMyDeviceDetails(deviceId, accessToken) {
  const res = await fetch(`${API_BASE_URL}/api/mobile/devices/${deviceId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch device details');
  }

  return data.device;
}
```

## Axios Example

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://it.excellentpublicity.co',
});

export async function getMyDevices(accessToken) {
  const { data } = await api.get('/api/mobile/devices', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data.devices;
}

export async function getMyDeviceDetails(deviceId, accessToken) {
  const { data } = await api.get(`/api/mobile/devices/${deviceId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return data.device;
}
```

## Notes

- The API returns only devices where `userId` matches the logged-in user.
- Admin and agent users also get only their own assigned devices from these mobile endpoints.
- Sensitive admin-only fields are not returned, including device password, price, vendor invoice, internal notes, old tag, and old user.
- The detail endpoint includes this user's tickets linked to that device.
