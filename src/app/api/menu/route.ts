import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateWeeklyMenu, DailyMenuInput } from '@/lib/mess-rules';
import { verifyAdminPassword } from '@/lib/admin-auth';

// Initial Mock Data populated from April Menu 2026 PDF
const mockWeeklyMenu: DailyMenuInput[] = [
  {
    dayOfWeek: "MONDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "UPMA/POHA + CHUTNEY",
            price: 16,
            optionGroup: "Option 1"
          },
          {
            name: "MILK 150ml",
            price: 9,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Alu posto",
            price: 14,
            optionGroup: "Common"
          },
          {
            name: "Mx Veg",
            price: 16,
            optionGroup: "Veg"
          },
          {
            name: "01 Pcs Fish Curry 50 gm",
            price: 17,
            optionGroup: "Non-Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Paneer Kolhapuri",
            price: 32,
            optionGroup: "Veg"
          },
          {
            name: "Kadhai Chicken (100gm)",
            price: 32,
            optionGroup: "Non-Veg"
          }
        ]
      }
    ]
  },
  {
    dayOfWeek: "TUESDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "02 PCS ALU PARATHA + Green CHUTNEY",
            price: 20,
            optionGroup: "Option 1"
          },
          {
            name: "Curd (100g)",
            price: 8,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Dal Makhni",
            price: 12,
            optionGroup: "Common"
          },
          {
            name: "Curd + Alu Kathal Curry",
            price: 12,
            optionGroup: "Veg"
          },
          {
            name: "Curd (Rs. 8)",
            price: 8,
            optionGroup: "Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Alu Soyabeen Curry/Capsicum Chilli Nutrella",
            price: 12,
            optionGroup: "Veg"
          },
          {
            name: "1 Pcs egg curry",
            price: 10,
            optionGroup: "Non-Veg"
          }
        ]
      }
    ]
  },
  {
    dayOfWeek: "WEDNESDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "02 PCS UTTAPAM + CHUTNEY",
            price: 16,
            optionGroup: "Option 1"
          },
          {
            name: "MILK 150ml",
            price: 9,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Alu Karela Fry",
            price: 12,
            optionGroup: "Common"
          },
          {
            name: "Rajma Curry",
            price: 12,
            optionGroup: "Veg"
          },
          {
            name: "Curd (100g)",
            price: 8,
            optionGroup: "Veg"
          },
          {
            name: "01 Pcs Doi Fish Curry 50gm",
            price: 19,
            optionGroup: "Non-Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Veg Briyani + Paneer butter masala (50 gm) Raita + Ice Cream",
            price: 65,
            optionGroup: "Veg"
          },
          {
            name: "Chicken Biriyani 01 Pcs (100 gm) + Half egg + Raita + Ice Cream",
            price: 65,
            optionGroup: "Non-Veg"
          }
        ]
      }
    ]
  },
  {
    dayOfWeek: "THURSDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "(3 PCS) IDLY/VADA + SAMBHAR + CHUTNEY",
            price: 15,
            optionGroup: "Option 1"
          },
          {
            name: "MILK 150ml",
            price: 9,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Kadhi Pakoda",
            price: 16,
            optionGroup: "Veg"
          },
          {
            name: "01 Pcs Mustard Fish Curry 50 gm",
            price: 17,
            optionGroup: "Non-Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Alu Parwal Curry",
            price: 12,
            optionGroup: "Common"
          },
          {
            name: "Veg Korma",
            price: 16,
            optionGroup: "Veg"
          }
        ]
      }
    ]
  },
  {
    dayOfWeek: "FRIDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "02 PCS SATTU PARATHA + GREEN CHUTNEY",
            price: 20,
            optionGroup: "Option 1"
          },
          {
            name: "MILK 150ml",
            price: 9,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Sukto",
            price: 12,
            optionGroup: "Common"
          },
          {
            name: "Black Channa Masala + curd(100ml)",
            price: 20,
            optionGroup: "Veg"
          },
          {
            name: "01 Pcs Fish Curry (50 gm)",
            price: 17,
            optionGroup: "Non-Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Fried Rice (NO BASIC DAL)",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Paneer Do Pyaza/Kadhai Paneer (50gm)",
            price: 30,
            optionGroup: "Veg"
          },
          {
            name: "Chilli Chicken (100gm)",
            price: 32,
            optionGroup: "Non-Veg"
          }
        ]
      }
    ]
  },
  {
    dayOfWeek: "SATURDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "01 PCS MASALA DOSA + SAMBAR + CHUTNEY",
            price: 18,
            optionGroup: "Option 1"
          },
          {
            name: "MILK 150ml",
            price: 9,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Alu Cabbage Green Peas",
            price: 12,
            optionGroup: "Veg"
          },
          {
            name: "Curd (Rs. 8)",
            price: 8,
            optionGroup: "Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Rice + Channa Dal Fry + Sweet",
            price: 25,
            optionGroup: "Common",
            isMandatory: true
          }
        ]
      }
    ]
  },
  {
    dayOfWeek: "SUNDAY",
    meals: [
      {
        mealType: "BREAKFAST",
        items: [
          {
            name: "Tea + 01 pc Banana",
            price: 6,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "02 PCS CHOLE BHATURE or 04 PCS MAIDA LUCHI GHUGHNI",
            price: 18,
            optionGroup: "Option 1"
          },
          {
            name: "MILK 150ml",
            price: 9,
            optionGroup: "Option 1"
          },
          {
            name: "Bread (White/Brown), Butter/Jam",
            price: 15.3,
            optionGroup: "Option 2"
          },
          {
            name: "MILK 150ml (Opt 2)",
            price: 9,
            optionGroup: "Option 2"
          }
        ]
      },
      {
        mealType: "LUNCH",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Alu Kumro Pui Sag",
            price: 12,
            optionGroup: "Common"
          },
          {
            name: "Chana Masala",
            price: 12,
            optionGroup: "Veg"
          },
          {
            name: "Curd (Rs. 8)",
            price: 8,
            optionGroup: "Veg"
          },
          {
            name: "01 Pcs Doi Fish Curry 50gm",
            price: 19,
            optionGroup: "Non-Veg"
          }
        ]
      },
      {
        mealType: "DINNER",
        items: [
          {
            name: "Rice, Roti, Dal, Pickle & Salad",
            price: 16.5,
            optionGroup: "Common",
            isMandatory: true
          },
          {
            name: "Matar Paneer (50gm)",
            price: 30,
            optionGroup: "Veg"
          },
          {
            name: "Chicken Kasha (100 gm)",
            price: 32,
            optionGroup: "Non-Veg"
          }
        ]
      }
    ]
  }
];

