import { AppDataSource } from "../config/data-source";
import { Category } from "../entity/category.entity";

const categories = [
  "Food & Dining",
  "Transportation",
  "Rent & Mortgage",
  "Utilities",
  "Entertainment",
  "Health & Medical",
  "Shopping",
  "Insurance",
  "Education",
  "Personal Care",
  "Investment",
  "Income",
  "Others",
];

const seed = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected for seeding...");

    const categoryRepository = AppDataSource.getRepository(Category);

    for (const name of categories) {
      const existing = await categoryRepository.findOneBy({ name });
      if (!existing) {
        const category = categoryRepository.create({ name });
        await categoryRepository.save(category);
        console.log(`Created category: ${name}`);
      } else {
        console.log(`Category already exists: ${name}`);
      }
    }

    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
};

seed();
