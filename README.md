# BROS – BR Ambedkar hall Operations & Services

[![Version](https://img.shields.io/badge/version-v1.0.0-blue.svg)](https://github.com/ravenmojo/BRH_Mess_management_system)

A comprehensive, mobile-first Next.js web application built as a centralized digital platform for the students of **B.R. Ambedkar Hall (BRH) at IIT Kharagpur**. BROS covers mess management, maintenance grievances, night canteen, student polls, a media gallery, and a community information hub — all protected by inline OTP verification, server-side rate limits, and a multi-tier admin authority system.

> **"For the Bros, By the Bros"** — Responsibility, Accountability, Transparency.

---

## 🚀 Release Notes — Version 1.0.0

### 📌 What's New in v1.0.0

- **🏛️ Three-Tier Admin Authority System:**
  - Introduced **Master Admin**, **High-Level Admin**, and **Low-Level Admin** tiers with distinct capabilities.
  - Master Admins have full system control including the ability to promote/demote other admins from the Manage Admins panel — no `.env` changes required.
  - High-Level Admins retain full grievance, menu, poll, gallery, and canteen access (with optional override rights).
  - Low-Level Admins get read-only access across all sections; write access is scoped only to their assigned domains (Mess / Maintenance).
- **👑 In-App Master Admin Assignment:**
  - Master Admins can promote any High-Level admin to Master status (or revoke it) via a one-click **👑 Master Admin** toggle badge on each High-Level admin card — no code or config edits needed.
  - New admin registration form includes a **"Grant Master Admin Authority"** checkbox (amber, 👑 icon) visible only when adding a High-Level admin.
- **🛡️ Role-Based Read/Write Enforcement:**
  - Mess, Maintenance, and Night Canteen admin dashboards wrap all action buttons (Resolve, Remark, Escalate, Weekly Menu editor) in a `hasActionAccess` guard.
  - The Delete button is permanently hidden from all Low-Level admins regardless of scope.
- **⚡ Optimistic UI — Zero-Lag Admin Toggles:**
  - All toggle actions in the Manage Admins dialog (tier, override, scope, master, delete, designation) update the UI **instantly** with automatic server-side revert on failure.
- **📐 Compact Manage Admins Form:**
  - Registration form collapsed to a single horizontal row (email + designation + tier + Add button).
  - Permission options appear as a slim inline strip below, freeing significant vertical space for the admin list.
- **🔑 No Domain Restrictions for Admin Login:**
  - Admin login now accepts any registered email domain (not restricted to `.kgpian.iitkgp.ac.in`).

---

### 📌 What Was New in v0.9.9

- **📲 Seamless Homepage Swipe Navigation:**
  - Hardware-accelerated horizontal swipe gestures between: **`/` (Mess)** ⇄ **`/maintenance` (Maintenance)** ⇄ **`/hub` (Hall Info Hub)**.
  - Smooth directional slide animations with intelligent touch filtering (ignoring inputs, textareas, sliders, and open dialogs).
- **💎 Executive Glassmorphism & Jewel-Tone Color System:**
  - Refined Bottom Navigation Bar with dedicated jewel-tone active pills: **Royal Blue** (Mess), **Sky Blue** (Maintenance), and **Slate Indigo** (Info Hub).
  - Replaced loud neon fills with elegant, frosted glass cards, subtle luminous borders, and tailored hover states across all pages.
- **🍲 Professional Meal Badges & Harmonized Quick Access:**
  - Frosted glass icon badges for Breakfast (☕ Amber), Lunch (☀️ Orange), Dinner (🌙 Indigo), and Serving Now (🟢 Emerald).
  - Differentiated quick access tiles on Homepage: Full Menu (Blue), Canteen (Purple/Charcoal), Grievances (Rose), Mess Poll (Amber/Gold), and Duty Gallery (Green).
- **🛠️ Maintenance Subcategories & Common Area Cleaning Governance:**
  - Unique glassy color themes for all 6 maintenance categories.
  - Dynamic **"Common Areas Only"** policy notification when selecting the Cleaning category.
- **👥 Two-Way Verifiable Resolution & Administrative Override:**
  - Differentiates between admin-only resolved vs two-way verified (admin + student) grievances.
  - Configurable resolution override permissions with internal audit trails.
- **📊 45-Day Archive & Permanent Statistical Aggregates:**
  - Resolved grievances archived after 45 days; statistical metrics permanently retained for analytics.
- **⏱️ Inactivity Detection & 60s Auto-Lock Prompt:**
  - Automatically triggers a countdown prompt if no admin interaction is detected for 10 minutes.

---

## ✨ Core Features

### 🍽️ Mess Management & Grievances
- **Live Weekly Menu Viewer:** Browse the 7-day schedule starting from Sunday, with dietary filters (Common, Veg, Non-Veg, Special Options).
- **Automated Ticketing & History:** Instant ticket generation upon submission (`<Room>MS<Date><Count>`) with interactive copyable badges.
- **Live Compliance & Menu Builder:** Integrated cost tracking, salad requirements, and mandatory meal checks directly inside the Mess Admin dashboard.

### 🔧 Maintenance Portal
- **Category-Based Grievances:** Seven subcategories — Washrooms (`WR`), Drinking Water (`DW`), Electrical (`EL`), Civil (`CV`), Cleaning (`CL`), Gym & Outdoors (`GO`), and Other.
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

## 🔐 Admin Authority Architecture

BROS uses a **three-tier admin model** enforced end-to-end — from the database to the JWT token to the session context:

| Tier | How to Identify | Capabilities |
|---|---|---|
| 👑 **Master Admin** | `isMaster: true` in DB + token | Manage all admins, assign/revoke master status, full system access |
| 🛡️ **High-Level Admin** | `tier: 'HIGH'` | Full grievance, menu, poll, gallery, canteen access; optional override right |
| 👤 **Low-Level Admin** | `tier: 'LOW'` | Read-only everywhere; write access only in assigned scope (Mess / Maintenance) |

### Admin Login
- Admin login accepts **any registered email domain** (no `.kgpian.iitkgp.ac.in` restriction).
- After entering a registered email → OTP is dispatched via Supabase Auth → OTP verified → session created with the correct tier + permissions baked in.
- Master Admins receive a session with `isMasterAdmin: true`, `canOverride: true`, `canManageMess: true`, `canManageMaintenance: true` automatically.

### Manage Admins Panel
- Accessible only to **Master Admins** via the "Manage Admins" button in the admin header.
- **High-Level tab:** Tier toggle · Override toggle · 👑 Master Admin toggle (one-click promote/revoke)
- **Low-Level tab:** Tier toggle · Scope toggles (Mess / Maintenance)
- All toggles use **optimistic UI** — instant visual feedback with automatic rollback on server error.

### Protected Admin Routes
- `/admin` — Mess Menu Builder, Compliance Widgets, Grievance Moderation, Gallery Approvals, Poll Manager
- `/maintenance/admin` — Maintenance Grievance Resolution & Remark Management
- `/night-canteen/admin` — Canteen Grievance Management
- `/hub/admin` — Hall Info Content Management, Movie Poster Uploads & Emergency Contacts

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

## 📄 License & Footnote
- **Version:** `BROS v1.0.0`
- **Developed by:** Souradeep Satpathy (TeNSoRE Lab, IIT Kharagpur)
- Open Source — Give credits to this repository for usage or forks.
