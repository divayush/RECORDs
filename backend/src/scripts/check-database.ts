import { prisma } from '../config/database.js';

const dealCount = await prisma.deal.count();

console.log(
  JSON.stringify({
    database: 'ok',
    provider: 'mongodb',
    collections: ['Deal'],
    dealCount,
  }),
);

await prisma.$disconnect();
