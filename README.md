# BROS – BR Ambedkar Hall Operations & Services

A comprehensive, mobile-first Next.js web application built as a centralized digital platform for the students of **B.R. Ambedkar Hall (BRH) at IIT Kharagpur**. BROS covers mess management, maintenance complaints, night canteen, student polls, a media gallery, and a community information hub — all behind a seamless OTP-based verification system.

> **"For the Bros, By the Bros"** — Responsibility, Accountability, Transparency.

---

## ✨ Features

### 🍽️ Mess Management
- **Live Weekly Menu Viewer:** Browse the full 7-day mess schedule by day and meal (Breakfast, Lunch, Dinner), with grouped item options (Common, Veg, Non-Veg, Option 1/2).
- **Mess Feedback & Complaints:** Submit structured complaints and feedback for the regular mess with media attachments (photo/video via Cloudinary).
- **OTP-Verified Submissions:** All complaint/feedback submissions require email OTP verification inline — no prior login needed to browse the app.

### 🔧 Maintenance Portal
- **Category-Based Complaints:** Log issues across six categories — Washroom, Water Supply, Electrical, Civil (Plumbing & Carpentry), and Cleaning.
- **Media Attachments:** Attach photos or videos (up to 20MB) to complaints, automatically uploaded to Cloudinary.
- **Admin Resolution Timeline:** Track submitted complaints and view admin remarks and resolution status live.
- **Maintenance Admin Panel:** A dedicated dashboard for the maintenance secretary, protected by the Admin Auth Gate.

### 🌙 Night Canteen
- **Live Canteen Menu:** Browse the independent night canteen menu (open 9:30 PM – 2:00 AM) with item names, categories, and prices.
- **Canteen Feedback:** Submit complaints or suggestions specific to the night canteen, also OTP-verified.

### 📊 Mess Poll
- **Monthly Seasonal Poll:** Boarders vote on which seasonal vegetable curry they want included in the upcoming month's menu.
- **Auto-Locking:** Voting automatically locks after the 15th of each month (configurable by admin override).
- **Live Results:** Real-time vote count and percentage breakdown visible to all users.
- **Poll Admin Panel:** Create, manage, lock/unlock, and delete polls with a dedicated admin interface.

### 📸 Gallery
- **Mess Duty Gallery:** Transparent visual records of mess operations — raw materials, cleaning, weight checking, and duty execution.
- **Media Upload with Approval Flow:** Students can submit photos/videos (up to 5MB) via an upload modal. All submissions are held for admin approval before appearing in the gallery.
- **Admin Moderation:** Pending uploads appear in the Mess Admin panel for quick Approve/Reject decisions.
- **Category Filtering:** Browse gallery media by category (Operations, Cleaning, Ingredients, etc.).

### 🏛️ Hall Info Hub
- **Weekend Movies:** Upcoming movie screening announcements with title, venue, and showtime.
- **Hall Activities:** A log of students participating in inter-hall and intra-hall events.
- **Hall Achievements:** Showcase of hall-level wins, awards, and accolades.
- **Emergency Contacts:** Direct-call links to key hall contacts (President, Secretaries, Warden, Hospital, Security) — dynamically populated from the database or falls back to defaults.
- **Boarder Suggestion Portal:** Submit improvement ideas (Mess, Events, Sports, etc.) directly to the hall council with OTP verification.
- **Hall Info Admin Panel:** A dedicated panel to manage movies, activities, achievements, emergency contacts, and seed all hub data.

### 🛡️ Admin Portals
- **Mess Admin Panel:** Full weekly menu builder with live compliance validation widgets, feedback moderation, and gallery upload approval.
  - **Budget Enforcement:** Real-time check against the ₹826/week hard cap (with a ₹850 service provider buffer).
  - **Mandatory Item Check:** Flags missing staples (Rice, Roti, Dal) in any major meal.
  - **Salad Count:** Enforces a minimum of 11 salad servings per week.
- **Night Canteen Admin Panel:** View and manage canteen-specific feedback submissions.
- **Maintenance Admin Panel:** Track and resolve all maintenance complaints by category, with remark support.
- **Hall Info Admin Panel:** Manage all Hub sub-sections from a single interface.
- **All Admin Panels** are protected by the `AdminAuthGate` component requiring a secure passkey.

### 🔐 Authentication & Verification
- **Sessionless OTP Verification:** No persistent login required. Email OTP verification is triggered inline when a user submits any complaint, suggestion, or vote.
- **Allowed Emails:** Only `iitkgp.ac.in` email addresses are permitted, with whitelisted admin emails.
- **Persistent Email Autofill:** The last verified email is stored in `localStorage` and auto-filled in all forms for convenience.


### 📱 PWA Support
- **Installable:** A `manifest.json` and PWA meta tags allow users to install BROS as a home screen app on mobile devices.

### 🌓 UI/UX
- **Splash Screen:** Animated BROS intro screen shown once per session.
- **Dark Mode:** Full light/dark mode with glassmorphism styling and smooth transitions.
- **Glassmorphism Design:** Cards and navigation use `backdrop-blur` glass effects throughout.
- **Mobile-First:** Fully responsive, bottom-navigation-driven layout optimized for mobile browsers.
- **Micro-Animations:** Hover effects, scale transitions, and animated indicators enhance interactivity.

---


## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Database | PostgreSQL (via [Supabase](https://supabase.com/)) |
| ORM | [Prisma](https://www.prisma.io/) |
| Auth | [Supabase Auth](https://supabase.com/auth) (OTP Magic Link) |
| Media Storage | [Cloudinary](https://cloudinary.com/) |
| Theming | `next-themes` |

---

## Prerequisites
- Node.js (v18+) and npm
- A [Supabase](https://supabase.com/) project (for PostgreSQL database and OTP Auth)
- A [Cloudinary](https://cloudinary.com/) account (for media uploads)

---

## 📋 Admin Usage Guide

### Menu Compliance Widgets
When publishing a menu as a Mess Admin, the **Live Compliance Widgets** run in real time:
- 🟡 **Yellow Warning** — Minor deviation (e.g., missing Roti on a day, relying on service buffer). Publication is **allowed**.
- 🔴 **Flashing Red Error** — Critical budget or structural violation. Publication is **blocked** until resolved.

### Admin Access
All admin panels are protected by the `AdminAuthGate` component. The admin passkey is configured separately from the Supabase Auth system. Admins visit:
- `/admin` — Mess Menu, Gallery Approvals, Poll Manager
- `/maintenance/admin` — Maintenance Complaint Resolution
- `/night-canteen/admin` — Canteen Feedback Management
- `/hub/admin` — Hall Info Hub Content Management

---

## ⚠️ Responsible Use

Please submit complaints that are **rational, constructive, and factual**. Frivolous or abusive feedback delays resolution for genuine issues.

---

## 📄 License
Open Source — Give credits to this repository for usage or forks.
