# BROS — Application Changelog & Version Updates

This document tracks all feature implementations, bug fixes, UI/UX enhancements, and database schema updates made prior to releasing a new version upgrade. Content from this changelog is used to synchronize the main [README.md](README.md) before publishing or pushing commits to production.

---

## 📌 Version 0.9.9 (v0.9.9) — Swipe Gestures, Design System Polish & Advanced Maintenance Governance

**Release Date:** August 23, 2026  
**Package Version:** `0.9.9`  
**Status:** Tested & Verified (`npm run build` — 28/28 routes compiled cleanly)

### 1. 📲 Seamless Homepage Swipe Navigation System
- **Hardware-Accelerated Touch Navigation:** Implemented [src/components/swipe-navigation-provider.tsx](src/components/swipe-navigation-provider.tsx) providing seamless left/right horizontal swipe transitions between the 3 core homepages:
  > **`/` (Mess)** ⇄ **`/maintenance` (Maintenance)** ⇄ **`/hub` (Hall Info Hub)**
- **Directional Slide Animations:** Smooth GPU-accelerated CSS keyframe animations (`.slide-in-right` and `.slide-in-left`) in [src/app/globals.css](src/app/globals.css).
- **Touch Gesture Filtering:** Intelligently ignores swipes starting inside textareas, input fields, sliders, horizontal card carousels, or open modal dialogs.
- **Instant Route Prefetching:** Automatic prefetching of adjacent routes for 0ms transition latency.

### 2. 💎 Executive Glassmorphism & Jewel-Tone Palette Refinement
- **Classy Active Nav Pills:** Bottom navigation bar active indicators updated to sophisticated, executive jewel tones:
  - Mess: **Royal Blue** (`bg-blue-600 shadow-blue-600/25`)
  - Maintenance: **Steel Sky Blue** (`bg-sky-600 shadow-sky-600/25`)
  - Info Hub: **Slate Indigo** (`bg-indigo-600 shadow-indigo-600/25`)
- **De-Blinged, High-Legibility Visual Identity:** Replaced overly poppy neon gradients across the entire app with frosted glass cards, subtle luminous borders, and tailored hover states (`hover:border-{color}-400/60 hover:bg-{color}-50/30`).

### 3. 🍲 Professional Glassy Icon Badges & Meal Schedule Polish
- **Meal Schedule Icons:** Subtly tinted frosted glass badges for Breakfast (Amber Coffee ☕), Lunch (Orange Sun ☀️), Dinner (Indigo Moon 🌙), and Serving Now (Emerald 🟢).
- **Decluttered Day Selector Header:** Removed duplicate "Full Week" header link above Today's Menu chips in favor of the prominent Full Menu tile.

### 4. 🛠️ Maintenance Categories & Common Areas Governance
- **Tailored Category Color Coding:**
  - **Washroom 🚿:** Cyan Glass (`border-cyan-500/30 text-cyan-600`)
  - **Drinking Water 💧:** Blue Glass (`border-blue-500/30 text-blue-600`)
  - **Electrical ⚡:** Amber Glass (`border-amber-500/30 text-amber-600`)
  - **Civil & Furniture 🔨:** Warm Wood / Ochre Orange (`border-orange-500/30 text-orange-600` — strictly non-red)
  - **Cleaning & Sanitation ✨:** Royal Purple Glass (`border-purple-500/30 text-purple-600`)
  - **Gym & Outdoors 🏋️:** Emerald Green Glass (`border-emerald-500/30 text-emerald-600`)
- **Common Area Cleaning Notice:** Selecting the Cleaning category dynamically presents a helpful policy banner: *"Cleaning requests are dedicated to hall corridors, lounges, staircases, and shared facilities (not personal room cleaning)."*

### 5. 🗳️ Quick Access Tile Harmonization & Mess Poll Theme
- **Differentiated Quick Access Palette:**
  - Full Menu: **Royal Blue**
  - Night Canteen: **Celestial Charcoal & Royal Purple**
  - Grievances: **Coral Rose**
  - Mess Poll: **Warm Sunburst Amber / Gold**
  - Duty Gallery: **Mint Emerald Green**
- **Unified Poll Experience:** Monthly Mess Poll page (`/poll`) styled with matching warm amber / sunburst gradient theme, custom progress bars, and vote buttons.

