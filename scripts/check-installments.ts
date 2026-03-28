import { AppDataSource } from "../config/data-source";
import { checkDueInstallments } from "../utils/cron";

const run = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected for manual installment check...");
    
    await checkDueInstallments();
    
    console.log("Installment check completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error during manual installment check:", error);
    process.exit(1);
  }
};

run();
