import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/user.entity";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { formatInTimeZone } from "date-fns-tz";
import { subDays } from "date-fns";

const TIMEZONE = "Asia/Kolkata";

const seedTestData = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected for test data seeding...");

    const userRepository = AppDataSource.getRepository(User);
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const categoryRepository = AppDataSource.getRepository(Category);

    // 1. Create or Find Test User
    let user = await userRepository.findOneBy({ email: "test@example.com" });
    if (!user) {
      const hashedPassword = await bcrypt.hash("random", 10);
      user = userRepository.create({
        username: "testuser",
        email: "test@example.com",
        password: hashedPassword,
      });
      await userRepository.save(user);
      console.log("Created test user: test@example.com");
    } else {
      console.log("Test user already exists.");
    }

    // 2. Fetch Categories
    const categories = await categoryRepository.find();
    if (categories.length === 0) {
      console.error("No categories found. Please run seed:categories first.");
      process.exit(1);
    }

    // 3. Clear existing transactions for this user for fresh seeding
    await transactionRepository.delete({ userId: user.id });
    console.log("Cleared existing transactions for test user.");

    // 4. Generate Transactions: 2 per day for last 90 days (roughly 3 months)
    const transactionsToCreate: any[] = [];
    const totalDays = 90;
    const today = new Date();

    for (let i = 0; i < totalDays; i++) {
      const currentDate = subDays(today, i);
      const dateString = formatInTimeZone(currentDate, TIMEZONE, "yyyy-MM-dd");

      // 2 transactions per day
      for (let t = 1; t <= 2; t++) {
        const category =
          categories[Math.floor(Math.random() * categories.length)];
        transactionsToCreate.push({
          amount: Math.floor(Math.random() * 500) + 50, // Slightly higher random amounts
          description: `Transaction ${t} on ${dateString}`,
          date: dateString,
          category: category,
          userId: user.id,
        });
      }
    }

    const createdTransactions =
      transactionRepository.create(transactionsToCreate);
    await transactionRepository.save(createdTransactions);

    console.log(
      `Successfully seeded ${createdTransactions.length} transactions for the last 90 days ending today (${TIMEZONE}).`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Error during test data seeding:", error);
    process.exit(1);
  }
};

seedTestData();
