import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { UUID } from "node:crypto";

export interface AuthRequest extends Request {
    user?: {
        id: UUID,
        role: "admin" | "user",
    },
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]; // split Bearer and <token>
    if(!token) {
        return res.status(401).json({message: "Unauthorized"});
    }

    try {
        const decoded = jwt.verify(token, config.JWT_ACCESS_SECRET) as AuthRequest["user"];
        if(!decoded) {
            return res.status(401).json({message: "Invalid token payload"});
        }
        // add current user id, role to request
        req.user = decoded;
        next();
    } catch(error) {
        return res.status(403).json({message: "Invalid or expired token"});
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        console.log("authorize user:", req.user?.id, req.user?.role);
        if(!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({message: "Forbidden"});
        }
        next();
    };
};