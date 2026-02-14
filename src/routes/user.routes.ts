import { Router } from "express";
import { getAllUsers, getUserById, createUser, updateUser, deleteUser } from "../controllers/user.controller";

export const userRouter = Router();

userRouter.get("/", getAllUsers);
userRouter.get("/:id", getUserById);
userRouter.post("/:id", createUser);
userRouter.put("/:id", updateUser);
userRouter.delete("/:id", deleteUser);