# REST API Reference - ANR Dairy v1.0.0

All API requests must carry the JSON request headers:
- `Content-Type: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (for protected endpoints)

---

## 1. Authentication Endpoints

### Login User
- **URL**: `/api/v1/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "phone": "9999999999",
    "password": "Admin@123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": {
      "id": "603d2b...",
      "name": "ANR Administrator",
      "phone": "9999999999",
      "role": "admin"
    }
  }
  ```

---

## 2. Farmer Endpoints

### List Farmers
- **URL**: `/api/v1/farmers`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "603d2c...",
        "farmerCode": "ANRF0001",
        "name": "G. Venkateswara Rao",
        "phone": "9848022338",
        "village": "Penugonda",
        "milkType": "buffalo",
        "status": "active"
      }
    ]
  }
  ```

---

## 3. Milk Collection Endpoints

### Record Milk Collection
- **URL**: `/api/v1/collections`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "farmer": "603d2c...",
    "date": "2026-07-09",
    "shift": "morning",
    "milkType": "buffalo",
    "quantity": 10.5,
    "fat": 7.0,
    "snf": 9.0
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "_id": "603d2e...",
      "quantity": 10.5,
      "ratePerLiter": 75.0,
      "totalAmount": 787.5
    }
  }
  ```

---

## 4. Backups & Restore Endpoints

### Create Manual Backup
- **URL**: `/api/v1/backup/create`
- **Method**: `POST`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "filename": "backup_manual_20260709.json",
      "fileSize": 3960,
      "appVersion": "1.0.0",
      "backupVersion": "1.0.0"
    }
  }
  ```
