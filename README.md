# BROS – BR Ambedkar Hall Operations & Services

[![Version](https://img.shields.io/badge/version-v0.9.0-blue.svg)](https://github.com/ravenmojo/BRH_Mess_management_system)

A comprehensive, mobile-first Next.js web application built as a centralized digital platform for the students of **B.R. Ambedkar Hall (BRH) at IIT Kharagpur**. BROS covers mess management, maintenance grievances, night canteen, student polls, a media gallery, and a community information hub — all protected by inline OTP verification and server-side rate limits.

> **"For the Bros, By the Bros"** — Responsibility, Accountability, Transparency.

---

## 🚀 Release Notes — Version 0.9.0

### 📌 What's New in v0.9.0

- **🛡️ Grievances System & Terminology:** Standardized terminology to **"Grievances"** across student and admin portals (Mess, Maintenance, Night Canteen), reserving "Suggestions" exclusively for the Hall Info Hub.
- **⚡ 24-Hour OTP Verification Cache:** Verified institute emails are cached in `localStorage` for 24 hours. Boarders submitting subsequent grievances within 24 hours bypass the OTP modal instantly.
- **⏱️ Server-Side Rate Limiting Engine:**
  - **Grievances:** 1 complaint per hour per section (Mess, Maintenance, Canteen) and capped at **3 total complaints per day** combined across all sections.
  - **Hall Info Hub:** 1 suggestion per category per day.
- **📝 Form Simplification & Smart Room No Format:**
  - **Removed Roll Number field** completely.
  - Made **Student Name optional** (defaults to *"Anonymous"*).
  - Made **Room No mandatory** with smart auto-formatting (typing `a515` formats to `A-515`, restricting wing to `A-D` and room to 3 digits) with server-side regex validation (`/^[A-D]-\d{3}$/`).
- **🌳 Outdoor Maintenance Category:** Added `MAINTENANCE_OUTDOOR` to maintenance categories.
- **🔒 30-Minute State-Preserving Admin Session:** `AdminAuthGate` enforces a 30-minute session duration with a live countdown badge (`e.g. 29m 45s`). The admin page state remains mounted underneath a blurred modal backdrop so typed remarks or draft changes are **100% preserved upon re-authentication**.
- **🎨 Plus Jakarta Sans Typography:** Upgraded typography across the entire platform to `Plus_Jakarta_Sans` for an ultra-crisp modern dashboard aesthetic.
- **📅 Today's Menu Day Selector:** Fixed non-scrolling 7-column layout starting from **SUNDAY** (`SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`).

---

## ✨ Core Features

### 🍽️ Mess Management & Grievances
- **Live Weekly Menu Viewer:** Browse the full 7-day mess schedule starting from Sunday, with item options (Common, Veg, Non-Veg, Option 1/2).
- **Mess Grievance Center:** Submit grievances for regular mess food quality/hygiene with media attachments (photos/videos via Cloudinary).
- **OTP & Cache Verified:** Inline OTP verification with 24-hour verification cache.

### 🔧 Maintenance Portal
- **Category-Based Grievances:** Log issues across six categories — Washroom, Water Supply, Electrical, Civil, Cleaning, and Outdoor.
- **Media Attachments:** Attach photos or videos (up to 20MB) uploaded directly to Cloudinary.
- **Resolution Timeline:** Track grievances live with official admin remarks and status badges.
- **Maintenance Admin Panel:** Protected by `AdminAuthGate` with 30-minute session limits.

### 🌙 Night Canteen
- **Live Menu:** Browse independent canteen menu items (open 9:30 PM – 2:00 AM) with prices and categories.
- **Canteen Grievances:** Submit canteen-specific grievances with rate limits and room number validation.

### 📊 Mess Poll
- **Monthly Seasonal Poll:** Boarders vote on monthly menu additions (e.g. seasonal vegetable curries).
- **Auto-Locking & Live Results:** Voting locks automatically after the 15th of each month; real-time breakdown visible to all.

### 📸 Transparent Duty Gallery
- **Duty Verification:** Transparent visual records of raw materials, cleaning, weight checking, and duty execution.
- **Moderation Flow:** Student uploads (up to 5MB) require admin approval before appearing publicly.

### 🏛️ Hall Info Hub
- **Community Portal:** Weekend movie announcements, student activity logs, hall achievements, and emergency contact direct-dial directory.
- **Boarder Suggestion Portal:** Submit ideas (Mess, Events, Sports, etc.) capped at 1 suggestion/category/day.

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
| Auth & Verification | [Supabase Auth](https://supabase.com/auth) (OTP Magic Link) |
| Media Storage | [Cloudinary](https://cloudinary.com/) |
| Theming | `next-themes` |

---

## 🔐 Admin Access & Security
- Passkey protected via `AdminAuthGate` component with 30-minute session expiration & live countdown timer.
- Passkey: Configured in `admin-auth-gate.tsx` (`adminBRH`).
- Admin Portals:
  - `/admin` — Mess Menu Builder, Compliance Widgets, Grievance Moderation, Gallery Approvals, Poll Manager
  - `/maintenance/admin` — Infrastructure Grievance Resolution
  - `/night-canteen/admin` — Canteen Grievances Management
  - `/hub/admin` — Hall Info Content Management & Data Seeding

---

## 📄 License & Footnote
- **Version:** `BROS v0.9.0`
- **Developed by:** Souradeep Satpathy (TeNSoRE Lab, IIT Kharagpur)
- Open Source — Give credits to this repository for usage or forks.
