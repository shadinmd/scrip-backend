import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/user.entity";
import { Transaction } from "../entity/transaction.entity";
import { Category } from "../entity/category.entity";
import { Account } from "../entity/account.entity";
import { Loan } from "../entity/loan.entity";
import { LoanInstallment } from "../entity/loan-installment.entity";
import { formatInTimeZone } from "date-fns-tz";
import { subDays, addMonths, format } from "date-fns";

const TIMEZONE = "Asia/Kolkata";

const seedTestData = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected for test data seeding...");

    const userRepository = AppDataSource.getRepository(User);
    const transactionRepository = AppDataSource.getRepository(Transaction);
    const categoryRepository = AppDataSource.getRepository(Category);
    const accountRepository = AppDataSource.getRepository(Account);
    const loanRepository = AppDataSource.getRepository(Loan);

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

    // 3. Clear existing data for this user for fresh seeding
    // We do this in order to avoid foreign key constraint issues if any
    await transactionRepository.delete({ userId: user.id });
    await loanRepository.delete({ userId: user.id });
    await accountRepository.delete({ userId: user.id });
    console.log("Cleared existing data for test user.");

    // 4. Create Test Accounts
    const mainAccount = accountRepository.create({
      name: "Main Savings",
      balance: 50000,
      isDefault: true,
      userId: user.id,
    });
    const secondaryAccount = accountRepository.create({
      name: "Credit Card",
      balance: 10000,
      isDefault: false,
      userId: user.id,
    });
    await accountRepository.save([mainAccount, secondaryAccount]);
    console.log("Created test accounts.");

    // 5. Generate Transactions: 2 per day for last 90 days
    const transactionsToCreate: any[] = [];
    const totalDays = 90;
    const today = new Date();
    let totalSpent = 0;
    let totalIncome = 0;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = subDays(today, i);
      const dateString = formatInTimeZone(currentDate, TIMEZONE, "yyyy-MM-dd");

      // Daily Expenses
      for (let t = 1; t <= 2; t++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const amount = Math.floor(Math.random() * 500) + 50;
        totalSpent += amount;

        transactionsToCreate.push({
          amount: amount,
          type: "debit",
          description: `Expense ${t} on ${dateString}`,
          date: dateString,
          category: category,
          accountId: mainAccount.id,
          userId: user.id,
        });
      }

      // Monthly Salary (Credit)
      if (i % 30 === 0) {
        const salaryAmount = 50000;
        totalIncome += salaryAmount;
        transactionsToCreate.push({
          amount: salaryAmount,
          type: "credit",
          description: `Salary for month ${i / 30 + 1}`,
          date: dateString,
          category: categories.find((c) => c.name === "Salary") || categories[0],
          accountId: mainAccount.id,
          userId: user.id,
        });
      }
    }

    const createdTransactions = transactionRepository.create(transactionsToCreate);
    await transactionRepository.save(createdTransactions);

    // Update account balance after transactions
    mainAccount.balance =
      parseFloat(mainAccount.balance.toString()) + totalIncome - totalSpent;
    await accountRepository.save(mainAccount);

    console.log(`Successfully seeded ${createdTransactions.length} transactions.`);

    // 6. Seed Two Loans and link paid installments to transactions
    const loanData = [
      {
        name: "Car Loan",
        installments: [
          { amount: 5000, date: format(subDays(today, 30), "yyyy-MM-dd"), isPaid: true },
          { amount: 5000, date: format(today, "yyyy-MM-dd"), isPaid: false },
          { amount: 5000, date: format(addMonths(today, 1), "yyyy-MM-dd"), isPaid: false },
          { amount: 5000, date: format(addMonths(today, 2), "yyyy-MM-dd"), isPaid: false },
        ],
      },
      {
        name: "Home Mortgage",
        installments: [
          { amount: 15000, date: format(subDays(today, 15), "yyyy-MM-dd"), isPaid: true },
          { amount: 15000, date: format(addMonths(today, 1), "yyyy-MM-dd"), isPaid: false },
          { amount: 15000, date: format(addMonths(today, 2), "yyyy-MM-dd"), isPaid: false },
        ],
      },
    ];

    let additionalSpent = 0;
    const loanTransactions: any[] = [];

    for (const l of loanData) {
      const loan = loanRepository.create({
        name: l.name,
        userId: user.id,
        installments: l.installments,
      });
      const savedLoan = await loanRepository.save(loan);

      // For each paid installment, create a corresponding transaction
      for (const installment of savedLoan.installments) {
        if (installment.isPaid) {
          additionalSpent += parseFloat(installment.amount.toString());
          loanTransactions.push({
            amount: installment.amount,
            type: "debit",
            description: `Loan Payment: ${l.name}`,
            date: installment.date,
            accountId: mainAccount.id,
            userId: user.id,
            installment: installment,
            categoryId: categories.find((c) => c.name === "Debt")?.id || null,
          });
        }
      }
    }

    if (loanTransactions.length > 0) {
      const createdLoanTransactions = transactionRepository.create(loanTransactions);
      await transactionRepository.save(createdLoanTransactions);
    }

    // Update account balance after loan transactions
    mainAccount.balance = parseFloat(mainAccount.balance.toString()) - additionalSpent;
    await accountRepository.save(mainAccount);

    console.log("Successfully seeded loans and linked paid installments to transactions.");

    process.exit(0);
  } catch (error) {
    console.error("Error during test data seeding:", error);
    process.exit(1);
  }
};

seedTestData();
