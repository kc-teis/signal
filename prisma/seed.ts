import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Product Management", slug: "pm" },
  { name: "User Experience Design", slug: "ux" },
  { name: "Engineering", slug: "dev" },
  { name: "Executives", slug: "executives" },
  { name: "Process", slug: "process" },
  { name: "AI Trends", slug: "ai-trends" },
  { name: "Software Development Life Cycle", slug: "sdlc" },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }
  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
