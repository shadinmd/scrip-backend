import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source";
import { Category } from "../entity/category.entity";
import { getPaginationMetadata } from "../utils/pagination";

const categoryRepository = AppDataSource.getRepository(Category);

export const getCategories = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [categories, total] = await categoryRepository.findAndCount({
      skip,
      take: limit,
      order: { name: "ASC" },
    });

    const metadata = getPaginationMetadata(total, page, limit);

    res.json({
      data: categories,
      metadata,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const getCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const category = await categoryRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const existingCategory = await categoryRepository.findOne({
      where: { name },
    });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = categoryRepository.create({ name });
    await categoryRepository.save(category);

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name } = req.body;

    const category = await categoryRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      const existingCategory = await categoryRepository.findOne({
        where: { name },
      });
      if (existingCategory && existingCategory.id !== parseInt(id)) {
        return res
          .status(400)
          .json({ message: "Category name already exists" });
      }
      category.name = name;
    }

    await categoryRepository.save(category);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const category = await categoryRepository.findOne({
      where: { id: parseInt(id) },
    });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await categoryRepository.remove(category);
    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};
