import { Request, Response} from "express";
import bcrypt from "bcrypt";
import { db } from "../utils/db/db";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthRequest } from "../middleware/auth.middleware";
import { generateTokens } from "../utils/auth/jwt";


export const register = async (req: Request, res: Response) => {
    const { fullname, birthdate, email, password } = req.body;
    try {
        // check if email is already used
        const userExists = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        if(userExists.rowCount !== 0) {
            return res.status(409).json({message: "User already exists"});
        }

        // create a user with a hashed password
        const hashedPassword = await bcrypt.hash(password, config.SALT_ROUNDS);

        await db.query("BEGIN");

        const result = await db.query(
            `INSERT INTO users (fullname, birthdate, email, password) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, fullname, birthdate, email, role, is_active, created_at`,
            [fullname, birthdate, email, hashedPassword]
        );

        const newUser = result.rows[0];
        // create new tokens and write the refresh token to the db 
        const tokens = generateTokens({id: newUser.id, role: newUser.role});
        await db.query(
            "UPDATE users SET refresh_token = $1 WHERE id = $2",
            [tokens.refreshToken, newUser.id]
        );

        await db.query("COMMIT");

        // include refresh token in cookie
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true, // inaccessible for scripts on the client
            secure: config.NODE_ENV === "production", // if no SSL in 'development' mode
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // include new user data and access token for client API calls
        res.status(201).json({  
            message: "User created successfully",
            accessToken: tokens.accessToken,
            user: newUser,
        });

    } catch (error) {
        await db.query("ROLLBACK");
        res.status(500).json({message: "Registration failed"});
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // validate user input here
    try {
        // find user by email
        const result = await db.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );
        const user = result.rows[0];

        // check if user exists and hashed passwords match
        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        if(!user.is_active) {
            return res.status(403).json({message: "Account is blocked"});
        }
        // create new tokens and update the db with the new refresh token 
        const tokens = generateTokens({id: user.id, role: user.role});
        await db.query(
            "UPDATE users SET refresh_token = $1 WHERE id = $2",
            [tokens.refreshToken, user.id]
        );

        // include refresh token in cookie
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true, // inaccessible for scripts on the client
            secure: config.NODE_ENV === "production", // if no SSL in 'development' mode
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({accessToken: tokens.accessToken});
    } catch (error) {
        res.status(401).json({message: "Failed to log in"});
    }
};


export const refresh = async (req: AuthRequest, res: Response) => {
    // get the refresh token from the HttpOnly cookie
    const { refreshToken: oldToken} = req.cookies;

    if(!oldToken) {
        return res.status(401).json({message: "No refresh token provided"});
    }

    try {
        // cryptographically check provided refresh token against the refresh secret
        const decoded = jwt.verify(oldToken, config.JWT_REFRESH_SECRET) as AuthRequest["user"];

        // look up the user
        const result = await db.query(
            "SELECT * FROM users WHERE id = $1",
            [decoded?.id]
        );

        const user = result.rows[0];

        // token reuse detection logic
        if(!user || user.refresh_token !== oldToken) {
            // the old token is valid but does not match the db. token reuse detected!
            // clear refresh token in the db and cookie on the client
            await db.query(
                "UPDATE users SET refresh_token = NULL WHERE id = $1",
                [decoded?.id]
            );

            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: config.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            return res.status(403).json({message: "Session compromised. Please login again."})
        }

        
        // create new tokens and update the db with the new refresh token 
        const {accessToken, refreshToken: newToken} = generateTokens({id: user.id, role: user.role});
        await db.query(
            "UPDATE users SET refresh_token = $1 WHERE id = $2",
            [newToken, user.id]
        );

        res.cookie("refreshToken", newToken, {
            httpOnly: true, // inaccessible for scripts on the client
            secure: config.NODE_ENV === "production", // if no SSL in 'development' mode
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({accessToken});
    } catch (error) {
        res.status(403).json({message: "Token verification failed"});
    }
};


export const logout = async (req: AuthRequest, res: Response) => {
    try {
        // remove refresh token of current user and clear the cookie
        await db.query(
            "UPDATE users SET refresh_token = NULL WHERE id = $1",
            [req.user?.id]
        );

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.json({message: "Logged out"});
    } catch (error) {
        res.status(500).json({message: "Failed to log out"});
    }
};
