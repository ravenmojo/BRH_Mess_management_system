# BROS – BR Ambedkar Hall Operations & Services

[![Version](https://img.shields.io/badge/version-v0.9.9-blue.svg)](https://github.com/ravenmojo/BRH_Mess_management_system)

A comprehensive, mobile-first Next.js web application built as a centralized digital platform for the students of **B.R. Ambedkar Hall (BRH) at IIT Kharagpur**. BROS covers mess management, maintenance grievances, night canteen, student polls, a media gallery, and a community information hub — all protected by inline OTP verification, server-side rate limits, and multi-tier stakeholder access controls.

> **"For the Bros, By the Bros"** — Responsibility, Accountability, Transparency.

---

## 🚀 Release Notes — Version 0.9.9

### 📌 What's New in v0.9.9

- **📲 Seamless Homepage Swipe Navigation:**
  - Hardware-accelerated horizontal swipe gestures between the 3 core homepages: **`/` (Mess)** ⇄ **`/maintenance` (Maintenance)** ⇄ **`/hub` (Hall Info Hub)**.
  - Smooth directional slide animations with intelligent touch filtering (ignoring inputs, textareas, sliders, and open dialogs).
- **💎 Executive Glassmorphism & Jewel-Tone Color System:**
  - Refined Bottom Navigation Bar with dedicated jewel-tone active pills: **Royal Blue** (Mess), **Sky Blue** (Maintenance), and **Slate Indigo** (Info Hub).
  - Replaced loud neon fills with elegant, frosted glass cards, subtle luminous borders, and tailored hover states across all pages.
- **🍲 Professional Meal Badges & Harmonized Quick Access:**
  - Frosted glass icon badges for Breakfast (☕ Amber), Lunch (☀️ Orange), Dinner (🌙 Indigo), and Serving Now (🟢 Emerald).
  - Differentiated quick access tiles on Homepage: Full Menu (Blue), Canteen (Purple/Charcoal), Grievances (Rose), Mess Poll (Amber/Gold), and Duty Gallery (Green).
- **🛠️ Maintenance Subcategories & Common Area Cleaning Governance:**
  - Unique glassy color themes for all 6 maintenance categories (Washroom, Drinking Water, Electrical, Civil [Warm Ochre], Cleaning [Purple], Gym & Outdoors [Emerald Green]).
  - Dynamic **"Common Areas Only"** policy notification when selecting the Cleaning category.
- **🗳️ Unified Mess Poll Experience:**
  - Dedicated warm amber/sunburst styling throughout `/poll` with real-time percentage indicators and vote action buttons.
- **🏛️ Hall Info Hub Redesign & Colorful Contacts Directory:**
  - Unified all movie screenings, student activities, idea submissions, and hall achievements into the core glassmorphism design language.
  - Vibrantly colored contact initial badges with standardized quick-dial call buttons.
- **👥 Two-Way Verifiable Resolution & Administrative Override:**
  - Differentiates between admin-only resolved vs two-way verified (admin + student) grievances.
  - Configurable resolution override permissions with internal audit trails.
- **📊 45-Day Archive & Permanent Statistical Aggregates:**
  - Resolved maintenance grievances are archived after 45 days while statistical metrics (turnaround times, category frequencies, resolution rates) are permanently retained for administrative analytics.

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
- **Secure Dynamic Admin Management:** Direct authentication grants administrative management capabilities and access to the dynamic **Manage Admins** console.

---

## 📄 License & Footnote
- **Version:** `BROS v0.9.9`
- **Developed by:** Souradeep Satpathy (TeNSoRE Lab, IIT Kharagpur)
- Open Source — Give credits to this repository for usage or forks.
