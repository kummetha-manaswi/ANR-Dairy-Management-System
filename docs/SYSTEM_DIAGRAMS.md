# System Architectural Diagrams - ANR Dairy System (v1.0.0)

This document contains Mermaid diagrams illustrating the structure, data models, and deploy workflows of the ANR Dairy Management System.

---

## 1. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    USER ||--o{ USER-SESSION : maintains
    USER ||--o{ AUDIT-LOG : performs
    FARMER ||--o{ MILK-COLLECTION : supplies
    RATE-CHART ||--o{ MILK-COLLECTION : calculates
    MILK-COLLECTION ||--o| INVOICE : groups-into
    INVOICE ||--o| PAYMENT : clears
    FARMER ||--o{ INVOICE : receives
    FARMER ||--o{ PAYMENT : collects
    
    USER {
        ObjectId id PK
        string name
        string phone UNIQUE
        string passwordHash
        string role "admin | employee"
        string status "active | inactive | suspended"
    }

    FARMER {
        ObjectId id PK
        string farmerCode UNIQUE
        string name
        string phone
        string village
        string milkType "cow | buffalo"
        string status "active | inactive"
    }

    MILK-COLLECTION {
        ObjectId id PK
        ObjectId farmer FK
        date date
        string shift "morning | evening"
        number quantity
        number fat
        number snf
        number ratePerLiter
        number totalAmount
        ObjectId collectedBy FK
        ObjectId rateChartUsed FK
    }

    INVOICE {
        ObjectId id PK
        string invoiceNumber UNIQUE
        ObjectId farmer FK
        date startDate
        date endDate
        number totalLiters
        number netAmount
        string status "Draft | Generated | Paid | Cancelled"
    }
```

---

## 2. System Use Case Diagram

```mermaid
graph TD
    subgraph Users
        Admin[Administrator]
        Employee[Collection Agent]
    end

    subgraph ERP System Portal
        UC1[Record Daily Milk Collection]
        UC2[Adjust FAT/SNF Rate Charts]
        UC3[Process Billing Invoices]
        UC4[Log Farmers Payments]
        UC5[Trigger Data Backup]
        UC6[Restore Database Snapshot]
        UC7[Terminate User Sessions]
    end

    Employee --> UC1
    Admin --> UC1
    Admin --> UC2
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5
    Admin --> UC6
    Admin --> UC7
```

---

## 3. Shift Collection Activity Diagram

```mermaid
stateDiagram-v2
    [*] --> StartShift: Log in Agent Portal
    StartShift --> SelectFarmer: Input Farmer Code
    SelectFarmer --> InputMetrics: Liters, FAT%, SNF%
    InputMetrics --> ValidateLimits: Checks boundaries (DairyProfile min/max limits)
    
    state ValidateLimits {
        [*] --> CheckFAT
        CheckFAT --> CheckSNF
    }

    ValidateLimits --> Calculations: Within Range
    ValidateLimits --> ErrorAlert: Exceeds Ranges
    ErrorAlert --> InputMetrics: Re-enter values
    
    Calculations --> SaveCollection: Query RateChart & Compute Amount
    SaveCollection --> NotifyFarmer: Trigger WhatsApp Summary Dispatch
    NotifyFarmer --> FinishShift: All collections completed
    FinishShift --> [*]: Lock shift entries
```

---

## 4. Backup & Restore Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin as System Administrator
    participant Gateway as Express Server API
    participant Engine as Backup Engine
    participant DB as MongoDB Atlas
    participant Disk as Local Backups Storage

    Admin->>Gateway: POST /api/v1/backup/restore (file upload)
    Note over Gateway: Restrict to Admin roles check
    Gateway->>Engine: triggerRestore(backupFile)
    
    rect rgb(240, 240, 240)
        Note over Engine: Refinement 1: Safety Backup Auto-trigger
        Engine->>DB: queryAllCollections()
        DB-->>Engine: collectionsData
        Engine->>Disk: writeFileSync(backup_safety_before_restore_...)
    end

    Engine->>DB: dropDatabase()
    DB-->>Engine: dropped
    Engine->>DB: populateCollections(backupFile)
    DB-->>Engine: restoreComplete
    Engine-->>Gateway: successResponse
    Gateway-->>Admin: HTTP 200 OK (Restore success)
```

---

## 5. Database Schema Layout

```mermaid
classDiagram
    class User {
        +String name
        +String phone
        +String password
        +String role
        +String status
    }
    class UserSession {
        +ObjectId user
        +String deviceInfo
        +String browser
        +String ipAddress
        +Boolean isActive
        +Date loginTime
        +Date logoutTime
    }
    class BackupLog {
        +String filename
        +Date backupDate
        +String backupType
        +String status
        +Number fileSize
        +String appVersion
        +String backupVersion
    }
    class DairyProfile {
        +String dairyName
        +String ownerName
        +String rateMode
        +String language
        +String theme
        +String printLayout
        +String timezone
    }
    User "1" *-- "many" UserSession : associates
```

---

## 6. System Architecture Diagram

```mermaid
graph LR
    subgraph Client Application
        PWA[React PWA Front-End]
        LocalStorage[Local Theme/Locale Store]
    end

    subgraph Backend Gateways
        API[Express Service Gateway]
        Middleware[JWT & Safety rateLimit Shields]
        Scheduler[Backup Daemon Service]
    end

    subgraph Database Layers
        DB[(MongoDB Atlas Server)]
    end

    PWA -->|JSON HTTPS| Middleware
    Middleware --> API
    API --> DB
    Scheduler -->|Periodic trigger| DB
```

---

## 7. Cloud Deployment Topology

```mermaid
graph TD
    UserDev[Developer Client] -->|Git Push| GitHub[GitHub Repository]
    
    subgraph Vercel Hosting
        VercelEngine[Vercel Build Engine]
        VercelSite[React PWA CDN Edge]
    end

    subgraph Render Webservice
        RenderEngine[Render API Container]
    end

    subgraph MongoDB Cloud
        AtlasCluster[(MongoDB Atlas Cluster)]
    end

    GitHub -->|Trigger webhook| VercelEngine
    GitHub -->|Trigger webhook| RenderEngine
    VercelEngine -->|Compiles Build| VercelSite
    VercelSite -->|REST API HTTPS Requests| RenderEngine
    RenderEngine -->|Mongoose DB Driver| AtlasCluster
```
