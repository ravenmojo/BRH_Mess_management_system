import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateWeeklyMenu, DailyMenuInput } from '@/lib/mess-rules';

// Initial Mock Data populated from April Menu 2026 PDF
const mockWeeklyMenu: DailyMenuInput[] = [
  {
    dayOfWeek: 'MONDAY',
    meals: [
      {
        mealType: 'BREAKFAST',
        items: [
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'UPMA/POHA + Chutney', price: 16 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Moong Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Mx Veg / Alu Posto', price: 16 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Roti', price: 4 },
          { name: 'Dal (Musur Dal)', price: 5.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Paneer Kolhapuri', price: 32 },
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
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'Alu Paratha + Green Chutney', price: 20 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Chana Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Curd + Alu Kathal Curry', price: 20 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Roti', price: 4 },
          { name: 'Dal Makhni (Arhar Dal)', price: 12 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Alu Soyabeen Curry', price: 12 },
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
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'Uttapam + Chutney', price: 16 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Arhar Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Rajma Curry + Curd', price: 20 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Roti', price: 4 },
          { name: 'Dal', price: 5.5 },
          { name: 'Salad', price: 2 },
          { name: 'Veg Biryani + Paneer Butter Masala', price: 55 },
          { name: 'Ice Cream', price: 10 },
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
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'Idly/Vada + Sambhar', price: 15 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Musur Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Kadhi Pakoda', price: 16 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Roti', price: 4 },
          { name: 'Dal (Chana Dal)', price: 5.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Veg Korma', price: 16 },
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
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'Sattu Paratha + Green Chutney', price: 20 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Moong Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Black Channa Masala + Curd', price: 20 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice (Fried Rice)', price: 12.5 },
          { name: 'Roti', price: 4 },
          { name: 'Dal', price: 5.5 },
          { name: 'Salad', price: 2 },
          { name: 'Paneer Do Pyaza', price: 30 },
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
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'Masala Dosa + Sambhar', price: 18 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Arhar Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Alu Cabbage Green Peas + Curd', price: 20 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Roti', price: 4 },
          { name: 'Channa Dal Fry', price: 10 },
          { name: 'Salad', price: 2 },
          { name: 'Gulab Jamun Sweet', price: 15 },
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
          { name: 'Tea', price: 3 },
          { name: 'Banana', price: 3 },
          { name: 'Chole Bhature / Luchi Ghughni', price: 18 },
        ],
      },
      {
        mealType: 'LUNCH',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Dal (Moong Dal)', price: 9.5 },
          { name: 'Pickle', price: 1 },
          { name: 'Salad', price: 2 },
          { name: 'Chana Masala + Curd', price: 20 },
        ],
      },
      {
        mealType: 'DINNER',
        items: [
          { name: 'Rice', price: 7 },
          { name: 'Roti', price: 4 },
          { name: 'Dal (Musur Dal)', price: 5.5 },
          { name: 'Salad', price: 2 },
          { name: 'Matar Paneer', price: 30 },
        ],
      },
    ],
  },
];

let inMemoryWeeklyMenu: DailyMenuInput[] = [...mockWeeklyMenu];

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
      const validation = validateWeeklyMenu(inMemoryWeeklyMenu);
      return NextResponse.json({
        menu: inMemoryWeeklyMenu,
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
        });
      });

      const meals: any[] = Array.from(mealsMap.entries()).map(([mealType, items]) => ({
        mealType,
        items,
      }));

      return {
        dayOfWeek: dm.dayOfWeek as any,
        meals,
      };
    });

    const validation = validateWeeklyMenu(formattedMenu);
    return NextResponse.json({
      menu: formattedMenu,
      validation,
    });
  } catch (error) {
    // Fallback to in-memory store if DB is disconnected
    const validation = validateWeeklyMenu(inMemoryWeeklyMenu);
    return NextResponse.json({
      menu: inMemoryWeeklyMenu,
      validation,
    });
  }
}

export async function POST(request: Request) {
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
          error: 'Menu publication blocked due to business rule violations.',
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
        const dayCost = day.meals.reduce(
          (sum: number, m: any) =>
            sum + m.items.reduce((itemSum: number, i: any) => itemSum + (Number(i.price) || 0), 0),
          0
        );

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
                  isSalad: item.isSalad || item.name.toLowerCase().includes('salad'),
                  isMandatory: item.isMandatory || false,
                },
              });
            }

            await prisma.menuItem.create({
              data: {
                dailyMenuId: dailyMenu.id,
                itemId: dbItem.id,
                mealType: meal.mealType as any,
                price: Number(item.price) || 0,
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
