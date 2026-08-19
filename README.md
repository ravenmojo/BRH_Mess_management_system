# BROS – BR Ambedkar Hall Operations & Services

[![Version](https://img.shields.io/badge/version-v0.9.5-blue.svg)](https://github.com/ravenmojo/BRH_Mess_management_system)

A comprehensive, mobile-first Next.js web application built as a centralized digital platform for the students of **B.R. Ambedkar Hall (BRH) at IIT Kharagpur**. BROS covers mess management, maintenance grievances, night canteen, student polls, a media gallery, and a community information hub — all protected by inline OTP verification, server-side rate limits, and multi-tier stakeholder access controls.

> **"For the Bros, By the Bros"** — Responsibility, Accountability, Transparency.

---

## 🚀 Release Notes — Version 0.9.5

### 📌 What's New in v0.9.5

- **🎫 Automated Grievance Ticket Number System:** Every grievance across Mess, Maintenance, and Night Canteen is automatically assigned a structured, unique ticket identifier in the format: **`<room no><two letter category code><date><count>`** (e.g. `D-515MS1908261`, `D-515DW1908261`).
  - Standardized 2-letter subcategory codes: **`MS`** (Mess), **`NC`** (Night Canteen), **`WR`** (Washrooms), **`DW`** (Drinking Water), **`EL`** (Electrical), **`CV`** (Civil), **`CL`** (Cleaning), and **`OD`** (Outdoors).
  - Built an interactive monospace `TicketBadge` component with 1-click clipboard copy and animated confirmation.
- **🔍 Universal Real-Time Grievance Search:** Search bars across Mess Admin (`/admin`), Maintenance Admin (`/maintenance/admin`), and Night Canteen Admin (`/night-canteen/admin`) allow instant filtering by Ticket ID, Room Number, student name, or complaint keyword.
- **🏆 Hall Info Hub Reordering & Full Admin Management:**
  - Reordered tabs: **Movies** ➔ **Activities** ➔ 🏆 **Awards** ➔ 💡 **Ideas** ➔ 📞 **Contacts**.
  - Added dedicated CRUD admin panels in `/hub/admin` for movie screenings, hall achievements, student activities, ideas, and emergency contacts.
  - Movie screening admin portal supports poster file uploads and direct clipboard image pasting with live progress indicators.
- **👥 Multilevel Stakeholder Resolution Attribution:**
  - Resolving a grievance records the administrator's email, designation, and timestamp.
  - Student and admin cards render a verification stamp: `✓ Resolved by: <Email / Designation> • <Date & Time in IST>`.
- **🔒 Stealth Master Password & OTP-Based Admin Access Control:**
  - Single, clean gateway prompt: *"Enter Admin Email"*.
  - Typing the server-configured Master Password unlocks full **Master Admin** access with zero UI hints.
  - Entering a registered admin email dispatches a 6-digit OTP via Supabase Auth. Unauthorized emails are rejected server-side without leaking the list of active admins.
  - Master Admins can open the **"Manage Admins"** panel to dynamically register admin accounts, update designations, or revoke access.
- **🖼️ Media Gallery Resilience & Layout Enhancements:**
  - Robust multi-format media parser ensuring image/video thumbnails render cleanly across all device widths.
  - Standardized hero banner heights with catchy hall taglines across Homepage, Maintenance, and Hub pages.
  - Restored high-contrast 3-column subcategory grid on the student Maintenance portal.

---

## ✨ Core Features

### 🍽️ Mess Management & Grievances
- **Live Weekly Menu Viewer:** Browse the 7-day schedule starting from Sunday, with dietary filters (Common, Veg, Non-Veg, Special Options).
- **Automated Ticketing & History:** Instant ticket generation upon submission (`<Room>MS<Date><Count>`) with interactive copyable badges.
- **Live Compliance & Menu Builder:** Integrated cost tracking, salad requirements, and mandatory meal checks directly inside the Mess Admin dashboard.

### 🔧 Maintenance Portal
- **Category-Based Grievances:** Seven subcategories — Washrooms (`WR`), Drinking Water (`DW`), Electrical (`EL`), Civil (`CV`), Cleaning (`CL`), Outdoors (`OD`), and Other.
- **Interactive 3-Column Grid:** Touch-friendly category selector with intuitive location placeholders.
- **Resolution Tracking:** View resolver credentials and official remarks timestamped in Indian Standard Time (IST).

### 🌙 Night Canteen
- **Live Menu & Pricing:** Browse canteen items (open 9:30 PM – 2:00 AM) with prices and categories.
- **Canteen Grievances:** Submit and track night canteen issues with automated ticketing (`<Room>NC<Date><Count>`).

### 📊 Mess Poll
- **Monthly Seasonal Poll:** Boarders vote on upcoming menu additions and seasonal items.
- **Auto-Locking & Live Analytics:** Voting locks automatically after the 15th of each month with real-time percentages.

### 📸 Transparent Duty Gallery
- **Duty Verification:** Transparent photographic logs of raw material inspection, cleaning, weight verification, and meal preparation.
- **30-Day Auto-Purge:** Automatic 30-day retention policy for visual transparency records.
- **Admin Moderation:** Student uploads require admin approval before appearing publicly; admins can batch-download media assets.

### 🏛️ Hall Info Hub
- **Weekend Movie Screenings:** Announcements with direct file/clipboard poster uploads, venue details, and uncropped aspect-ratio frames.
- **Hall Achievements & Activities:** Showcase intra-hall victories, Open-IIT awards, and upcoming workshops.
- **Emergency Directory:** Essential contacts for wardens, hall managers, security, mess contractors, and healthcare.
- **Boarder Suggestions:** Submit ideas across categories with daily rate limits.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Typography | `Plus_Jakarta_Sans` (Google Fonts) |
| Icons | [Lucide React](https://lucide.dev/) |
| Database | PostgreSQL (via [Supabase](https://supabase.com/)) |
| ORM | [Prisma](https://www.prisma.io/) |
| Auth & Verification | [Supabase Auth](https://supabase.com/auth) (OTP Verification) |
| Media Storage | [Cloudinary](https://cloudinary.com/) |
| Theming | `next-themes` (Dark / Light mode) |

---

## 🔐 Security & Access Architecture

- **Zero Client-Side Passwords / Lists:** Secrets and administrator rosters are verified strictly server-side and never exposed in client bundles or public git files.
- **Server-Protected API Endpoints:** All administrative mutations (`/api/admin/users`, `PATCH /api/feedback`, `/api/menu`, `/api/hub`, `/api/gallery/approve`) enforce server-side authentication headers.
- **Admin Portals:**
  - `/admin` — Mess Menu Builder, Compliance Widgets, Grievance Moderation, Gallery Approvals, Poll Manager
  - `/maintenance/admin` — Maintenance Grievance Resolution & Remark Management
  - `/night-canteen/admin` — Canteen Grievance Management
  - `/hub/admin` — Hall Info Content Management, Movie Poster Uploads & Emergency Contacts
- **Stealth Access & Dynamic Admin Management:** Master Admin password bypasses UI cues, granting full administrative privileges and access to the dynamic **Manage Admins** modal.

---

## 📄 License & Footnote
- **Version:** `BROS v0.9.5`
- **Developed by:** Souradeep Satpathy (TeNSoRE Lab, IIT Kharagpur)
- Open Source — Give credits to this repository for usage or forks.
