# Project: BRH Mess Management System (Zero-Cost Deployment)
**Repository:** `BRH_Mess_management_system` (Already connected)
**Role:** You are an expert full-stack developer. Build a unified web app and database for the BRH hostel mess. The entire stack MUST be optimized for 100% free deployment on Vercel (Hosting) and Supabase (PostgreSQL Database). 
*Note: I have uploaded reference documents ("April Menu 2026.pdf" and "11496IITKGPHMCMESS202302.pdf") to the repo. Please refer to them if you need to seed the database with actual item names and prices.*

## 1. Zero-Cost Tech Stack
- **Framework:** Next.js 14+ (App Router, TypeScript).
- **Database:** PostgreSQL via Supabase (using Prisma ORM).
- **Hosting:** Vercel (Ensure API routes are optimized for serverless).
- **Styling:** Tailwind CSS (Minimalist design, utility-first).
- **Theming:** `next-themes` for seamless Light/Dark mode switchability.
- **Icons:** `lucide-react` (Use minimal, clean icons for all navigation).

## 2. Core Business Rules (CRITICAL)
The system is divided into two distinct entities: **Regular Mess** and **Night Canteen**. 

### A. Regular Mess (Breakfast, Lunch, Dinner ONLY. NO evening snacks)
1. **Financial Constraint:** The overall cost per boarder per week CANNOT exceed **₹826** (Calculated as ₹118/day * 7 days). The system MUST block menu publication if the weekly total exceeds this.
2. **Mandatory Items Constraint:** 
   - **Lunch:** MUST include Rice and Dal.
   - **Dinner:** MUST include Rice, Roti, and Dal.
3. **Salad Constraint:** Salad MUST be served in at least **12 out of the 14** Lunch and Dinner meals in a week.

### B. Night Canteen (Separate Entity)
- Operates completely independently. **NO budget constraints (₹826 limit) or nutritional constraints apply to the Night Canteen.**
- The Night Canteen UI must strictly contain ONLY two sub-options/tabs: **"Menu"** and **"Feedback/Complaint"**. No other options allowed.

### C. Feedback & Complaint System
- Students can submit complaints for both Regular Mess and Night Canteen.
- Admin must be able to view complaints, add **Remarks**, and mark them as **Resolved**.

## 3. Database & Prisma Setup (Supabase Optimized)
- Create `prisma/schema.prisma`. Use `postgresql` as the provider.
- **CRITICAL FOR VERCEL:** Create `src/lib/prisma.ts` and implement the **Prisma Client Singleton pattern** to prevent database connection exhaustion on Vercel's serverless free tier.
- Create `.env.local.example` with placeholders for `DATABASE_URL` (Supabase).

## 4. Business Logic
- Create `src/lib/mess-rules.ts`. Write strict TypeScript validation functions for:
  1. `validateWeeklyCost()` (Max ₹826, Regular Mess only).
  2. `validateMandatoryItems()` (Rice/Dal for Lunch; Rice/Roti/Dal for Dinner, Regular Mess only).
  3. `validateSaladCount()` (Min 12/14, Regular Mess Lunch/Dinner only).

## 5. UI/UX Guidelines
- **Theme:** Global Light/Dark mode toggle in the header using CSS variables for smooth transitions.
- **Navigation:** Minimal, icon-based Bottom Navigation (Icons for: Home, Menu, Night Canteen, Feedback, Admin).
- **Admin Dashboard:** Must include "Live Validation Widgets" showing weekly spend vs ₹826 limit, and salad count vs 12/14. Turn red if limits are breached.

## 6. Execution Steps
Please execute the following steps sequentially:

**Step 1: Initialization**
- Install dependencies: `@prisma/client`, `prisma`, `next-themes`, `lucide-react`, `clsx`.
- Configure Tailwind for class-based dark mode.

**Step 2: Database & Logic**
- Create `prisma/schema.prisma` (Models: Item, DailyMenu, Feedback, User. Include `facilityType` ENUM to separate Regular Mess and Night Canteen).
- Create `src/lib/prisma.ts` (Prisma Singleton).
- Create `src/lib/mess-rules.ts` with the strict validations.
- Create `.env.local.example`.

**Step 3: Core UI Components**
- Create `theme-provider.tsx`, `theme-toggle.tsx`, and `bottom-nav.tsx`.
- Update `layout.tsx` to include the ThemeProvider, Header (with toggle), and BottomNav.

**Step 4: Pages & API**
- `src/app/page.tsx`: Student Dashboard (Today's menu, weekly budget tracker).
- `src/app/night-canteen/page.tsx`: Strict 2-tab UI (Menu, Feedback).
- `src/app/admin/page.tsx`: Admin dashboard with Menu Builder, Live Validation Widgets, and Feedback management (with Admin Remarks input).
- `src/app/api/menu/route.ts`: API route to save menu. MUST run `mess-rules.ts` validations before saving. Return 400 if constraints fail.

**Step 5: Vercel Optimization & Seeding**
- Ensure `next.config.js` is optimized for Vercel.
- Create a basic seed script (`prisma/seed.ts`) referencing the uploaded PDFs to populate initial items and prices.

Begin execution now. Write clean, modular, production-ready code optimized for the Vercel/Supabase free tiers.