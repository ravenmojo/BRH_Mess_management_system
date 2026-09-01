# BROS (BR Ambedkar Hall Operations & Services) — Technical & Architectural Documentation

> **Platform Version:** `v1.0.0`  
> **Target Environment:** B.R. Ambedkar Hall (BRH), Indian Institute of Technology Kharagpur  
> **Core Motto:** *"For the Bros, By the Bros — Responsibility, Accountability, Transparency."*

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Technology Stack & Infrastructure](#2-technology-stack--infrastructure)
3. [Database Schema & Data Models (Prisma & PostgreSQL)](#3-database-schema--data-models-prisma--postgresql)
4. [Design System & User Experience Architecture](#4-design-system--user-experience-architecture)
5. [Student Features & Core Operational Portals](#5-student-features--core-operational-portals)
   - [5.1 Live Mess Schedule & Weekly Menu Viewer](#51-live-mess-schedule--weekly-menu-viewer)
   - [5.2 Multi-Category Maintenance & Sanitation Portal](#52-multi-category-maintenance--sanitation-portal)
   - [5.3 Night Canteen Portal](#53-night-canteen-portal)
   - [5.4 Automated Grievance Ticketing & Lifecycle Governance](#54-automated-grievance-ticketing--lifecycle-governance)
   - [5.5 Universal "My Grievances" Student Portal](#55-universal-my-grievances-student-portal)
   - [5.6 Seasonal Mess Poll System](#56-seasonal-mess-poll-system)
   - [5.7 Transparent Mess Duty & Hygiene Gallery](#57-transparent-mess-duty--hygiene-gallery)
   - [5.8 Hall Community Information Hub](#58-hall-community-information-hub)
6. [Comprehensive Administration & Governance Suite](#6-comprehensive-administration--governance-suite)
   - [6.1 Unified Admin Authentication & State-Preserving Session Gate](#61-unified-admin-authentication--state-preserving-session-gate)
   - [6.2 Mess Administration & Menu Compliance Builder](#62-mess-administration--menu-compliance-builder)
   - [6.3 Maintenance & Infrastructure Administration](#63-maintenance--infrastructure-administration)
   - [6.4 Night Canteen Administration](#64-night-canteen-administration)
   - [6.5 Hall Community Hub Content Management](#65-hall-community-hub-content-management)
   - [6.6 Mess Duty Gallery Moderation & Media Purge Engine](#66-mess-duty-gallery-moderation--media-purge-engine)
   - [6.7 Seasonal Poll Management & Vote Analytics](#67-seasonal-poll-management--vote-analytics)
   - [6.8 Administrator Roster & Permission Governance](#68-administrator-roster--permission-governance)
   - [6.9 Immutable Audit Ledger & Mutation Tracking](#69-immutable-audit-ledger--mutation-tracking)
   - [6.10 Real-Time Operational Analytics & Performance Metrics](#610-real-time-operational-analytics--performance-metrics)
7. [Complete REST API Specification](#7-complete-rest-api-specification)
8. [Security Architecture, Rate Limiting & Data Governance](#8-security-architecture-rate-limiting--data-governance)
9. [Frontend Component Architecture](#9-frontend-component-architecture)
10. [Environment Configuration & Deployment Guide](#10-environment-configuration--deployment-guide)
11. [Summary & System Health Verification](#11-summary--system-health-verification)

---

## 1. Executive Summary & System Architecture

**BROS** (BR Ambedkar Hall Operations & Services) is an enterprise-grade, mobile-first progressive web application built to digitize, streamline, and govern all operational aspects of **B.R. Ambedkar Hall (BRH) at IIT Kharagpur**.

### Core Operational Pillars

```
+---------------------------------------------------------------------------------------+
|                                    BROS ECOSYSTEM                                     |
+--------------------------+---------------------------+--------------------------------+
|       MESS OPS           |     MAINTENANCE & INFRA   |       COMMUNITY & HUB          |
| - Live Weekly Menu       | - 7 Maintenance Domains   | - Weekend Movie Screenings     |
| - Real-Time Serving      | - Common Area Cleaning    | - Intra-Hall Activities        |
| - Cost & Salad Rules     | - IST Timestamp Capture   | - Hall Awards & Trophies       |
| - Mess Grievances        | - Two-Way Verification    | - Boarder Suggestions          |
| - Night Canteen Catalog  | - Status Override Rights  | - Emergency Directory          |
| - Monthly Food Polls     | - 45-Day Archive Engine   | - Transparent Duty Gallery     |
+--------------------------+---------------------------+--------------------------------+
|                                SECURITY & GOVERNANCE                                  |
|  - Server-Side Admin Authentication (HMAC Signed Sessions / Supabase Auth OTP)        |
|  - Zero Client Credential Leakage | Timing-Safe Cryptographic Operations              |
|  - Automated Audit Trail (AdminAuditLog) | Rate-Limiting & CSRF Verification           |
+---------------------------------------------------------------------------------------+
```

### High-Level Architectural Highlights

- **Mobile-First Touch Architecture:** Incorporates hardware-accelerated horizontal swipe gestures between primary modules, sticky navigation controls, and adaptive touch-spring feedback.
- **Strict Separation of Concerns:** Administrative data fetching is deferred until authentication is established; unauthenticated clients receive blurred visual layouts without access to confidential records.
- **Two-Way Resolution Verification:** Grievance resolutions distinguish between one-sided council resolutions and full two-way verification (where both council and student author confirm closure).
- **Long-Term Operational Intelligence:** A background data-retention lifecycle archives resolved complaints after 45 days while permanently preserving statistical aggregates (turnaround times, category frequencies, resolution rates).

---

## 2. Technology Stack & Infrastructure

| Layer | Technology | Purpose & Implementation Details |
|---|---|---|
| **Framework** | Next.js 14.2.3 | App Router architecture, Server Components, API Route Handlers, Edge-compatible endpoints. |
| **Runtime & Language** | Node.js & TypeScript 5.4 | Strict type definitions across schemas, models, API payloads, and component props. |
| **Styling** | Tailwind CSS 3.4 & Vanilla CSS | Custom executive glassmorphism tokens, jewel-tone active indicators, custom keyframes. |
| **Typography** | `Plus_Jakarta_Sans` via `next/font/google` | High-legibility modern sans-serif optimized for dashboard analytics and mobile layouts. |
| **Iconography** | Lucide React | Consistent iconography across student navigation, admin controls, and operational badges. |
| **Database** | PostgreSQL (via Supabase) | Relational schema with connection pooling, foreign keys, cascade constraints, and compound unique indexes. |
| **ORM** | Prisma 5.14.0 | Type-safe schema definitions, database migrations, client generation, and upsert routines. |
| **Authentication** | Supabase Auth & Node `crypto` | OTP email dispatch for student verification and admin authentication; HMAC-SHA256 signed session tokens. |
| **Media Storage** | Cloudinary | Media proof uploads (photos/videos up to 20MB) with signed administrative auto-destroy calls. |
| **Theming** | `next-themes` | Seamless Dark and Light theme toggle with zero layout shift or flash. |

---

## 3. Database Schema & Data Models (Prisma & PostgreSQL)

The database schema is defined in `prisma/schema.prisma` and features 15 relational and statistical models.

### 3.1 Enumerations

#### `FacilityType`
Categorizes services and grievance domains:
- `REGULAR_MESS`: Central mess food, cleanliness, and service.
- `NIGHT_CANTEEN`: Canteen operations (9:30 PM – 2:00 AM).
- `MAINTENANCE_WASHROOM`: Washroom plumbing, fixtures, taps, and geysers.
- `MAINTENANCE_WATER`: Water purifiers, cooling units, and drinking water supply.
- `MAINTENANCE_ELECTRICAL`: Wing lights, fans, corridor switches, and power lines.
- `MAINTENANCE_CIVIL`: Carpentry, doors, windows, masonry, and structural repairs.
- `MAINTENANCE_CLEANING`: Hall corridors, lounges, staircases, and common sanitation.
- `MAINTENANCE_OUTDOOR`: Lawns, volleyball/badminton courts, gym, and grounds.

#### `MealType`
- `BREAKFAST`, `LUNCH`, `DINNER`, `NIGHT_SNACK`

---

### 3.2 Relational Models Breakdown

```mermaid
erDiagram
    DailyMenu ||--o{ MenuItem : contains
    Item ||--o{ MenuItem : categorized_in
    Poll ||--o{ PollOption : provides
    Poll ||--o{ PollVote : receives
    PollOption ||--o{ PollVote : tallies

    Feedback {
        string id PK
        string ticketNumber UK
        string studentName
        string hallRoll
        string roomNo
        string email
        string comment
        FacilityType facilityType
        string status
        string remark
        string remarkHistory
        string mediaUrl
        string capturedAt
        string resolvedBy
        string resolvedByEmail
        string resolvedByRole
        datetime resolvedAt
        boolean isEscalated
        boolean adminResolved
        boolean userResolved
        string overriddenBy
        string overriddenReason
    }

    AdminUser {
        string id PK
        string email UK
        string designation
        string tier
        boolean isMaster
        boolean canOverride
        boolean canManageMess
        boolean canManageMaintenance
    }

    AdminAuditLog {
        string id PK
        string adminEmail
        string action
        string details
        string targetId
        datetime createdAt
    }

    GrievanceStatSummary {
        string id PK
        string category UK
        int totalSubmitted
        int totalResolved
        int totalTwoWayVerified
        int totalEscalated
        bigint totalResolutionTimeMinutes
    }
```

#### Detailed Model Specifications

1. **`Item`**: Master catalog of food items with metadata (price, category, `facilityType`, `isMandatory`, `isSalad`).
2. **`DailyMenu`**: Represents a daily schedule (Sunday–Saturday) per facility with `totalCost`. Unique constraint: `@@unique([dayOfWeek, facilityType])`.
3. **`MenuItem`**: Relational junction connecting `DailyMenu` and `Item` with specific `mealType`, price snapshot, and `optionGroup` (Common, Option 1, Option 2, Veg, Non-Veg).
4. **`Feedback`**: Central grievance record tracking complaint lifecycle, automated ticket numbering, multi-media Cloudinary URLs, camera capture timestamps (`capturedAt`), resolution attribution, priority escalation, two-way verification state, and remark history.
5. **`AdminUser`**: Role-based administrator roster with three-tier authority (`tier: HIGH | LOW`), master admin flag (`isMaster`), override permission (`canOverride`), and scope flags (`canManageMess`, `canManageMaintenance`).
6. **`AdminAuditLog`**: Tamper-evident ledger recording all administrative mutations (creations, approvals, status overrides, menu updates, admin additions/revocations). Includes an automated retention buffer (~2,000 max logs).
7. **`GrievanceStatSummary`**: Permanent accumulator tracking all-time category submissions, resolution counts, two-way verification rates, escalation rates, and cumulative resolution turnaround times in minutes.
8. **`Poll`**, **`PollOption`**, **`PollVote`**: Monthly voting engine. Ensures one vote per student roll number per monthly poll via compound unique constraint `@@unique([pollId, rollNo])`.
9. **`GalleryImage`**: Photographic transparency log for mess duty tasks with categories (`CLEANING`, `RAW_MATERIALS`, `WEIGHT_CHECK`, `PACKAGING`), student uploader details, approval status (`PENDING`, `APPROVED`, `REJECTED`), and 30-day auto-purge expiration.
10. **`MovieScreening`**: Weekend movie events with poster URLs, screening timestamps, and venue details.
11. **`ActivityParticipant`**: Intra-hall cultural, sports, and technical activities and registrations.
12. **`Achievement`**: Hall awards, Open-IIT championship victories, and individual recognitions.
13. **`Suggestion`**: Constructive feedback and ideas from boarders across categories (`MESS`, `MAINTENANCE`, `ACTIVITIES`, `OTHER`) with daily submission throttling.
14. **`EmergencyContact`**: Prioritized contact directory for hall council, wardens, health centers, and security desks.

---

## 4. Design System & User Experience Architecture

The frontend is built with a bespoke **Executive Glassmorphism & Jewel-Tone** design system implemented in `src/app/globals.css`.

```
+-----------------------------------------------------------------------------+
|                          JEWEL-TONE DESIGN LANGUAGE                         |
+----------------------+-----------------------+------------------------------+
| Mess Management      | Maintenance Portal    | Hall Information Hub         |
| Royal Blue           | Steel Sky Blue        | Slate Indigo                 |
| bg-blue-600          | bg-sky-600            | bg-indigo-600                |
+----------------------+-----------------------+------------------------------+
| Breakfast: Amber ☕  | Lunch: Orange ☀️      | Dinner: Indigo 🌙            |
+----------------------+-----------------------+------------------------------+
| Serving Now: Emerald 🟢                      | Escalated: Rose Flame 🔥    |
+----------------------------------------------+------------------------------+
```

### 4.1 Touch Navigation & Gestures

- **`SwipeNavigationProvider` (`src/components/swipe-navigation-provider.tsx`):** Provides hardware-accelerated horizontal swipe transitions between the three primary homepages:
  $$\text{Mess (`/`)} \longleftrightarrow \text{Maintenance (`/maintenance`)} \longleftrightarrow \text{Hall Hub (`/hub`)}$$
- **Touch Filtering:** Automatically suppresses swipe triggers when touches originate within textareas, input fields, horizontal carousels, sliders, or active modals.
- **Directional Transitions:** GPU-accelerated CSS keyframe animations (`.slide-in-right` and `.slide-in-left`).

### 4.2 Intelligent Session Lifecycle & State Preservation

Administrators benefit from a zero-data-loss session lifecycle implemented in `src/components/admin-auth-gate.tsx`:

1. **30-Minute Base Session:** Administrators authenticate into a 30-minute working session with a live countdown clock.
2. **10-Minute Idle Inactivity Detection:** Event listeners (`mousemove`, `keydown`, `touchstart`, `scroll`) detect inactivity. If 10 minutes pass with no interaction, a 60-second countdown prompt appears.
3. **Session Extension (Up to 4x 30-min extensions):** If the administrator is actively working when the 30-minute mark arrives, an extension modal allows adding 30 minutes (up to a 2.5-hour maximum continuous session).
4. **Complete In-Memory Form Preservation:** When the session expires or locks, child UI components remain mounted behind a blurred overlay (`blur-md opacity-35 pointer-events-none`). Unsaved remarks, filter selections, and typed inputs are **100% preserved upon re-authentication**.

---

## 5. Student Features & Core Operational Portals

---

### 5.1 Live Mess Schedule & Weekly Menu Viewer

**Locations:** `src/app/page.tsx`, `src/app/menu/page.tsx`

```
+-----------------------------------------------------------------------------+
|                         LIVE MESS SCHEDULE VIEWER                           |
+-----------------------------------------------------------------------------+
| [SUN]  [MON (Active)]  [TUE]  [WED]  [THU]  [FRI]  [SAT]                    |
+-----------------------------------------------------------------------------+
| ☕ BREAKFAST (07:15 AM - 09:30 AM)                                          |
|    • Common: Tea + 01 pc Banana (₹6.00) [Mandatory]                         |
|    • Option 1: Upma / Poha + Chutney (₹16.00), Milk 150ml (₹9.00)           |
|    • Option 2: Bread, Butter/Jam (₹15.30), Milk 150ml (₹9.00)               |
+-----------------------------------------------------------------------------+
| ☀️ LUNCH (12:00 PM - 02:15 PM) — [🟢 SERVING NOW]                           |
|    • Common: Rice, Roti, Dal, Pickle & Salad (₹16.50) [Mandatory]           |
|    • Common: Alu Posto (₹14.00)                                             |
|    • Veg Choice: Mix Veg (₹16.00)                                           |
|    • Non-Veg Choice: 01 Pc Fish Curry 50gm (₹17.00)                         |
+-----------------------------------------------------------------------------+
| 🌙 DINNER (07:00 PM - 09:15 PM)                                             |
|    • Common: Rice, Roti, Dal, Pickle & Salad (₹16.50) [Mandatory]           |
|    • Veg Choice: Paneer Kolhapuri (₹32.00)                                  |
|    • Non-Veg Choice: Kadhai Chicken 100gm (₹32.00)                          |
+-----------------------------------------------------------------------------+
```

#### Key Capabilities & Use Cases
- **Real-Time Serving Detection:** Uses Indian Standard Time ($UTC + 5:30$) to compute whether the current moment falls in the Breakfast, Lunch, or Dinner window, rendering an animated `🟢 Serving Now` badge.
- **7-Day Selector:** Sunday-to-Saturday layout fitted cleanly into a 7-column grid without horizontal scrolling.
- **Dietary Distinction:** Visual separation between mandatory staples, vegetarian choices, and non-vegetarian alternatives.
- **Full Weekly Menu View (`/menu`):** Provides a breakdown of all 7 days with cumulative price metrics and item classifications.

---

### 5.2 Multi-Category Maintenance & Sanitation Portal

**Locations:** `src/app/maintenance/page.tsx`

```
+-----------------------------------------------------------------------------+
|                   MAINTENANCE CATEGORY SELECTION GRID                       |
+---------------------+-----------------------+-------------------------------+
| 🚿 Washrooms        | 💧 Drinking Water     | ⚡ Electrical                 |
| (Cyan Glass)        | (Blue Glass)          | (Amber Glass)                 |
+---------------------+-----------------------+-------------------------------+
| 🔨 Civil & Wood     | ✨ Cleaning & Hygiene | 🏋️ Gym & Outdoors            |
| (Ochre Wood Glass)  | (Royal Purple Glass)  | (Emerald Green Glass)         |
+---------------------+-----------------------+-------------------------------+
```

#### Governance & Policy Features
- **Common Area Cleaning Notice:** Selecting the **Cleaning** category dynamically displays a policy banner clarifying that cleaning services apply strictly to hall corridors, common lounges, staircases, and shared facilities (not private rooms).
- **Location-Specific Placeholders:** Input placeholders adapt dynamically based on the selected category (e.g., *"Specify Wing & Floor Washroom (e.g. Wing B 2nd Floor)"*).
- **IST Capture Metadata:** Camera capture timestamps (`capturedAt`) are extracted from the media file's client-side metadata and stored in Indian Standard Time ($UTC + 5:30$).

---

### 5.3 Night Canteen Portal

**Locations:** `src/app/night-canteen/page.tsx`

- **Operating Hours:** 9:30 PM to 2:00 AM IST.
- **Categorized Price List:** Fast food, beverages, snacks, and meal combos with real-time price displays.
- **Night Canteen Grievances:** Dedicated submission portal with auto-generated ticket format (e.g., `B-302NC2008261`).

---

### 5.4 Automated Grievance Ticketing & Lifecycle Governance

**Locations:** `src/lib/ticket.ts`, `src/components/ticket-badge.tsx`, `src/components/remark-history-modal.tsx`

#### Ticket Number Specification
Ticket numbers follow a structured, deterministic format:

$$\mathbf{\text{Ticket ID}} = \langle\text{Room No}\rangle + \langle\text{Category Code}\rangle + \langle\text{DDMMYY}\rangle + \langle\text{Daily Count}\rangle$$

| Category | Enum Code | 2-Letter Code | Example Generated Ticket ID |
|---|---|:---:|---|
| Mess Food & Hygiene | `REGULAR_MESS` | `MS` | `D-515MS2308261` |
| Night Canteen | `NIGHT_CANTEEN` | `NC` | `A-102NC2308261` |
| Washroom & Plumbing | `MAINTENANCE_WASHROOM` | `WR` | `B-214WR2308261` |
| Drinking Water & Coolers | `MAINTENANCE_WATER` | `DW` | `C-305DW2308261` |
| Electrical & Lighting | `MAINTENANCE_ELECTRICAL` | `EL` | `A-410EL2308262` |
| Civil, Wood & Masonry | `MAINTENANCE_CIVIL` | `CV` | `D-112CV2308261` |
| Sanitation & Cleaning | `MAINTENANCE_CLEANING` | `CL` | `B-108CL2308261` |
| Gym, Lawns & Outdoors | `MAINTENANCE_OUTDOOR` | `GO` | `C-201GO2308261` |

```
+-----------------------------------------------------------------------------+
|                      GRIEVANCE LIFECYCLE & VERIFICATION                     |
+-----------------------------------------------------------------------------+
|                                                                             |
|   [Student Submits]                                                         |
|          │                                                                  |
|          ▼                                                                  |
|   Status: PENDING (Ticket # Generated)                                      |
|          │                                                                  |
|          ├────────────────────────────────────────┐                         |
|          ▼                                        ▼                         |
|   [Admin Resolves]                         [Student Resolves]               |
|   adminResolved = true                     userResolved = true              |
|   resolvedBy = Admin Designation           resolvedBy = "Boarder (Author)"  |
|          │                                        │                         |
|          └───────────────────┬────────────────────┘                         |
|                              ▼                                              |
|                   Status: RESOLVED                                          |
|                                                                             |
|   Verification State:                                                       |
|   • adminResolved only  ➔ "Resolved by Council"                             |
|   • userResolved only   ➔ "Resolved by Author"                              |
|   • BOTH true           ➔ "Two-Way Verified" (Double Green Checkmark)       |
|                                                                             |
|   Administrative Override:                                                  |
|   • Authorized Admins (`canOverride: true`) can update status when         |
|     necessary, writing an entry to `AdminAuditLog`.                         |
+-----------------------------------------------------------------------------+
```

#### Remark Update History
Every administrative update to a grievance's remark appends an entry to `remarkHistory` (JSON array containing remark text, author designation/email, and IST timestamp). The timeline can be viewed in the interactive `RemarkHistoryModal`.

#### Data Lifecycle & 45-Day Archive Engine
1. **Public Feed 30-Day Window:** Unauthenticated public feeds automatically filter out resolved grievances older than 30 days.
2. **45-Day Archive Purge:** A background process permanently deletes resolved grievance records older than 45 days from PostgreSQL and purges attached media from Cloudinary.
3. **Statistical Aggregate Preservation:** Before deletion, grievance turnaround metrics, escalation statuses, and two-way verification counts are aggregated into `GrievanceStatSummary`.

---

### 5.5 Universal "My Grievances" Student Portal

**Location:** `src/components/my-grievances-view.tsx`

- **Student Dashboard:** Students enter their institute email and verify via a 6-digit OTP (cached for 24 hours).
- **Cross-Section Overview:** Consolidates all grievances filed by the student across Mess, Maintenance, and Night Canteen.
- **One-Click Confirmation:** Allows the student author to confirm issue resolution directly, toggling `userResolved: true`.

---

### 5.6 Seasonal Mess Poll System

**Locations:** `src/app/poll/page.tsx`

- **Monthly Boarder Voting:** Boarders vote on prospective menu items for the upcoming month.
- **Automated Mid-Month Lock:** The voting interface automatically locks after the 15th of each calendar month.
- **Integrity Safeguard:** Enforces one vote per student roll number using compound database constraints (`@@unique([pollId, rollNo])`).
- **Live Visual Analytics:** Displays vote counts and percentage distributions across options in real time.

---

### 5.7 Transparent Mess Duty & Hygiene Gallery

**Locations:** `src/app/gallery/page.tsx`

```
+-----------------------------------------------------------------------------+
|                         TRANSPARENT DUTY GALLERY                            |
+-----------------------------------------------------------------------------+
| Categories:                                                                 |
| [🧹 CLEANING]  [🥬 RAW MATERIALS]  [⚖️ WEIGHT CHECK]  [📦 PACKAGING]        |
|                                                                             |
| Upload Flow:                                                                |
| 1. Direct Upload (Up to 20MB photos/videos)                                 |
| 2. Camera Capture Metadata Extracted (`capturedAt` in IST)                  |
| 3. Saved with Status `PENDING`                                              |
| 4. Mess Admin Moderation: [Approve] or [Reject]                             |
| 5. Rejection / Deletion triggers signed Cloudinary physical file purge      |
| 6. Automated 30-Day Expiration Purge (Database + CDN Storage)               |
+-----------------------------------------------------------------------------+
```

---

### 5.8 Hall Community Information Hub

**Locations:** `src/app/hub/page.tsx`

The Hall Hub serves as the digital common room for B.R. Ambedkar Hall:

```
+-----------------------------------------------------------------------------+
|                           HALL INFORMATION HUB                              |
+-----------------------------------------------------------------------------+
| 🎬 Movies        | Weekend screenings with uncropped aspect ratio poster    |
|                  | display, showtimes, and clipboard/file upload support.   |
+------------------+----------------------------------------------------------+
| 🏆 Awards        | Showcase of intra-hall sports, cultural, and Open-IIT    |
|                  | championship victories.                                  |
+------------------+----------------------------------------------------------+
| 🎯 Activities    | Hall workshops, open mic nights, gaming LAN tournaments, |
|                  | and GBM announcements (categorized as Upcoming/Past).    |
+------------------+----------------------------------------------------------+
| 💡 Ideas         | Constructive suggestion portal with daily rate limits per|
|                  | category per student.                                    |
+------------------+----------------------------------------------------------+
| 📞 Contacts      | Vibrant contact directory for Hall Council, Wardens,     |
|                  | BC Roy Hospital, and Security with 1-click quick dial.   |
+-----------------------------------------------------------------------------+
```

---

## 6. Comprehensive Administration & Governance Suite

The platform provides a unified suite of administrative dashboards, moderation consoles, governance tools, and auditing utilities.

```
+-----------------------------------------------------------------------------------+
|                        ADMINISTRATIVE ECOSYSTEM MAP                               |
+------------------------+--------------------------+-------------------------------+
| `/admin`               | `/maintenance/admin`     | `/hub/admin`                  |
| Mess Menu Builder      | 7 Maintenance Categories | Movie Screenings Management   |
| Compliance Widgets     | Resolution Overrides     | Intra-Hall Activities CRUD    |
| Grievance Moderation   | Two-Way Verification     | Hall Achievements Showcase    |
| Poll & Gallery Links   | Multi-Field Search       | Boarder Suggestions Review    |
| Remark History Modal   | IST Capture Verification | Emergency Directory Editor    |
+------------------------+--------------------------+-------------------------------+
| `/night-canteen/admin` | `/admin/gallery`         | `/admin/poll`                 |
| Canteen Grievances     | 20MB Duty Media Queue    | Monthly Poll Creation         |
| Status & Remarks       | Approve / Reject Purge   | Dynamic Candidate Options     |
| Price List Management  | Lightbox & Bulk Download | Real-Time Vote Analytics      |
+------------------------+--------------------------+-------------------------------+
| GLOBAL GOVERNANCE MODALS (Available across all admin headers)                     |
| • `AdminUsersModal`: Add/edit/revoke admins, designations & override rights.      |
| • `AdminStatsModal`: All-time turnaround times, category stats & resolution rates.|
| • Activity Audit Ledger (`AdminAuditLog`): Immutable ledger of all admin actions. |
+-----------------------------------------------------------------------------------+
```

---

### 6.1 Unified Admin Authentication & State-Preserving Session Gate

**Location:** `src/components/admin-auth-gate.tsx`

Every administrative route (`/admin`, `/maintenance/admin`, `/night-canteen/admin`, `/hub/admin`, `/admin/gallery`, `/admin/poll`) is wrapped inside the `AdminAuthGate` component:

1. **Single-Input Gateway:** Presents a clean, single prompt: *"Enter Admin Email"*. Accepts **any registered email domain** — no `.iitkgp.ac.in` restriction applies to admin login.
2. **Dual Authentication Pathways:**
   - **Primary Administrative Credential:** Direct entry authenticates with full system-wide privileges (`isMasterAdmin: true`, `tier: HIGH`, `canOverride: true`, `canManageMess: true`, `canManageMaintenance: true`).
   - **Registered Admin Email OTP:** Entering a registered administrator email verifies against the `AdminUser` database roster and dispatches a 6-digit OTP via Supabase Auth. Upon OTP verification, the session is initialized with the tier, scope, and permission flags stored in the database for that admin.
3. **Three-Tier Session Context:** Once authenticated, the session carries:
   - `tier`: `HIGH` or `LOW`
   - `isMaster`: Whether this admin can manage other admins and assign master status.
   - `canOverride`: Whether this admin can perform status overrides.
   - `canManageMess` / `canManageMaintenance`: Scope flags for Low-Level admins.
4. **Deferred Data Fetching:** UI cards and background layouts render under a blurred backdrop (`blur-md opacity-35 pointer-events-none select-none`). **Zero database queries or confidential grievance records are requested over the network until authentication succeeds.**
5. **Active Session Top Bar:** Displays active admin designation/email, tier badge, remaining session countdown timer, extension counters, and quick access buttons to **Stats** and **Manage Admins** (visible for High-Level admins only).
6. **Inactivity Auto-Lock & Extension System:**
   - **10-Minute Idle Detection:** Background listeners detect mouse, keyboard, touch, and scroll interactions. If idle for 10 minutes, a high-priority warning popup triggers.
   - **60-Second Auto-Lock Countdown:** Unattended prompts automatically lock the session after 60 seconds.
   - **Session Extensions:** If an administrator is actively interacting when the 30-minute session expires, an extension prompt offers adding 30 minutes (up to 4 extensions, allowing a 2.5-hour continuous working session).
   - **Complete In-Memory Form Preservation:** Locked sessions keep all typed remarks, active filters, and unsubmitted form drafts preserved behind the modal so no work is lost upon re-authenticating.

---

### 6.2 Mess Administration & Menu Compliance Builder

**Location:** `src/app/admin/page.tsx`

The Mess Admin dashboard delivers complete operational control over the central mess facility:

```
+-----------------------------------------------------------------------------+
|                     MESS ADMIN DASHBOARD CAPABILITIES                       |
+-----------------------------------------------------------------------------+
| 📅 Live Menu Builder (Sunday–Saturday)                                      |
|    • Add/Edit meal items across Breakfast, Lunch, Dinner.                   |
|    • Configure Option Groups (Common, Option 1, Option 2, Veg, Non-Veg).    |
|    • Toggle Mandatory Staple flags & Salad classification tags.             |
|    • Real-Time Compliance Rule Engine:                                      |
|      - Weekly Cost Sum vs Budget limit (₹826 / ₹850 buffer).                |
|      - Salad Count Check (Minimum 11 out of 14 meals).                      |
|      - Mandatory item presence (Rice/Dal for Lunch; Rice/Roti/Dal for Dinner)|
|    • Single-click atomic publication to production database.                |
|    • Hidden for Low-Level admins without Mess scope.                        |
+-----------------------------------------------------------------------------+
| 📋 Mess Grievances Moderation Console                                       |
|    • Status Filter Tabs: All, Pending, Resolved.                            |
|    • Real-Time Multi-Field Search (Ticket ID, Room No, Student Name).       |
|    • Multi-Tier Resolution Attribution (Resolver designation, email, IST).  |
|    • Priority Escalation Flagging (`isEscalated`) with urgency notes.       |
|    • Status Override Control (requires `canOverride: true`).                |
|    • Inline Remark Updates with chronological history modal integration.    |
|    • Grievance Deletion with signed Cloudinary physical asset auto-purge.   |
|    • Action buttons (Resolve, Remark Save, Escalate, Menu Editor) wrapped   |
|      in `hasActionAccess` guard — hidden for Low-Level admins out of scope. |
|    • Delete button permanently hidden from Low-Level admins.                |
+-----------------------------------------------------------------------------+
```

---

### 6.3 Maintenance & Infrastructure Administration

**Location:** `src/app/maintenance/admin/page.tsx`

The Maintenance Admin dashboard centralizes hall repair and sanitation governance:

- **Subcategory Management:** Real-time filtering across all 7 maintenance domains (Washrooms `WR`, Drinking Water `DW`, Electrical `EL`, Civil `CV`, Cleaning `CL`, Gym & Outdoors `GO`, and Other `OT`).
- **Two-Way Resolution Verification:** Distinguishes between grievances resolved by council only vs two-way verified by the student author.
- **Discretionary Status Override:** Permitted administrators (`canOverride: true`) can update grievance status when needed, recording an internal audit log note while preserving student privacy publicly.
- **Evidence Verification:** Inspection of attached photos/videos via thumbnail preview gallery with camera capture timestamps (`capturedAt` in IST).
- **Universal Search & Filtering:** Filter by Ticket Number (e.g. `D-515DW2308261`), Room Number (e.g. `D-515`), or issue description.

---

### 6.4 Night Canteen Administration

**Location:** `src/app/night-canteen/admin/page.tsx`

- **Operational Oversight:** Night Canteen service window (9:30 PM to 2:00 AM IST).
- **Canteen Grievance Moderation:** Dedicated tracking of canteen grievances (`<Room>NC<Date><Count>`).
- **Lifecycle Actions:** Status toggling (Pending / Resolved), remark updating with history tracking, priority escalation, and complaint deletion with Cloudinary purge.
- **Catalog Pricing Oversight:** Review and manage canteen item price schedules.

---

### 6.5 Hall Community Hub Content Management

**Location:** `src/app/hub/admin/page.tsx`

The Hall Hub Admin provides complete CRUD management across 5 hall community sections:

```
+-----------------------------------------------------------------------------+
|                        HALL HUB ADMIN MANAGEMENT TABS                       |
+-----------------------------------------------------------------------------+
| 🎬 Movie Screenings                                                         |
|    • Add/Edit/Delete weekend movie screening events.                        |
|    • Movie poster image file upload & clipboard paste with progress bar.    |
|    • Showtime picker & venue selection (e.g. Common Room, OAT Ground).      |
|    • Uncropped aspect-ratio frame preview.                                  |
+-----------------------------------------------------------------------------+
| 🎯 Activities & Events                                                      |
|    • Add/Edit/Delete workshops, acoustic jam nights, TT/Chess tourneys.     |
|    • Organizer attribution, venue input, event date/time scheduling.        |
|    • Automated Upcoming vs Concluded event filtering.                       |
+-----------------------------------------------------------------------------+
| 🏆 Hall Awards & Achievements                                               |
|    • Add/Edit/Delete Open-IIT trophies, inter-hall titles & recognitions.   |
|    • Student/team name, hall roll number, title, description, category.     |
+-----------------------------------------------------------------------------+
| 💡 Boarder Suggestions & Ideas                                              |
|    • Review submitted boarder proposals across Mess, Maintenance, Activities|
|    • Student roll/email attribution, creation timestamps.                   |
+-----------------------------------------------------------------------------+
| 📞 Emergency & Administrative Directory                                     |
|    • Add/Edit/Delete Hall Council, Wardens, Hospital, Security contacts.    |
|    • Role title, contact person name, phone number, display order sorting.  |
+-----------------------------------------------------------------------------+
| ⚡ Staging Seed Utility (`SEED_ALL`)                                        |
|    • Bulk seeds realistic dummy records across all hub sub-sections.        |
+-----------------------------------------------------------------------------+
```

---

### 6.6 Mess Duty Gallery Moderation & Media Purge Engine

**Location:** `src/app/admin/gallery/page.tsx`

The Duty Gallery Moderation queue enforces visual transparency and kitchen accountability:

- **Pending Submissions Queue:** Review student photo/video uploads (up to 20MB) across 4 categories: Cleaning & Hygiene, Raw Materials Inspection, Ration Weight Checks, and Packaging & Cooking.
- **Metadata Verification:** Verifies student uploader details (Name, Roll Number, institutional email) and camera capture timestamp (`capturedAt` in IST).
- **One-Click Approval (`APPROVED`):** Publishes verified media to the public duty gallery.
- **One-Click Rejection (`REJECTED`):** Rejects invalid submissions and automatically triggers a signed Cloudinary physical file purge call to delete the asset from Cloudinary servers.
- **Batch Download & Lightbox:** Admins can preview high-resolution images in a lightbox and download assets for record-keeping.
- **30-Day Auto-Purge Policy:** Enforces automated 30-day retention cleanup across both database records and Cloudinary storage.

---

### 6.7 Seasonal Poll Management & Vote Analytics

**Location:** `src/app/admin/poll/page.tsx`

- **Poll Creation:** Select target Month and Year to initialize a new monthly poll.
- **Candidate Options Builder:** Dynamically add, modify, or remove candidate food items for boarder voting.
- **Active State Control:** Activate new polls while automatically retiring previous monthly polls.
- **Live Analytics Breakdown:** Real-time vote tallying, candidate percentages, and total participation counts.
- **Integrity Safeguard:** Guarantees 1 vote per student roll number.

---

### 6.8 Administrator Roster & Permission Governance

**Location:** `src/components/admin-users-modal.tsx`

Accessible via the **Manage Admins** button on the active admin session banner (visible only to High-Level and Master Admins).

```
+-----------------------------------------------------------------------------+
|                THREE-TIER ADMINISTRATOR ROSTER & PERMISSION CONSOLE         |
+------------------+----------------------------------------------------------+
| Tier             | Capabilities                                             |
+------------------+----------------------------------------------------------+
| 👑 Master Admin  | Full system access · Manage all admins · Assign/revoke   |
|  isMaster: true  | master authority to other High-Level admins              |
+------------------+----------------------------------------------------------+
| 🛡️ High-Level   | Full grievance, menu, poll, gallery & canteen access ·   |
|  tier: HIGH      | Optional: status override rights                         |
+------------------+----------------------------------------------------------+
| 👤 Low-Level    | Read-only everywhere · Write access scoped to assigned   |
|  tier: LOW       | domains only (Mess and/or Maintenance)                   |
+------------------+----------------------------------------------------------+
```

- **Compact Registration Form:** Single-row layout — email, designation, tier selector, and Add button on one line. Permission options (Override toggle, 👑 Master Admin checkbox, scope toggles) appear as a slim inline strip below.
- **👑 Master Admin Toggle:** Visible on each High-Level admin card. One-click promote or revoke; cannot be applied to Low-Level admins (enforced server-side).
- **Tier Toggle:** Switch any admin between HIGH and LOW. Demoting to LOW automatically forces `isMaster: false`, `canOverride: false` and surfaces scope selectors.
- **Scope Toggles (Low-Level only):** `canManageMess` and `canManageMaintenance` restrict write access to assigned domains.
- **Optimistic UI:** All toggles (tier, override, master, scope, delete, designation save) update the UI **instantly** with automatic server-side rollback on failure — zero perceived latency.
- **Delete / Revoke:** Removes the admin from the roster and writes a `REVOKE_ADMIN` audit log entry. Delete button is always hidden from Low-Level admins.

---

### 6.9 Immutable Audit Ledger & Mutation Tracking

**Locations:** `src/lib/audit-logger.ts`, `src/app/api/admin/logs/route.ts`

The administrative suite incorporates an automated, tamper-evident audit ledger (`AdminAuditLog`):

- **Comprehensive Action Logging:** Automatically records entries for:
  - `REGISTER_ADMIN`, `REVOKE_ADMIN`, `UPDATE_ADMIN`
  - `RESOLVE_GRIEVANCE`, `PENDING_GRIEVANCE`, `OVERRIDE_GRIEVANCE`, `ESCALATE_GRIEVANCE`, `DELETE_GRIEVANCE`, `UPDATE_REMARK`
  - `APPROVE_GALLERY`, `REJECT_GALLERY`
  - `UPDATE_MENU`, `SEED_HUB`
- **Searchable Audit Explorer:** Integrated into the **Activity Audit Logs** tab of the admin console, enabling instant search by action name, administrator email/designation, or summary keywords.
- **Color-Coded Badges:** Visual differentiation for creations (Emerald), revocations/deletions (Red), overrides/updates (Yellow), and general actions (Blue).
- **Bounded Storage Management:** Automatically prunes the oldest records when the log exceeds ~2,000 entries, keeping database storage bounded.

---

### 6.10 Real-Time Operational Analytics & Performance Metrics

**Location:** `src/components/admin-stats-modal.tsx`

Accessible via the **Stats** button on any administrative dashboard:

```
+-----------------------------------------------------------------------------+
|                  GRIEVANCE ANALYTICS & RESOLUTION STATS                     |
+-----------------------------------------------------------------------------+
| OVERVIEW METRICS                                                            |
| • Total Grievances Filed: 142       • Resolution Rate: 96%                  |
| • Avg Resolution Turnaround: 14.2h  • Two-Way Verified: 112                |
| • Escalated Priority Items: 8       • Total Resolved: 136                   |
+-----------------------------------------------------------------------------+
| CATEGORY PERFORMANCE BREAKDOWN                                              |
| • Regular Mess: 52 Filed | 50 Resolved (96%) | Avg: 12.4h                   |
| • Washrooms: 45 Filed | 44 Resolved (98%) | Avg: 8.5h | Two-Way: 89%        |
| • Drinking Water: 18 Filed | 17 Resolved (94%) | Avg: 6.2h | Two-Way: 94%   |
| • Electrical: 14 Filed | 13 Resolved (93%) | Avg: 16.0h | Two-Way: 85%      |
| • Civil & Wood: 8 Filed | 7 Resolved (88%) | Avg: 24.5h | Two-Way: 75%      |
| • Cleaning: 3 Filed | 3 Resolved (100%) | Avg: 4.1h | Two-Way: 100%         |
| • Gym & Outdoors: 2 Filed | 2 Resolved (100%) | Avg: 11.0h | Two-Way: 100%  |
+-----------------------------------------------------------------------------+
```

---

## 7. Complete REST API Specification

---

### 7.1 Menu & Compliance API (`/api/menu`)

#### `GET /api/menu`
- **Description:** Fetches the current 7-day regular mess menu schedule and rule compliance validation metrics.
- **Access:** Public (Cached: `s-maxage=60, stale-while-revalidate=300`).
- **Response `200 OK`:**
  ```json
  {
    "menu": [
      {
        "dayOfWeek": "SUNDAY",
        "meals": [
          {
            "mealType": "BREAKFAST",
            "items": [
              { "name": "Tea + 01 pc Banana", "price": 6, "optionGroup": "Common", "isMandatory": true }
            ]
          }
        ]
      }
    ],
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [],
      "metrics": {
        "totalWeeklyCost": 815.5,
        "maxWeeklyCost": 835,
        "saladCount": 12,
        "minSaladRequired": 11,
        "mandatoryItemsValid": true
      }
    }
  }
  ```

#### `POST /api/menu`
- **Description:** Updates the weekly regular mess menu. Enforces cost and mandatory item rules before saving.
- **Access:** Protected (Requires Admin Token / Authorization Header).
- **Body:** `{ "weeklyMenu": [ ... ] }`
- **Response `200 OK`:** `{ "message": "Weekly menu successfully published!", "validation": { ... } }`
- **Error `400 Bad Request`:** Returned if rule validation fails.

---

### 7.2 Grievance Management API (`/api/feedback`)

#### `GET /api/feedback`
- **Description:** Retrieves grievances filtered by facility type, author email, or search query.
- **Query Parameters:**
  - `facility`: `REGULAR_MESS` | `NIGHT_CANTEEN` | `MAINTENANCE`
  - `search`: Ticket number, room number, or keyword.
  - `authorEmail`: Filters records for the specified student email.
- **Access:** Public (Filters records resolved $>30$ days ago for non-admin callers).
- **Response `200 OK`:** Array of `Feedback` records with formatted ticket numbers.

#### `POST /api/feedback`
- **Description:** Submits a new grievance. Generates a ticket number and attaches media.
- **Rate Limit:** 5 requests per 10 minutes per IP.
- **Access:** Student (Requires `.iitkgp.ac.in` email).
- **Body:**
  ```json
  {
    "studentName": "Souradeep",
    "roomNo": "D-515",
    "email": "souradeep@kgpian.iitkgp.ac.in",
    "facilityType": "MAINTENANCE_WASHROOM",
    "comment": "Geyser not working in 5th floor washroom.",
    "mediaUrl": "https://res.cloudinary.com/.../image.jpg",
    "capturedAt": "23/08/2026, 08:30:00 AM IST"
  }
  ```
- **Response `201 Created`:** Returns created `Feedback` object with generated `ticketNumber`.

#### `PATCH /api/feedback`
- **Description:** Updates grievance status, remarks, priority escalation, or resolution verification.
- **Access:** Admin (or Verified Student Author for self-resolution).
- **Body Options:**
  - *Student Self-Resolution:* `{ "id": "...", "isStudentAuthor": true, "authorEmail": "..." }`
  - *Admin Resolution:* `{ "id": "...", "status": "RESOLVED", "remark": "...", "resolvedBy": "...", "resolvedByRole": "..." }`
  - *Admin Escalation:* `{ "id": "...", "isEscalated": true, "escalatedRemark": "Urgent attention needed" }`
  - *Status Override:* `{ "id": "...", "overriddenBy": "...", "overriddenReason": "..." }`
- **Response `200 OK`:** `{ "message": "Feedback updated successfully!" }`

#### `DELETE /api/feedback?id=<id>`
- **Description:** Deletes a grievance record and purges attached media from Cloudinary.
- **Access:** Protected (Requires Admin Token / Authorization Header).
- **Response `200 OK`:** `{ "message": "Grievance removed successfully!", "cloudinaryNotice": null }`

---

### 7.3 Grievance Resolution Analytics (`/api/feedback/stats`)

#### `GET /api/feedback/stats`
- **Description:** Combines active database records and archived `GrievanceStatSummary` records to compute aggregate performance metrics.
- **Access:** Public / Admin Dashboard.
- **Response `200 OK`:**
  ```json
  {
    "overall": {
      "totalSubmitted": 142,
      "totalResolved": 136,
      "totalEscalated": 8,
      "totalTwoWayVerified": 112,
      "resolutionRatePercent": 96,
      "avgResolutionHours": "14.2"
    },
    "categoryStats": [
      {
        "category": "MAINTENANCE_WASHROOM",
        "totalSubmitted": 45,
        "totalResolved": 44,
        "totalTwoWayVerified": 39,
        "resolutionRatePercent": 98,
        "avgResolutionHours": "8.5"
      }
    ]
  }
  ```

---

### 7.4 Administrator Authentication & Governance APIs

#### `POST /api/admin/auth`
- **Description:** Authenticates administrator login. Accepts any registered email domain (no `.iitkgp.ac.in` restriction for admins). Dispatches OTP for registered admin emails or validates primary administrator credential.
- **Rate Limit:** 10 requests per minute per IP.
- **Body:** `{ "identifier": "admin.email@example.com" }`
- **Response `200 OK` (Primary Admin Credential):**
  ```json
  {
    "authenticated": true,
    "isMasterAdmin": true,
    "token": "<hmac_signed_token>",
    "adminEmail": "admin@kgp",
    "adminDesignation": "System Administrator"
  }
  ```
- **Response `200 OK` (Registered Admin Email):**
  ```json
  {
    "isRegisteredAdmin": true,
    "isMasterAdmin": false,
    "isMaster": false,
    "email": "mess.secy@iitkgp.ac.in",
    "designation": "Mess Secretary",
    "canOverride": false,
    "tier": "HIGH",
    "canManageMess": true,
    "canManageMaintenance": true,
    "token": "<hmac_signed_token>"
  }
  ```
- **Error `403 Forbidden`:** Returned if the email is not registered as an admin.

#### `GET /api/admin/users`
- **Description:** Lists all registered administrator accounts.
- **Access:** Any authenticated admin (`getAdminContext` verifies token).
- **Returns fields:** `id`, `email`, `designation`, `canOverride`, `tier`, `isMaster`, `canManageMess`, `canManageMaintenance`, `createdAt`, `updatedAt`.

#### `POST /api/admin/users`
- **Description:** Registers a new admin account with tier, scope, override, and master settings.
- **Access:** High-Level Admins only (`requireHighTierAdmin` guard).
- **Body:** `{ "email", "designation", "tier": "HIGH"|"LOW", "isMaster": bool, "canOverride": bool, "canManageMess": bool, "canManageMaintenance": bool }`
- **Guard:** `isMaster: true` is silently forced `false` if `tier === "LOW"`.

#### `PATCH /api/admin/users`
- **Description:** Updates designation, tier, override permissions, master status, or scope flags for an existing admin.
- **Access:** High-Level Admins only.
- **Body:** `{ "id": "...", "tier"?: "HIGH"|"LOW", "isMaster"?: bool, "canOverride"?: bool, "canManageMess"?: bool, "canManageMaintenance"?: bool, "designation"?: string }`
- **Guard:** Changing tier to `LOW` automatically forces `isMaster: false` and `canOverride: false` server-side.

#### `DELETE /api/admin/users?id=<id>`
- **Description:** Permanently revokes admin access for the specified record.
- **Access:** High-Level Admins only. Writes `REVOKE_ADMIN` audit log entry.

#### `GET /api/admin/logs?search=<query>`
- **Description:** Retrieves the audit trail from `AdminAuditLog` (sorted latest first, up to 150 entries).
- **Access:** Any authenticated admin.

---

### 7.5 Duty Gallery APIs (`/api/gallery` & `/api/gallery/approve`)

#### `GET /api/gallery?category=<category>`
- **Description:** Returns approved gallery items. Automatically triggers a 30-day purge of expired images.
- **Access:** Public.

#### `POST /api/gallery`
- **Description:** Direct upload submission for mess duty photos and videos (up to 20MB).
- **Access:** Student (Requires `.iitkgp.ac.in` email). Saves with status `PENDING`.

#### `GET /api/gallery/approve`
- **Description:** Retrieves pending gallery submissions for admin moderation.
- **Access:** Protected (Requires Admin Token / Authorization Header).

#### `PATCH /api/gallery/approve`
- **Description:** Approves or rejects a gallery submission. Rejection triggers signed Cloudinary deletion.
- **Access:** Protected (Requires Admin Token / Authorization Header).
- **Body:** `{ "id": "...", "status": "APPROVED" | "REJECTED" }`

---

### 7.6 Hall Hub API (`/api/hub`)

#### `GET /api/hub`
- **Description:** Returns all movie screenings, activities (within 14 days), achievements, emergency contacts, and suggestions.
- **Access:** Public (Cached: `s-maxage=30, stale-while-revalidate=120`).

#### `POST /api/hub`
- **Description:** Creates new hub entries.
- **Access:**
  - `type: "SUGGESTION"`: Public (Throttled to 1 suggestion per category per day per student email).
  - `type: "MOVIE" | "ACTIVITY" | "ACHIEVEMENT" | "EMERGENCY_CONTACT"`: Protected (Admin).

#### `PATCH /api/hub` & `DELETE /api/hub?id=<id>&type=<type>`
- **Description:** Updates or deletes hub content entries.
- **Access:** Protected (Admin).

---

### 7.7 Seasonal Poll API (`/api/poll` & `/api/poll/vote`)

#### `GET /api/poll?active=true`
- **Description:** Retrieves active monthly polls and current vote counts.
- **Access:** Public.

#### `POST /api/poll` & `PATCH /api/poll`
- **Description:** Creates new monthly poll options or activates/deactivates existing polls.
- **Access:** Protected (Admin).

#### `POST /api/poll/vote`
- **Description:** Casts a vote for a poll option.
- **Access:** Student (Requires verified `.iitkgp.ac.in` email). Enforces 1 vote per student roll number.

---

## 8. Security Architecture, Rate Limiting & Data Governance

```
+-----------------------------------------------------------------------------+
|                        MULTI-LAYERED SECURITY MODEL                         |
+-----------------------------------------------------------------------------+
| Layer 1: CSRF & Origin Verification (`verifyCsrfOrigin`)                    |
| - Validates request Origin and Referer headers against Host for mutations.  |
+-----------------------------------------------------------------------------+
| Layer 2: In-Memory Sliding Window Rate Limiting (`checkRateLimit`)          |
| - Authentication: 10 attempts / min per IP.                                 |
| - Grievance Submissions: 5 submissions / 10 min per IP.                     |
| - Gallery Uploads: 10 uploads / 10 min per IP.                              |
| - Suggestions: 1 suggestion / category / day per student email.             |
+-----------------------------------------------------------------------------+
| Layer 3: Timing-Safe Cryptographic Operations (`timingSafeCompare`)         |
| - Prevents side-channel timing attacks on secret verification.              |
+-----------------------------------------------------------------------------+
| Layer 4: HMAC-SHA256 Signed Admin Tokens (`createAdminToken`)              |
| - Stateless, cryptographically signed tokens containing email & expiration. |
+-----------------------------------------------------------------------------+
| Layer 5: Role-Based Access Control (RBAC)                                   |
| - Granular permissions: Standard Admin vs Status Override (`canOverride`). |
+-----------------------------------------------------------------------------+
| Layer 6: Physical File Auto-Purge (`deleteFromCloudinary`)                  |
| - SHA-1 signed REST requests destroy physical media assets upon deletion.   |
+-----------------------------------------------------------------------------+
```

---

## 9. Frontend Component Architecture

```
src/
├── app/
│   ├── admin/               # Mess Admin: Menu builder, Grievances, Polls
│   │   ├── gallery/         # Duty Gallery moderation queue
│   │   └── poll/            # Monthly Poll creator
│   ├── feedback/            # Mess Grievance filing & public feed
│   ├── gallery/             # Mess Duty transparent photo gallery
│   ├── hub/                 # Hall Info Hub: Movies, Activities, Awards, Contacts
│   │   └── admin/           # Hub Content Management Portal
│   ├── maintenance/         # Maintenance Portal: 7 Categories & Filing
│   │   └── admin/           # Maintenance Grievance Resolution & Overrides
│   ├── menu/                # Full 7-Day Weekly Menu Viewer
│   ├── night-canteen/       # Night Canteen menu & grievances
│   │   └── admin/           # Canteen Grievance Management
│   ├── poll/                # Monthly Seasonal Mess Poll
│   ├── layout.tsx           # Root layout: Plus Jakarta Sans, Theming, Nav
│   ├── page.tsx             # Student Dashboard: Menu, Serving Now, Tiles
│   └── globals.css          # Design system tokens, Glassmorphism, Keyframes
├── components/
│   ├── admin-auth-gate.tsx          # 30-min session gate, inactivity lock, OTP
│   ├── admin-stats-modal.tsx        # Grievance performance metrics modal
│   ├── admin-users-modal.tsx        # Admin roster management & audit log viewer
│   ├── back-button.tsx              # Adaptive navigation back button
│   ├── bottom-nav.tsx               # Fixed bottom navigation with jewel pills
│   ├── compact-grievance-card.tsx   # Accordion grievance card with media
│   ├── footer.tsx                   # System footnote & version identifier
│   ├── grievance-media-gallery.tsx  # Multi-media preview & +N thumbnail grid
│   ├── install-pwa-prompt.tsx       # PWA home screen installation banner
│   ├── my-grievances-view.tsx       # Universal student grievance dashboard
│   ├── otp-modal.tsx                # 6-digit PIN OTP verification modal
│   ├── public-dashboard-preview.tsx # Compact live status preview
│   ├── pwa-install-button.tsx       # Standalone PWA install button
│   ├── remark-history-modal.tsx     # Chronological remark timeline modal
│   ├── splash-screen.tsx            # First-load animated splash screen
│   ├── swipe-navigation-provider.tsx# Hardware-accelerated swipe transitions
│   ├── theme-provider.tsx           # next-themes context provider
│   ├── theme-toggle.tsx             # Dark / Light theme switch
│   └── ticket-badge.tsx             # Copyable monospace ticket badge
└── lib/
    ├── admin-auth.ts        # Server-side auth verification & HMAC tokens
    ├── admin-display.ts     # Designation & attribution formatters
    ├── audit-logger.ts      # Immutable administrative audit logger
    ├── cloudinary-delete.ts # Signed Cloudinary physical asset destroy
    ├── cloudinary-upload.ts # Client-side 20MB progress upload utility
    ├── mess-rules.ts        # Contract cost, salad, & mandatory checks
    ├── prisma.ts            # Global Prisma Client singleton
    ├── rate-limiter.ts      # In-memory sliding window rate limiter
    └── ticket.ts            # Deterministic ticket generation & formatting
```

---

## 10. Environment Configuration & Deployment Guide

### 10.1 Environment Variables Reference

Configure the following variables in `.env.local` (or production environment settings):

```env
# Database Connections (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase Authentication & Client SDK
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Cloudinary Media Storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="[cloud_name]"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="BRH_uploads"
CLOUDINARY_API_KEY="[api_key]"
CLOUDINARY_API_SECRET="[api_secret]"

# Administrative Access & Security
ADMIN_PASSWORD="[primary_admin_secure_salt_or_secret]"
SUPER_ADMIN_EMAILS="warden.brh@iitkgp.ac.in,hall.president@iitkgp.ac.in"
```

### 10.2 Build & Execution Commands

```bash
# 1. Install project dependencies
npm install

# 2. Synchronize database schema with Prisma
npm run prisma:push

# 3. Generate Prisma Client
npm run prisma:generate

# 4. Start local development server
npm run dev

# 5. Build production bundle (generates optimized static & SSR routes)
npm run build

# 6. Start production server
npm run start
```

---

## 11. Summary & System Health Verification

- **Package Version:** `1.0.0`
- **Route Compilation:** 30/30 Next.js routes compile cleanly.
- **Code Standards:** 100% TypeScript coverage with zero client credential exposure.
- **Admin Authority Model:** Three-tier (Master / High-Level / Low-Level) enforced end-to-end from DB schema to JWT token to API guards.
- **Maintainer:** Souradeep Satpathy (B.R. Ambedkar Hall, IIT Kharagpur).
