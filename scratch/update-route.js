const fs = require('fs');

const mockWeeklyMenu = [
  {
    dayOfWeek: 'MONDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea + 01 pc Banana', price: 6, optionGroup: 'Common', isMandatory: true },
          { name: 'UPMA/POHA + CHUTNEY', price: 16, optionGroup: 'Option 1' },
          { name: 'MILK 150ml', price: 9, optionGroup: 'Option 1' },
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

const filePath = 'd:/IITKGP_projects/BRH-Mess-management-system/src/app/api/menu/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /const mockWeeklyMenu: DailyMenuInput\[\] = \[[\s\S]*?\];\n/;
const replacement = `const mockWeeklyMenu: DailyMenuInput[] = ${JSON.stringify(mockWeeklyMenu, null, 2).replace(/"([^"]+)":/g, '$1:')};\n`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Replaced mockWeeklyMenu successfully.');
} else {
  console.log('Could not find mockWeeklyMenu block in route.ts');
}
