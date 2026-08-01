const mockWeeklyMenu = [
  {
    dayOfWeek: 'MONDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: 'UPMA/POHA + CHUTNEY', price: 16, optionGroup: 'Option 1' },
          { name: 'MILK 150ml (Opt 1)', price: 9, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Alu posto', price: 14, optionGroup: 'Common' },
          { name: 'Mx Veg', price: 16, optionGroup: 'Veg' },
          { name: '01 Pcs Fish Curry 50 gm', price: 17, optionGroup: 'Non-Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Paneer Kolhapuri', price: 32, optionGroup: 'Veg' },
          { name: 'Kadhai Chicken (100gm)', price: 32, optionGroup: 'Non-Veg' },
        ],
      },
    ],
  },
  {
    dayOfWeek: 'TUESDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: '02 PCS ALU PARATHA + Green CHUTNEY', price: 20, optionGroup: 'Option 1' },
          { name: 'Curd (100g)', price: 8, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Dal Makhni', price: 12, optionGroup: 'Common' },
          { name: 'Curd + Alu Kathal Curry', price: 12, optionGroup: 'Veg' },
          { name: 'Curd (Rs. 8)', price: 8, optionGroup: 'Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Alu Soyabeen Curry/Capsicum Chilli Nutrella', price: 12, optionGroup: 'Veg' },
          { name: '1 Pcs egg curry', price: 10, optionGroup: 'Non-Veg' },
        ],
      },
    ],
  },
  {
    dayOfWeek: 'WEDNESDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: '02 PCS UTTAPAM + CHUTNEY', price: 16, optionGroup: 'Option 1' },
          { name: 'MILK 150ml', price: 9, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Alu Karela Fry', price: 12, optionGroup: 'Common' },
          { name: 'Rajma Curry', price: 12, optionGroup: 'Veg' },
          { name: 'Curd (100g)', price: 8, optionGroup: 'Veg' },
          { name: '01 Pcs Doi Fish Curry 50gm', price: 19, optionGroup: 'Non-Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Veg Briyani + Paneer butter masala (50 gm) Raita + Ice Cream', price: 65, optionGroup: 'Veg' },
          { name: 'Chicken Biriyani 01 Pcs (100 gm) + Half egg + Raita + Ice Cream', price: 65, optionGroup: 'Non-Veg' },
        ],
      },
    ],
  },
  {
    dayOfWeek: 'THURSDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: '(3 PCS) IDLY/VADA + SAMBHAR + CHUTNEY', price: 15, optionGroup: 'Option 1' },
          { name: 'MILK 150ml', price: 9, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Kadhi Pakoda', price: 16, optionGroup: 'Veg' },
          { name: '01 Pcs Mustard Fish Curry 50 gm', price: 17, optionGroup: 'Non-Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Alu Parwal Curry', price: 12, optionGroup: 'Common' },
          { name: 'Veg Korma', price: 16, optionGroup: 'Veg' },
        ],
      },
    ],
  },
  {
    dayOfWeek: 'FRIDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: '02 PCS SATTU PARATHA + GREEN CHUTNEY', price: 20, optionGroup: 'Option 1' },
          { name: 'MILK 150ml', price: 9, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Sukto', price: 12, optionGroup: 'Common' },
          { name: 'Black Channa Masala + curd(100ml)', price: 20, optionGroup: 'Veg' },
          { name: '01 Pcs Fish Curry (50 gm)', price: 17, optionGroup: 'Non-Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Fried Rice (NO BASIC DAL)', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Paneer Do Pyaza/Kadhai Paneer (50gm)', price: 30, optionGroup: 'Veg' },
          { name: 'Chilli Chicken (100gm)', price: 32, optionGroup: 'Non-Veg' },
        ],
      },
    ],
  },
  {
    dayOfWeek: 'SATURDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: '01 PCS MASALA DOSA + SAMBAR + CHUTNEY', price: 18, optionGroup: 'Option 1' },
          { name: 'MILK 150ml', price: 9, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Alu Cabbage Green Peas', price: 12, optionGroup: 'Veg' },
          { name: 'Curd (Rs. 8)', price: 8, optionGroup: 'Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice + Channa Dal Fry + Sweet', price: 25, optionGroup: 'Common', isMandatory: true },
        ],
      },
    ],
  },
  {
    dayOfWeek: 'SUNDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: '02 PCS CHOLE BHATURE or 04 PCS MAIDA LUCHI GHUGHNI', price: 18, optionGroup: 'Option 1' },
          { name: 'MILK 150ml', price: 9, optionGroup: 'Option 1' },
          { name: 'Bread (White/Brown), Butter/Jam', price: 15.3, optionGroup: 'Option 2' },
          { name: 'MILK 150ml (Opt 2)', price: 9, optionGroup: 'Option 2' },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Alu Kumro Pui Sag', price: 12, optionGroup: 'Common' },
          { name: 'Chana Masala', price: 12, optionGroup: 'Veg' },
          { name: 'Curd (Rs. 8)', price: 8, optionGroup: 'Veg' },
          { name: '01 Pcs Doi Fish Curry 50gm', price: 19, optionGroup: 'Non-Veg' },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice, Roti, Dal, Pickle & Salad', price: 16.5, optionGroup: 'Common', isMandatory: true },
          { name: 'Matar Paneer (50gm)', price: 30, optionGroup: 'Veg' },
          { name: 'Chicken Kasha (100 gm)', price: 32, optionGroup: 'Non-Veg' },
        ],
      },
    ],
  },
];

let totalWeeklyCost = 0;
const expectedTotals = {
  MONDAY: 126.15,
  TUESDAY: 105.15,
  WEDNESDAY: 142.15,
  THURSDAY: 109.00,
  FRIDAY: 126.15,
  SATURDAY: 92.15,
  SUNDAY: 126.15,
};

for (const day of mockWeeklyMenu) {
  let dayCost = 0;
  for (const m of day.meals) {
    let c = 0, o1 = 0, o2 = 0, v = 0, nv = 0;
    for (const i of m.items) {
      const p = Number(i.price) || 0;
      const g = i.optionGroup || 'Common';
      if (g === 'Option 1') o1 += p;
      else if (g === 'Option 2') o2 += p;
      else if (g === 'Veg') v += p;
      else if (g === 'Non-Veg') nv += p;
      else c += p;
    }
    dayCost += c + Math.max(o1, o2) + Math.max(v, nv);
  }
  
  // Round to handle float inaccuracies
  dayCost = Math.round(dayCost * 100) / 100;
  
  if (dayCost !== expectedTotals[day.dayOfWeek]) {
    console.error(`Mismatch for ${day.dayOfWeek}. Calculated: ${dayCost}, Expected: ${expectedTotals[day.dayOfWeek]}`);
  } else {
    console.log(`${day.dayOfWeek}: ${dayCost} - MATCH`);
  }
  totalWeeklyCost += dayCost;
}

console.log(`Total Weekly Cost: ${totalWeeklyCost}`);
