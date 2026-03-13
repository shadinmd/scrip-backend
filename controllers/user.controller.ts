import type { Request, Response } from "express";

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
