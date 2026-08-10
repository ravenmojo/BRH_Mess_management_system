# BROS — Application Changelog & Version Updates

This document tracks all feature implementations, bug fixes, UI/UX enhancements, and database schema updates made prior to releasing a new version upgrade. Content from this changelog is used to synchronize the main [README.md](README.md) before publishing or pushing commits to production.

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

### 4. 🖼️ Low-Res Preview Media & Download Options
- **Inline Media Previews:** Added low-resolution image thumbnail and video player previews inline directly inside grievance cards across student portals and admin dashboards (`/feedback`, `/maintenance`, `/night-canteen`, `/maintenance/admin`, `/night-canteen/admin`).
- **Grievance Media Downloads:** Added inline **"Full Media"** links and **"Download"** buttons (`<Download />`) next to preview thumbnails.
- **Admin Gallery Bulk Download:** Added a **"Download All Media"** button in [src/app/admin/gallery/page.tsx](src/app/admin/gallery/page.tsx) available exclusively to authenticated admins.

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
