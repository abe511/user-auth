import { Router } from "express";
import { getAllUsers, getUserById, blockUserById } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

export const userRouter = Router();

// admins only
userRouter.get("/", authenticate, authorize(["admin"]), getAllUsers);

// admins or self
userRouter.get("/:id", authenticate, getUserById);
userRouter.patch("/:id/block", authenticate, blockUserById);