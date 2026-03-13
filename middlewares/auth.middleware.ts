import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/user.entity";

const userRepository = AppDataSource.getRepository(User);

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header required" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token required" });
    }

    const payload = verifyAccessToken(token);

    const user = await userRepository.findOne({
      where: { id: payload.userId },
      select: [
        "id",
        "username",
        "email",
        "tokenVersion",
        "createdAt",
        "updatedAt",
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
