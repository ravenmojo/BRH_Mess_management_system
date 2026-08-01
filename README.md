# BRH Hall Management System

A comprehensive Next.js web application built as a centralized solution for the students of B.R. Ambedkar Hall (BRH) (currently) at IIT Kharagpur. The system handles weekly mess menu scheduling, rigorous mess guideline validation (budgeting, mandatory item checks, and dietary constraints), student feedback, and hall maintenance requests.

## Features

### 🍽️ Student Portals
- **Interactive Menu Viewer:** Students can view the live weekly menu categorized by day and meal (Breakfast, Lunch, Dinner).
- **Complaints & Feedback:** A dedicated portal for students to submit rational feedback and complaints regarding the mess food quality or service.
- **Maintenance Portal:** A separate channel to log maintenance issues within the hall premises. Covers multiple categories including Electrical, Civil (Plumbing & Carpentry), Sweeping/Cleaning, Internet/Network, and Pest Control. Features an administrative dashboard for the maintenance secretary to track and resolve student issues.

### 🛡️ Admin & Menu Builder
- **Dynamic Weekly Menu Builder:** Admins can structure a full 7-day menu for the mess, adjusting items across "Common", "Option 1/2", "Veg", and "Non-Veg" categories.
- **Live Compliance Widgets:** As the admin builds the menu, the system runs strict, real-time mess guideline validations:
  - **Budget Cap Enforcement (PDF Logic):** Calculates the average rate per day per student. Flags if the mathematical sum exceeds the strict ₹826/week limit, allowing for a service provider adjustment buffer up to ₹850.
  - **Mandatory Items Check:** Ensures that essential Indian staples (Rice, Roti, Dal) are present in major meals.
  - **Salad Count:** Ensures a minimum of 11 salad servings per week across lunch and dinner.
- **Visual Validation UI:** Non-critical violations highlight in yellow, while critical blocking errors flash red to prevent publishing out-of-budget menus.

### 🌓 Modern UI/UX
- **Dark Mode Support:** Fully integrated light and dark modes with sleek, smooth transitions and glassmorphism styling.
- **Responsive Design:** Mobile-first, fully responsive layouts using Tailwind CSS.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Database / ORM:** [Prisma](https://www.prisma.io/)
- **Theming:** `next-themes`

## Getting Started

### Prerequisites
Make sure you have Node.js and npm installed on your local environment.

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Database Setup:**
   Ensure your database connection string is properly set in the `.env` file (if applicable). Then generate the Prisma client and push the schema:
   ```bash
   npm run prisma:generate
   npm run prisma:push
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/src/app`: Contains the Next.js App Router pages (`/menu`, `/admin`, `/feedback`, etc.).
- `/src/lib`: Contains core business logic, including `mess-rules.ts` which handles the complex pricing validation.
- `/src/components`: Reusable UI components.
- `/prisma`: Contains the `schema.prisma` defining the database models.

## Usage Guidelines

When publishing a menu as an Admin, pay attention to the **Live Compliance Widgets**. 
- A **Yellow Warning** means the menu deviates slightly from standard guidelines (e.g., missing Roti on a Friday, or relying on the Service Provider Adjustment Buffer for pricing), but **publication is allowed**.
- A **Flashing Red Error** means a critical budget or structural violation has occurred, and **publication is blocked**.

Please use the system responsibly and complain rationally!

## License
Private / IITKGP specific usage.