### 6. 🏛️ Hall Info Hub Design Language Overhaul & Vibrant Contacts
- **Design Language Alignment:** All movie screenings, student activities, idea submission portals, and achievement award cards unified with the core frosted glass system.
- **Colorful Contacts Directory:** Emergency and council contacts feature individual vibrant glassy initial badges (Blue, Emerald, Purple, Amber, Rose, Cyan) with standardized Emerald Green call buttons.

### 7. 👥 Two-Way Verifiable Resolution & Stealth Admin Override
- **Two-Way Resolution Verification:** Differentiates between grievances resolved by admin only vs verified by both admin and student.
- **Discretionary Resolution Override:** Master Admins can designate authorized admins to override resolution status when necessary, maintaining an admin-only audit log while preserving student privacy publicly.

### 8. 📊 45-Day Retention & Statistical Aggregate Preservation
- **45-Day Grievance Archive:** Detailed complaint records purged after 45 days.
- **Permanent Statistical Memory:** Grievance counts, average resolution turnaround times per category, and resolution trends are permanently aggregated in `GrievanceStatSummary` for executive analytics.

---

## 📌 Version 0.9.5 (v0.9.5) — Automated Grievance Ticketing & Hall Hub Overhaul

**Release Date:** August 19, 2026  
**Package Version:** `0.9.5`  
**Status:** Tested & Verified (`npm run build` — 28/28 routes compiled cleanly)

### 1. 🎫 Automated Grievance Ticket Number Generation System
- **Structured Ticket Specification:** Implemented auto-generated ticket numbers for every grievance across the platform using the format: **`<room no><two letter category code><date><count>`** (e.g. `D-515MS1908261`, `D-515DW1908261`).
- **Standardised 2-Letter Subcategory Codes:**
  - `REGULAR_MESS` ➔ **`MS`** (Mess Food & Hygiene)
  - `NIGHT_CANTEEN` ➔ **`NC`** (Night Canteen Services)
  - `MAINTENANCE_WASHROOM` ➔ **`WR`** (Washroom & Plumbing)
  - `MAINTENANCE_WATER` ➔ **`DW`** (Drinking Water & Coolers)
  - `MAINTENANCE_ELECTRICAL` ➔ **`EL`** (Electrical & Lighting)
  - `MAINTENANCE_CIVIL` ➔ **`CV`** (Civil, Carpentry & Masonry)
  - `MAINTENANCE_CLEANING` ➔ **`CL`** (Sanitation & Housekeeping)
  - `MAINTENANCE_OUTDOOR` ➔ **`OD`** (Lawns, Courtyards & Grounds)
- **Database Schema Sync:** Added `ticketNumber String? @unique` to `model Feedback` in [prisma/schema.prisma](prisma/schema.prisma) and synchronised the database via `prisma db push`.
- **Ticket Utility Library:** Created [src/lib/ticket.ts](src/lib/ticket.ts) with category code lookup, IST `DDMMYY` date formatting, sequential daily count resolution, and fallback generation for legacy/in-memory records.
- **Interactive Monospace Ticket Badge:** Built [src/components/ticket-badge.tsx](src/components/ticket-badge.tsx) featuring a monospace pill badge with instant 1-click clipboard copy and animated checkmark confirmation.
- **Student Portals Integration:** Submission confirmation alerts display the generated Ticket ID, and recent grievance cards feature prominent `TicketBadge` indicators across Mess (`/feedback`), Maintenance (`/maintenance`), and Night Canteen (`/night-canteen`) pages.

### 2. 🔍 Universal Admin Grievance Search & Filtering
- **Multi-Field Search Bar:** Integrated real-time search inputs across all 3 grievance admin dashboards:
  - **Mess Admin** ([src/app/admin/page.tsx](src/app/admin/page.tsx))
  - **Maintenance Admin** ([src/app/maintenance/admin/page.tsx](src/app/maintenance/admin/page.tsx))
  - **Night Canteen Admin** ([src/app/night-canteen/admin/page.tsx](src/app/night-canteen/admin/page.tsx))
- **Instant Filtering:** Allows hall secretaries and administrators to filter grievances by **Ticket Number**, **Room Number**, student name, or complaint keyword with live card updates.

### 3. 🏆 Hall Info Hub Reordering & Full Admin Management
- **Tab Reordering:** Reordered Hall Info Hub tabs so **Awards / Achievements** appears before **Ideas / Suggestions**:
  > **Movies** ➔ **Activities** ➔ 🏆 **Awards** ➔ 💡 **Ideas** ➔ 📞 **Contacts**
