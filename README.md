# Scrip Backend

The backend server for **Scrip**, a personal finance and loan management application. Built with Node.js/TypeScript using Express and Bun, it provides a robust API for managing accounts, transactions, and loans.

## 🔗 Related Repositories
- **Frontend App:** [scrip-app](https://github.com/shadinmd/scrip-app)

## 🚀 Tech Stack
- **Runtime:** [Bun](https://bun.sh/)
- **Framework:** [Express.js](https://expressjs.com/)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** [TypeORM](https://typeorm.io/)
- **Validation:** [Zod](https://zod.dev/)
- **Authentication:** JWT (Access & Refresh Tokens)
- **Notifications:** [Expo Server SDK](https://github.com/expo/expo-server-sdk-node)
- **Task Scheduling:** node-cron

## ✨ Features
- **User Authentication:** Secure login and registration with JWT-based session management.
- **Account Management:** Track multiple financial accounts.
- **Category System:** Organized expense and income categories.
- **Transaction Tracking:** Record and categorize all financial movements.
- **Loan Management:** Advanced tracking for loans and automatic installment calculations.
- **Scheduled Tasks:** Automated checks for loan installments and notifications.
- **Push Notifications:** Integration with Expo for real-time mobile alerts.

## 📂 Project Structure
```text
backend/
├── config/             # Database and app configurations
├── controllers/        # Request handlers
├── entity/             # TypeORM models (Entities)
├── k8s/                # Kubernetes deployment files
├── middlewares/        # Express middlewares (Auth, Error, Validation)
├── migrations/         # Database migration files
├── routers/            # API route definitions
├── scripts/            # Database seeding and utility scripts
├── utils/              # Helper functions (JWT, Cron, Notifications)
├── validations/        # Zod schemas for request validation
└── index.ts            # Application entry point
```

## 🛠️ Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed.
- [PostgreSQL](https://www.postgresql.org/) database.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/shadinmd/scrip-backend.git
   cd scrip-backend
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

### Configuration
Create a `.env` file in the root directory and add the following variables:
```env
PORT=8000
DATABASE_URL=postgres://user:password@localhost:5432/scrip
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Database Setup
1. Run migrations to set up the database schema:
   ```bash
   bun run migration:run
   ```
2. (Optional) Seed initial data:
   ```bash
   bun run seed:categories
   ```

### Running the App
- **Development Mode:**
  ```bash
  bun run dev
  ```
- **Production Mode:**
  ```bash
  bun run index.ts
  ```

## 📜 Available Scripts
- `bun run dev`: Starts the server in watch mode.
- `bun run migration:generate`: Generates a new migration based on entity changes.
- `bun run migration:run`: Executes pending migrations.
- `bun run seed:categories`: Seeds default categories.
- `bun run seed:test-data`: Seeds data for testing.
- `bun run db:clear`: Clears all data from the database.

## 📡 API Endpoints (Brief)
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Authenticate user and get tokens.
- `GET /api/accounts`: List user accounts.
- `POST /api/transactions`: Create a new transaction.
- `GET /api/loans`: Manage and track loans.
- `GET /api/categories`: Fetch transaction categories.