let inMemoryWeeklyMenu: DailyMenuInput[] = [...mockWeeklyMenu];

const DAY_ORDER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export async function GET() {
  try {
    const dailyMenus = await prisma.dailyMenu.findMany({
      where: { facilityType: 'REGULAR_MESS' },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (dailyMenus.length === 0) {
      const sortedInMemory = [...inMemoryWeeklyMenu].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));
      const validation = validateWeeklyMenu(sortedInMemory);
      return NextResponse.json({
        menu: sortedInMemory,
        validation,
      });
    }

    // Format DB response into DailyMenuInput[]
    const formattedMenu: DailyMenuInput[] = dailyMenus.map((dm) => {
      const mealsMap = new Map<string, any[]>();
      dm.items.forEach((mi) => {
        if (!mealsMap.has(mi.mealType)) {
          mealsMap.set(mi.mealType, []);
        }
        mealsMap.get(mi.mealType)!.push({
          id: mi.item.id,
          name: mi.item.name,
          price: mi.price,
          category: mi.item.category,
          isSalad: mi.item.isSalad,
          isMandatory: mi.item.isMandatory,
          optionGroup: mi.optionGroup,
        });
      });

      const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'NIGHT_SNACK'];
      const meals: any[] = Array.from(mealsMap.entries())
        .map(([mealType, items]) => ({
          mealType,
          items,
        }))
        .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));

      return {
        dayOfWeek: dm.dayOfWeek as any,
        meals,
      };
    });

    formattedMenu.sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));

    const validation = validateWeeklyMenu(formattedMenu);
    return NextResponse.json({
      menu: formattedMenu,
      validation,
    });
  } catch (error) {
    // Fallback to in-memory store if DB is disconnected
    const sortedInMemory = [...inMemoryWeeklyMenu].sort((a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek));
    const validation = validateWeeklyMenu(sortedInMemory);
    return NextResponse.json({
      menu: sortedInMemory,
      validation,
    });
  }
}

