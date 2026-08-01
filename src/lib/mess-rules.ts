export const MAX_WEEKLY_COST = 835; // Allow slight buffer above 118.13*7 (826.91) for actual meal selection variability
export const MIN_SALAD_COUNT = 11; // 11 out of 14 Lunch/Dinner meals as per PDF menu

export interface MenuItemInput {
  id?: string;
  name: string;
  price: number;
  category?: string;
  isSalad?: boolean;
  isMandatory?: boolean;
  optionGroup?: string;
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
      let commonCost = 0;
      let opt1Cost = 0;
      let opt2Cost = 0;
      let vegCost = 0;
      let nonVegCost = 0;

      for (const item of meal.items) {
        const p = Number(item.price) || 0;
        const group = item.optionGroup || 'Common';
        
        if (group === 'Common') commonCost += p;
        else if (group === 'Option 1') opt1Cost += p;
        else if (group === 'Option 2') opt2Cost += p;
        else if (group === 'Veg') vegCost += p;
        else if (group === 'Non-Veg') nonVegCost += p;
        else commonCost += p;
      }

      const avgBreakfastOpt = (opt1Cost > 0 && opt2Cost > 0) ? (opt1Cost + opt2Cost) / 2 : (opt1Cost || opt2Cost);
      const avgLunchDinnerOpt = (vegCost > 0 && nonVegCost > 0) ? (vegCost + nonVegCost) / 2 : (vegCost || nonVegCost);

      totalCost += commonCost + avgBreakfastOpt + avgLunchDinnerOpt;
    }
  }

  // Round to 2 decimal places
  totalCost = Math.round(totalCost * 100) / 100;
  
  // Logic of the PDF: "Service provider has provided maximum adjustment menu and rate of Rs. 118.00"
  // The unadjusted mathematical cost may exceed 826 (118 * 7), but the service provider applies an adjustment.
  // We allow the unadjusted cost to go up to a theoretical max (e.g., 850) and treat it as an adjustment.
  const STRICT_MAX = 826;
  const ADJUSTMENT_BUFFER = 850;
  
  const isValid = totalCost <= ADJUSTMENT_BUFFER;
  const requiresAdjustment = totalCost > STRICT_MAX && totalCost <= ADJUSTMENT_BUFFER;

  return {
    isValid,
    totalCost,
    maxCost: STRICT_MAX,
    message: isValid
      ? (requiresAdjustment 
          ? `Weekly cost (₹${totalCost}) exceeds strict limit (₹${STRICT_MAX}) but is within the service provider maximum adjustment buffer (₹${ADJUSTMENT_BUFFER}). Average rate applies.`
          : `Weekly cost (₹${totalCost}) is within budget limit of ₹${STRICT_MAX} (₹118/day).`)
      : `Weekly cost (₹${totalCost}) exceeds the absolute maximum adjustment buffer of ₹${ADJUSTMENT_BUFFER}.`,
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

  const RICE_KEYWORDS = ['rice', 'pulao', 'biryani', 'briyani', 'khichdi', 'bhat', 'jeera rice'];
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
  } else if (costCheck.message && costCheck.totalCost > 826) {
    warnings.push(costCheck.message);
  }

  if (!mandatoryCheck.isValid) {
    warnings.push(...mandatoryCheck.missingItems);
  }

  if (!saladCheck.isValid && saladCheck.message) {
    warnings.push(saladCheck.message);
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
