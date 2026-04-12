import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/user.entity";
import { sendPushNotification } from "../utils/notifications";

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateFcmToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.fcmToken = token;
    await userRepository.save(user);

    res.json({ message: "Push token updated successfully" });
  } catch (error) {
    console.error("Error updating Push token:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const testNotification = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: req.user.id });

    if (!user || !user.fcmToken) {
      return res
        .status(400)
        .json({ message: "User has no push token registered" });
    }

    const result = await sendPushNotification({
      to: user.fcmToken,
      title: "Test Notification",
      body: "This is a test notification from Scrip backend!",
      data: { test: true },
    });

    res.json({ message: "Notification sent", result });
  } catch (error) {
    console.error("Error sending test notification:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};
