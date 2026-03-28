import cron from "node-cron";
import { AppDataSource } from "../config/data-source";
import { LoanInstallment } from "../entity/loan-installment.entity";
import { sendPushNotification } from "./notifications";
import { formatInTimeZone } from "date-fns-tz";

const TIMEZONE = "Asia/Kolkata";

export const initCronJobs = () => {
  cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("Running daily installment check...");
      await checkDueInstallments();
    },
    {
      timezone: TIMEZONE,
    },
  );
};

export const checkDueInstallments = async () => {
  try {
    const todayStr = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");

    const installmentRepository = AppDataSource.getRepository(LoanInstallment);

    const installments = await installmentRepository.find({
      where: {
        date: todayStr,
        isPaid: false,
      },
      relations: ["loan", "loan.user"],
    });

    console.log(
      `Found ${installments.length} installments due today (${todayStr}).`,
    );

    for (const inst of installments) {
      const user = inst.loan.user;
      if (user && user.fcmToken) {
        try {
          await sendPushNotification({
            to: user.fcmToken,
            title: "Installment Due Today",
            body: `Your installment of ₹${inst.amount} for "${inst.loan.name}" is due today.`,
            data: {
              type: "installment_due",
              loanId: inst.loanId,
              installmentId: inst.id,
            },
          });
          console.log(
            `Notification sent to user ${user.id} for loan ${inst.loanId}`,
          );
        } catch (err) {
          console.error(`Failed to send notification to user ${user.id}:`, err);
        }
      } else {
        console.log(
          `User ${user?.id || "unknown"} has no push token registered. Skipping.`,
        );
      }
    }
  } catch (error) {
    console.error("Error checking due installments:", error);
  }
};
