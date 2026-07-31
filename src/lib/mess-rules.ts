export const MAX_WEEKLY_COST = 826; // ₹118/day * 7 days
export const MIN_SALAD_COUNT = 12; // 12 out of 14 Lunch/Dinner meals

export interface MenuItemInput {
  id?: string;
  name: string;
  price: number;
  category?: string;
  isSalad?: boolean;
  isMandatory?: boolean;
}

export interface MealInput {
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'NIGHT_SNACK';
  items: MenuItemInput[];
}

export interface DailyMenuInput {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  meals: MealInput[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    totalWeeklyCost: number;
    maxWeeklyCost: number;
    saladCount: number;
    minSaladRequired: number;
    mandatoryItemsValid: boolean;
    missingMandatoryItems: string[];
  };
}

/**
 * Helper to check if an item list contains a target keyword (case-insensitive)
 */
function hasItemKeyword(items: MenuItemInput[], keywords: string[]): boolean {
  return items.some((item) =>
    keywords.some((kw) => item.name.toLowerCase().includes(kw.toLowerCase()))
  );
}

/**
 * 1. Validate Weekly Cost (Max ₹826, Regular Mess only)
 */
export function validateWeeklyCost(weeklyMenu: DailyMenuInput[]): {
  isValid: boolean;
  totalCost: number;
  maxCost: number;
  message?: string;
} {
  let totalCost = 0;

  for (const day of weeklyMenu) {
    for (const meal of day.meals) {
      // Sum prices of unique items in meal
      for (const item of meal.items) {
        totalCost += Number(item.price) || 0;
      }
    }
  }

  // Round to 2 decimal places
  totalCost = Math.round(totalCost * 100) / 100;
  const isValid = totalCost <= MAX_WEEKLY_COST;

  return {
    isValid,
    totalCost,
    maxCost: MAX_WEEKLY_COST,
    message: isValid
      ? `Weekly cost (₹${totalCost}) is within budget limit of ₹${MAX_WEEKLY_COST}.`
      : `Weekly cost (₹${totalCost}) exceeds maximum allowed budget of ₹${MAX_WEEKLY_COST}.`,
  };
}

/**
 * 2. Validate Mandatory Items (Rice/Dal for Lunch; Rice/Roti/Dal for Dinner)
 */
export function validateMandatoryItems(weeklyMenu: DailyMenuInput[]): {
  isValid: boolean;
  missingItems: string[];
} {
  const missingItems: string[] = [];

  const RICE_KEYWORDS = ['rice', 'pulao', 'biryani', 'khichdi', 'bhat', 'jeera rice'];
  const DAL_KEYWORDS = ['dal', 'sambar', 'sambhar', 'curry', 'tadka'];
  const ROTI_KEYWORDS = ['roti', 'chapati', 'naan', 'puri', 'paratha', 'luchi', 'bhature'];

  const days: DailyMenuInput['dayOfWeek'][] = [
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ];

  for (const dayName of days) {
    const day = weeklyMenu.find((d) => d.dayOfWeek === dayName);
    if (!day) {
      missingItems.push(`${dayName}: Entire day menu is missing.`);
      continue;
    }

    // Lunch Check
    const lunch = day.meals.find((m) => m.mealType === 'LUNCH');
    if (!lunch) {
      missingItems.push(`${dayName} Lunch: Meal is missing.`);
    } else {
      const hasRice = hasItemKeyword(lunch.items, RICE_KEYWORDS);
      const hasDal = hasItemKeyword(lunch.items, DAL_KEYWORDS);

      if (!hasRice) missingItems.push(`${dayName} Lunch: Missing mandatory item "Rice".`);
      if (!hasDal) missingItems.push(`${dayName} Lunch: Missing mandatory item "Dal".`);
    }

    // Dinner Check
    const dinner = day.meals.find((m) => m.mealType === 'DINNER');
    if (!dinner) {
      missingItems.push(`${dayName} Dinner: Meal is missing.`);
    } else {
      const hasRice = hasItemKeyword(dinner.items, RICE_KEYWORDS);
      const hasRoti = hasItemKeyword(dinner.items, ROTI_KEYWORDS);
      const hasDal = hasItemKeyword(dinner.items, DAL_KEYWORDS);

      if (!hasRice) missingItems.push(`${dayName} Dinner: Missing mandatory item "Rice".`);
      if (!hasRoti) missingItems.push(`${dayName} Dinner: Missing mandatory item "Roti".`);
      if (!hasDal) missingItems.push(`${dayName} Dinner: Missing mandatory item "Dal".`);
    }
  }

  return {
    isValid: missingItems.length === 0,
    missingItems,
  };
}

/**
 * 3. Validate Salad Count (Min 12 out of 14 Lunch/Dinner meals)
 */
export function validateSaladCount(weeklyMenu: DailyMenuInput[]): {
  isValid: boolean;
  saladCount: number;
  minRequired: number;
  totalMeals: number;
  message?: string;
} {
  let saladCount = 0;
  const SALAD_KEYWORDS = ['salad', 'cucumber', 'kuchumber', 'raw veg'];

  for (const day of weeklyMenu) {
    for (const meal of day.meals) {
      if (meal.mealType === 'LUNCH' || meal.mealType === 'DINNER') {
        const hasSalad = meal.items.some(
          (item) =>
            item.isSalad ||
            SALAD_KEYWORDS.some((kw) => item.name.toLowerCase().includes(kw))
        );
        if (hasSalad) {
          saladCount++;
        }
      }
    }
  }

  const isValid = saladCount >= MIN_SALAD_COUNT;

  return {
    isValid,
    saladCount,
    minRequired: MIN_SALAD_COUNT,
    totalMeals: 14,
    message: isValid
      ? `Salad count (${saladCount}/14) meets requirement (min ${MIN_SALAD_COUNT}).`
      : `Salad count (${saladCount}/14) is below required minimum of ${MIN_SALAD_COUNT}.`,
  };
}

/**
 * Comprehensive Weekly Menu Rule Validator
 */
export function validateWeeklyMenu(weeklyMenu: DailyMenuInput[]): ValidationResult {
  const costCheck = validateWeeklyCost(weeklyMenu);
  const mandatoryCheck = validateMandatoryItems(weeklyMenu);
  const saladCheck = validateSaladCount(weeklyMenu);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!costCheck.isValid && costCheck.message) {
    errors.push(costCheck.message);
  }

  if (!mandatoryCheck.isValid) {
    errors.push(...mandatoryCheck.missingItems);
  }

  if (!saladCheck.isValid && saladCheck.message) {
    errors.push(saladCheck.message);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      totalWeeklyCost: costCheck.totalCost,
      maxWeeklyCost: MAX_WEEKLY_COST,
      saladCount: saladCheck.saladCount,
      minSaladRequired: MIN_SALAD_COUNT,
      mandatoryItemsValid: mandatoryCheck.isValid,
      missingMandatoryItems: mandatoryCheck.missingItems,
    },
  };
}
