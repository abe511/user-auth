import { Router } from "express";
import { login, logout, refresh, register } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

export const authRouter = Router();

// public routes
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);

// protected route
authRouter.post("/logout", authenticate, logout);