import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BRH Mess Management System database...');

  // 1. Seed Regular Mess Items
  const items = [
    { name: 'Tea + Banana', price: 6.0, category: 'Breakfast', isSalad: false, isMandatory: true },
    { name: 'UPMA/POHA + Chutney', price: 16.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Alu Paratha + Green Chutney', price: 20.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Uttapam + Chutney', price: 16.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Idly/Vada + Sambhar', price: 15.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Sattu Paratha + Green Chutney', price: 20.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Masala Dosa + Sambhar', price: 18.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Chole Bhature / Luchi Ghughni', price: 18.0, category: 'Breakfast', isSalad: false, isMandatory: false },
    { name: 'Rice', price: 7.0, category: 'Main Staple', isSalad: false, isMandatory: true },
    { name: 'Roti', price: 4.0, category: 'Main Staple', isSalad: false, isMandatory: true },
    { name: 'Dal', price: 5.5, category: 'Main Staple', isSalad: false, isMandatory: true },
    { name: 'Salad', price: 2.0, category: 'Salad', isSalad: true, isMandatory: true },
    { name: 'Pickle', price: 1.0, category: 'Condiment', isSalad: false, isMandatory: false },
    { name: 'Mx Veg / Alu Posto', price: 16.0, category: 'Lunch Veg', isSalad: false, isMandatory: false },
    { name: 'Paneer Kolhapuri', price: 32.0, category: 'Dinner Special', isSalad: false, isMandatory: false },
    { name: 'Kadhai Chicken', price: 32.0, category: 'Dinner Non-Veg', isSalad: false, isMandatory: false },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, '-') },
      update: item,
      create: {
        id: item.name.toLowerCase().replace(/\s+/g, '-'),
        ...item,
        facilityType: 'REGULAR_MESS',
      },
    });
  }

  // 2. Seed Sample Initial Complaints
  await prisma.feedback.createMany({
    data: [
      {
        studentName: 'Sourav Roy',
        hallRoll: '21BRH1002',
        comment: 'The Dal served in Tuesday lunch was slightly undercooked.',
        facilityType: 'REGULAR_MESS',
        status: 'RESOLVED',
        remark: 'Issue conveyed to chef. Fresh batch prepared for dinner.',
      },
      {
        studentName: 'Rahul Verma',
        hallRoll: '22BRH2015',
        comment: 'Night Canteen Paneer Roll was great! Could you add extra cheese options?',
        facilityType: 'NIGHT_CANTEEN',
        status: 'PENDING',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