export async function POST(request: Request) {
  if (!(await verifyAdminPassword(request))) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { weeklyMenu } = body;

    if (!weeklyMenu || !Array.isArray(weeklyMenu)) {
      return NextResponse.json(
        { error: 'Invalid payload. "weeklyMenu" must be an array.' },
        { status: 400 }
      );
    }

    // CRITICAL REQUIREMENT: Run mess-rules validation before saving
    const validation = validateWeeklyMenu(weeklyMenu);

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Menu publication blocked due to mess guideline violations.',
          validation,
        },
        { status: 400 }
      );
    }

    // Update in-memory menu state
    inMemoryWeeklyMenu = weeklyMenu;

    // Try saving to DB if connected
    try {
      for (const day of weeklyMenu) {
        let dayCost = 0;
        for (const meal of day.meals) {
          let commonCost = 0, opt1Cost = 0, opt2Cost = 0, vegCost = 0, nonVegCost = 0;
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
          dayCost += commonCost + avgBreakfastOpt + avgLunchDinnerOpt;
        }

        const dailyMenu = await prisma.dailyMenu.upsert({
          where: {
            dayOfWeek_facilityType: {
              dayOfWeek: day.dayOfWeek,
              facilityType: 'REGULAR_MESS',
            },
          },
          update: { totalCost: dayCost },
          create: {
            dayOfWeek: day.dayOfWeek,
            facilityType: 'REGULAR_MESS',
            totalCost: dayCost,
          },
        });

        // Clear existing items for this dailyMenu and insert new ones
        await prisma.menuItem.deleteMany({
          where: { dailyMenuId: dailyMenu.id },
        });

        for (const meal of day.meals) {
          for (const item of meal.items) {
            // Find or create item
            let dbItem = await prisma.item.findFirst({
              where: { name: item.name, facilityType: 'REGULAR_MESS' },
            });

            if (!dbItem) {
              dbItem = await prisma.item.create({
                data: {
                  name: item.name,
                  price: Number(item.price) || 0,
                  category: meal.mealType,
                  facilityType: 'REGULAR_MESS',
                  isSalad: item.isSalad !== undefined ? item.isSalad : item.name.toLowerCase().includes('salad'),
                  isMandatory: item.isMandatory || false,
                },
              });
            } else {
              dbItem = await prisma.item.update({
                where: { id: dbItem.id },
                data: {
                  price: Number(item.price) || 0,
                  isSalad: item.isSalad !== undefined ? item.isSalad : dbItem.isSalad,
                  isMandatory: item.isMandatory !== undefined ? item.isMandatory : dbItem.isMandatory,
                },
              });
            }

            await prisma.menuItem.create({
              data: {
                dailyMenuId: dailyMenu.id,
                itemId: dbItem.id,
                mealType: meal.mealType as any,
                price: Number(item.price) || 0,
                optionGroup: item.optionGroup || 'Common',
              },
            });
          }
        }
      }
    } catch (dbError) {
      console.warn('DB sync bypassed, updated in-memory store.', dbError);
    }

    return NextResponse.json({
      message: 'Weekly menu successfully published!',
      validation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update weekly menu' },
      { status: 500 }
    );
  }
}