- **Comprehensive Admin Control:** Added full management portals for adding, editing, and deleting Movie Screenings, Hall Achievements, Activity Registrations, Suggestions, and Emergency Contacts in [src/app/hub/admin/page.tsx](src/app/hub/admin/page.tsx).
- **Poster File Upload & Clipboard Paste:** Admins can upload movie poster files or paste image files directly from their clipboard with real-time preview and upload progress indicators.
- **Enhanced Screening Typography:** Movie screening dates, timings, and venue typography made more prominent, legible, and optimized for fast page loading.

### 4. 🖼️ Grievance Media Gallery Parser Resilience
- **Multi-Format Media Parser:** Enhanced `parseMediaUrls` in [src/components/grievance-media-gallery.tsx](src/components/grievance-media-gallery.tsx) to handle string arrays, JSON string arrays, comma-delimited Cloudinary URLs, and escaped quote formats, ensuring preview thumbnails render reliably on all cards.

### 5. 🎯 Hero Banner Size Harmonization & Catchy Taglines
- **Equal Vertical Height:** Standardised the top hero banner height and styling across the Homepage, Maintenance page, and Hall Info Hub page.
- **Catchy Hall Taglines:**
  - Homepage: *"Who are we to Mess with you, bros! 🗿"*
  - Maintenance: *"Fixing faults before they unfix you... 🛠️"*

### 6. 🛠️ Maintenance Category Layout Restoration
- **Intuitive 3-Column Grid:** Restored the 3-column category grid layout (`grid-cols-3 gap-2`) with high-contrast active state highlights, icons, and precise location description placeholders on [src/app/maintenance/page.tsx](src/app/maintenance/page.tsx).

### 7. 👥 Multilevel Stakeholder Resolution Attribution
- **Resolver Attribution Tracking:** When a grievance is resolved or remarked upon, the backend records `resolvedBy`, `resolvedByEmail`, `resolvedByRole`, and `resolvedAt` in the database.
- **Public & Admin Verification Badge:** Both student and admin grievance cards display a timestamped resolution stamp: `✓ Resolved by: <Email / Designation> • <Date & Time in IST>`.

### 8. 🔒 Stealth Master Password & OTP-Based Admin Access
- **Clean Single-Input Gateway:** The admin access gate in [src/components/admin-auth-gate.tsx](src/components/admin-auth-gate.tsx) presents a single prompt: *"Enter Admin Email"*.
- **Stealth Master Admin Access:** Entering the master password silently authenticates with full Master Admin privileges without revealing any password cues.
- **OTP Email Authentication:** Entering a registered admin email dispatches a 6-digit OTP via Supabase Auth and authenticates the specific stakeholder.
- **Dynamic Admin User Management:** Master Admins can access the **"Manage Admins"** panel ([src/components/admin-users-modal.tsx](src/components/admin-users-modal.tsx)) from the top session banner to add new admin emails, update designations, or revoke access with zero credentials stored in git.

---

## 📌 Version 0.9.0 (v0.9) — Major System Overhaul & Maintenance Release

**Release Date:** August 10, 2026  
**Package Version:** `0.9.0`  
**Status:** Tested & Verified (`npm run build` — 26/26 routes compiled cleanly)

### 1. 🛡️ Grievances System & Terminology Standardisation
- **Terminology Shift:** Standardised terminology to **"Grievances"** across all student and admin portals (`/feedback`, `/maintenance`, `/night-canteen`, home tile), reserving "Suggestions" exclusively for the Hall Info Hub.
- **Section Separation:** Isolated Mess Grievances (`REGULAR_MESS`) from Maintenance Grievances (`MAINTENANCE_*`).

### 2. 🗑️ Cloudinary Physical File Auto-Purge & Pending Credentials Fallback
- **Signed Cloudinary Admin Destroy Utility:** Added [src/lib/cloudinary-delete.ts](src/lib/cloudinary-delete.ts) using standard Node `crypto` for SHA-1 signed REST calls (`/v1_1/<cloud_name>/<resource_type>/destroy`).
- **Grievance Deletion Purge:** Deleting a complaint in [src/app/api/feedback/route.ts](src/app/api/feedback/route.ts) automatically purges the physical file from Cloudinary.
- **Gallery Deletion & Rejection Purge:** Deleting or rejecting a gallery upload in [src/app/api/gallery/route.ts](src/app/api/gallery/route.ts) or [src/app/api/gallery/approve/route.ts](src/app/api/gallery/approve/route.ts) automatically purges the physical file from Cloudinary servers.
- **Pending Credentials Graceful Fallback Notice:** If Cloudinary API credentials (`CLOUDINARY_API_KEY` & `CLOUDINARY_API_SECRET`) are pending or missing, deletion actions fail gracefully and present a notice: *"Cloudinary auto-purge will work in future once API credentials are configured."*

