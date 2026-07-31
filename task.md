# Project: BRH Mess Management System
**Repository:** `ravenmojo/BRH-mess` (Already connected)
**Role:** You are an expert full-stack developer. Your task is to build a unified web application and database for managing all aspects of the BRH hostel mess activities from scratch.

## 1. Tech Stack & Architecture
- **Framework:** Next.js 14+ (App Router, TypeScript).
- **Database:** PostgreSQL with Prisma ORM.
- **Styling:** Tailwind CSS (Minimalist design, utility-first).
- **Theming:** `next-themes` for seamless Light/Dark mode switchability.
- **Icons:** `lucide-react` (Use minimal, clean icons for all navigation and actions).

## 2. Core Business Rules & Constraints (CRITICAL)
The system is divided into two distinct entities: **Regular Mess** and **Night Canteen**. 

### A. Regular Mess (Breakfast, Lunch, Dinner)
*Note: There are NO evening snacks. Only Breakfast, Lunch, and Dinner.*
1. **Financial Constraint:** The overall cost per boarder per week CANNOT exceed **₹826** (Calculated as ₹118/day * 7 days). The system must block menu publication if the weekly total exceeds this.
2. **Mandatory Items Constraint:** 
   - **Lunch:** MUST include Rice and Dal.
   - **Dinner:** MUST include Rice, Roti, and Dal.
3. **Salad Constraint:** Salad MUST be served in at least **12 out of the 14** Lunch and Dinner meals in a week.

### B. Night Canteen (Separate Entity)
- Operates independently. **NO budget constraints (₹826 limit) or nutritional constraints apply to the Night Canteen.**
- The Night Canteen UI must strictly contain ONLY two sub-options/tabs: **"Menu"** and **"Feedback/Complaint"**.

### C. Feedback & Complaint System
- Students can submit complaints for both Regular Mess and Night Canteen.
- Admin must be able to view complaints, add **Remarks**, and mark them as **Resolved**.

## 3. Database Schema Requirements (Prisma)
Design the schema to support the above rules. Key requirements:
- **`Item`**: Must include `name`, `price`, `category` (VEG, NON_VEG, COMMON, SALAD, etc.), `isSalad` (boolean), and `facilityType` (ENUM: 'REGULAR_MESS', 'NIGHT_CANTEEN').
- **`DailyMenu`**: Must include `date`, `mealType` (ENUM: 'BREAKFAST', 'LUNCH', 'DINNER', 'NIGHT_CANTEEN'), `facilityType`, and a calculated `totalCost`.
- **`Feedback`**: Must include `facilityType` to distinguish between Regular Mess and Night Canteen complaints, `status` (OPEN, RESOLVED), and `adminRemarks`.
- **`User`**: Basic auth with roles (STUDENT, ADMIN).

## 4. UI/UX Guidelines
- **Theme:** Implement a global Light/Dark mode toggle in the header. Use CSS variables for background/foreground colors to ensure smooth transitions.
- **Navigation:** Use a minimal, icon-based Bottom Navigation bar for mobile/webapp views (Icons for: Home, Menu, Night Canteen, Feedback, Admin).
- **Admin Dashboard:** Must include a "Live Validation Widget" that shows the current weekly spend vs the ₹826 limit, and the current salad count vs the 12/14 requirement. It should turn red if limits are breached.

## 5. Execution Steps
Please execute the following steps sequentially:

**Step 1: Initialization & Setup**
- Initialize the Next.js project structure (if not already done).
- Install dependencies: `@prisma/client`, `prisma`, `next-themes`, `lucide-react`, `clsx`, `tailwindcss`.
- Configure Tailwind for class-based dark mode.

**Step 2: Database & Business Logic**
- Create `prisma/schema.prisma` based on the requirements in Section 3. Run `npx prisma generate`.
- Create `src/lib/mess-rules.ts`. Write strict TypeScript validation functions for:
  1. `validateWeeklyCost()` (Max ₹826, Regular Mess only).
  2. `validateMandatoryItems()` (Rice/Dal for Lunch; Rice/Roti/Dal for Dinner, Regular Mess only).
  3. `validateSaladCount()` (Min 12/14, Regular Mess Lunch/Dinner only).

**Step 3: Core UI Components**
- Create `src/components/theme-provider.tsx` and `src/components/theme-toggle.tsx`.
- Create `src/components/bottom-nav.tsx` using `lucide-react` icons.
- Update `src/app/layout.tsx` to wrap the app in the ThemeProvider and include the Header (with Theme Toggle) and BottomNav.

**Step 4: Pages & Features**
- **`src/app/page.tsx`**: Student Dashboard showing today's menu and weekly budget tracker.
- **`src/app/night-canteen/page.tsx`**: A strict 2-tab interface ("Menu" and "Feedback/Complaint"). No other options allowed.
- **`src/app/admin/page.tsx`**: Admin dashboard with the Menu Builder and the Live Validation Widgets for the ₹826 limit and 12/14 salad rule. Include a Feedback management section with inputs for Admin Remarks.
- **`src/app/api/menu/route.ts`**: API route to save the menu. It MUST run the validation functions from `mess-rules.ts` before saving to the database and return a 400 error if constraints are violated.

**Step 5: Finalization**
- Ensure all code is strictly typed.
- Verify that the Night Canteen is completely decoupled from the Regular Mess budget logic.
- Provide a brief summary of what was created and how to run the development server.

Begin execution now. Write clean, modular, and production-ready code.