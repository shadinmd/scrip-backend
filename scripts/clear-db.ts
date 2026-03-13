import { AppDataSource } from "../config/data-source";

const clearDB = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected for clearing...");

    const entities = AppDataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.query(
        `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
      );
      console.log(`Cleared table: ${entity.tableName}`);
    }

    console.log("Database cleared successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
};

clearDB();