### 3. 📅 30-Day Auto-Purge Policy for Mess Duty Gallery
- **Automated Expire Cleanup:** Mess Duty Gallery records (`GalleryImage` in Prisma) older than 30 days from `createdAt` are automatically auto-purged from both Supabase PostgreSQL DB and Cloudinary storage during `/api/gallery` queries.
- **Retention Disclaimers:** Added explicit 30-day auto-purge retention notices to both public ([src/app/gallery/page.tsx](src/app/gallery/page.tsx)) and admin ([src/app/admin/gallery/page.tsx](src/app/admin/gallery/page.tsx)) gallery pages.

### 4. 🖼️ Multi-Media Attachments & `+N` Expandable Thumbnail Gallery
- **Multi-File Selection:** Boarders can select and attach multiple photos/videos on complaint forms across Mess, Maintenance, and Night Canteen portals (`/feedback`, `/maintenance`, `/night-canteen`).
- **`+N` Expandable Preview Grid:** Grievance cards display small low-res thumbnail previews inline. If multiple media files are attached (e.g. 5 files), a `+4` overlay thumbnail is displayed. Tapping `+N` expands/collapses the full media thumbnail grid seamlessly with individual download options.
- **Admin & Student Portals Sync:** Reusable `GrievanceMediaGallery` component powers preview thumbnails across all student views and admin dashboards ([/admin](file:///d:/IITKGP_projects/BRH-Mess-management-system/src/app/admin/page.tsx), [/maintenance/admin](file:///d:/IITKGP_projects/BRH-Mess-management-system/src/app/maintenance/admin/page.tsx), [/night-canteen/admin](file:///d:/IITKGP_projects/BRH-Mess-management-system/src/app/night-canteen/admin/page.tsx)).

### 5. 📷 20 MB Limit & OTP-Free Direct Upload for Mess Duty Gallery
- **20 MB Limit:** Increased file size limit from 5 MB to **20 MB** for Mess Duty Gallery photos and video uploads in [src/app/gallery/page.tsx](src/app/gallery/page.tsx).
- **Direct Submission:** Removed OTP authentication requirement for Mess Duty uploads. Boarders upload files directly to Cloudinary; items are saved in the PostgreSQL DB with status `PENDING` awaiting Mess Admin approval.

### 7. 🔒 Pre-Loaded Admin Visual Layout with Deferred Data Fetching
- **Visual Layout & Resources:** Admin page structures, cards, action tabs, buttons, and UI framework (`children`) load and render in the background under a blurred, non-interactive overlay (`blur-md opacity-35 pointer-events-none select-none`).
- **Deferred Data Fetching:** Data fetching (`useEffect`) across all 6 admin portals is gated behind `useAdminAuth()` context (`if (isAuthenticated)`). Zero database queries or confidential grievance records are requested over the network until authentication succeeds.
- **Instant Unlocking:** Entering the server-verified admin password sets `isAuthenticated = true`, unlocking the interactive admin controls and loading real-time database records seamlessly.

### 5. 📷 Picture & Video Metadata Timestamp (`capturedAt`) in IST (GMT +5:30)
- **Metadata Extraction:** Client-side form handlers extract `file.lastModified` (camera capture / creation timestamp) from uploaded photos/videos in Grievances and Mess Duty Gallery.
- **GMT +5:30 IST Formatting:** All timestamps across the platform are formatted explicitly in Indian Standard Time (`timeZone: 'Asia/Kolkata'`) with `IST` indicator badges.
- **Card Metadata Display:** Displays `📷 Captured: <Date & Time> IST` on all grievance cards and gallery overlays across student and admin portals.

### 6. 🎬 Admin Movie Poster File Upload & Uncropped Frame Display
- **Direct Poster File Upload:** Admins can now upload movie poster photos or video trailers directly from their device in [src/app/hub/admin/page.tsx](src/app/hub/admin/page.tsx) with a live progress bar.
- **Uncropped Poster Frame:** Movie posters display the complete uncropped poster image using `object-contain` inside standard aspect ratio frame containers across both student ([src/app/hub/page.tsx](src/app/hub/page.tsx)) and admin dashboards.

### 7. 📈 Post-OTP Verification Uploading Progress Bar
- **Post-OTP Progress Feedback:** Immediately after OTP verification succeeds (or via cached 24h verification), submission forms display a live animated uploading progress bar (`Uploading Media Proof (XX%)...`) while uploading media to Cloudinary and saving to database.

### 8. ⚡ 24-Hour Email Verification Cache
- **OTP Bypass Cache:** Updated [src/components/otp-modal.tsx](src/components/otp-modal.tsx) to cache verified institute emails in `localStorage` under `bros_verified_email` with a 24-hour timestamp (`verifiedAt`).
- **Instant Resubmission:** Boarders who successfully complete OTP verification bypass the OTP step automatically for 24 hours.

### 9. ⏱️ Server-Side Rate Limiting Engine
- **Grievances Rate Limit:** Enforced 1 complaint per hour per section (Mess, Maintenance, Canteen) and capped at **3 total complaints per day** combined across all sections in [src/app/api/feedback/route.ts](src/app/api/feedback/route.ts).
- **Suggestions Rate Limit:** Enforced 1 suggestion per category per day in [src/app/api/hub/route.ts](src/app/api/hub/route.ts).
- **Prenum Fix:** Updated Prisma enum filters (`MAINTENANCE_TYPES` using `{ in: [...] }` instead of string `startsWith`).

### 9. 📝 Form Simplification & Smart Room No Format
- **Roll Number Removal:** Completely removed Roll Number requirement from complaint forms across all sections.
- **Optional Student Name:** Name field made optional (defaults to *"Anonymous"*).
- **Mandatory Room No with Smart Formatting:** Typing `a515` auto-capitalises the wing letter (`A`–`D`), auto-inserts a hyphen `-`, and caps input to 3 digits (`A-515`).
- **Server Validation:** Server validates format using regex `/^[A-D]-\d{3}$/`.

### 10. 🌳 Outdoor Maintenance Category
- Added **Outdoor Category** (`MAINTENANCE_OUTDOOR`) with a tree icon on [src/app/maintenance/page.tsx](src/app/maintenance/page.tsx).
- Updated `FacilityType` enum in [prisma/schema.prisma](prisma/schema.prisma) and pushed changes to Supabase PostgreSQL via `prisma db push`.

### 11. 🔒 30-Minute State-Preserving Admin Session Gate
- **Session Duration:** Updated [src/components/admin-auth-gate.tsx](src/components/admin-auth-gate.tsx) to enforce a 30-minute session duration with a live countdown timer badge (`e.g. 29m 45s`).
- **Zero Data Loss on Lock:** Kept children DOM state mounted under a blurred modal overlay during lock/expiry. Typed remarks, draft values, or unsubmitted form data are **100% preserved upon re-authentication**.

### 12. 🎨 Plus Jakarta Sans Typography & Design Polish
- **Font Upgrade:** Switched root font in [src/app/layout.tsx](src/app/layout.tsx) from Inter to `Plus_Jakarta_Sans` via `next/font/google` for ultra-crisp modern dashboard styling.
- **CSS Utility Polish:** Added `.glow-purple` and smooth focus hover borders to glass cards in [src/app/globals.css](src/app/globals.css).
- **Footer Footnote:** Added `BROS v0.9` version tag to [src/components/footer.tsx](src/components/footer.tsx).

### 13. 📅 Today's Menu Day Selector UI
- **Sunday Week Start:** Reordered day selector in [src/app/page.tsx](src/app/page.tsx) to start from Sunday (`SUN`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`).
- **Fixed 7-Column Layout:** Replaced scrolling container with a fixed `grid grid-cols-7` layout fitting 100% within the mobile screen width without horizontal scrolling.

---

## 📝 Guidelines for Future Version Upgrades

1. **Before modifying code:** Record planned changes under a new version section in `updates.md`.
2. **After implementing & testing:** Verify build with `npx next build`.
3. **Before git commit & push:** Copy key release highlights from `updates.md` to `README.md` and bump package version in `package.json`.
