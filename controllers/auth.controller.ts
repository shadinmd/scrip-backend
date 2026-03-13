import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { User } from "../entity/user.entity";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const userRepository = AppDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = userRepository.create({
      username,
      email,
      password: hashedPassword,
    });

    await userRepository.save(user);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await userRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const accessToken = signAccessToken({ userId: user.id });
    const newRefreshToken = signRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const revoke = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.tokenVersion += 1;
    await userRepository.save(user);

    res.json({ message: "Tokens revoked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
