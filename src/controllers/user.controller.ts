import { Request, Response} from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { db } from "../utils/db/db";

// only for admins or current user
export const getUserById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    // admins can read any user data. users can read only their own data.
    if(req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json("Unauthorized action");
    }

    try {
        // get user by id
        const result = await db.query(
            "SELECT * FROM users WHERE id = $1",
            [id]
        );
        if(result.rowCount === 0) {
            return res.status(404).json({message: "User not found"});
        }
        res.json(result.rows[0]);
    } catch (error) {
        res.json({message: "Failed to retrieve user data"});
    }
};

// admins only
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await db.query(
            "SELECT id, fullname, birthdate, email, role, is_active, created_at FROM users"
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({message: "Failed to retrieve users data"});
    }
};

// only for admins and current user
export const blockUserById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // admins can block anyone. users can block themselves only
    if(req.user?.role !== "admin" && req.user?.id !== id) {
        return res.status(403).json({message: "Unauthorized action"});
    }

    try {
        // block only active user and remove their refresh token
        const result = await db.query(
            `UPDATE users SET is_active = $1, refresh_token = $2
            WHERE id = $3 AND is_active = $4
            RETURNING is_active`, [false, null, id, true]);

        // check for multiple calls
        if(result.rowCount === 0) {
            return res.status(404).json({message: "User is already blocked or not found"});
        }
        res.json({message: "User blocked successfully"});
    } catch (error) {
        res.status(500).json({message: "Failed to block user"});
    }
};
