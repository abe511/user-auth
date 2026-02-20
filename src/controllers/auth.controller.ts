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
        if(userExists.rows.length > 0) {
            return res.status(400).json({message: "User already exists"});
        }

        // create a user with a hashed password
        const hashedPassword = await bcrypt.hash(password, config.SALT_ROUNDS);
        
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
        
        // include refresh token in cookie
        res.cookie("refreshToken", tokens.refreshToken, {
            httpOnly: true, // inaccessible for scripts on the client
            secure: config.NODE_ENV === "production", // if no SSL in 'development' mode
            sameSite: true,
            // path: "/refresh", // browser sends cookie only to this path
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // include new user data and access token for client API calls
        res.status(201).json({  
            message: "User created successfully",
            accessToken: tokens.accessToken,
            user: newUser,
        });

    } catch (error) {
        res.status(500).json({message: "Failed to create a user"});
    }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    // validate user input here

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
        sameSite: true,
        // path: "/refresh", // browser sends cookie only to this path
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({accessToken: tokens.accessToken});
};


export const refresh = async (req: AuthRequest, res: Response) => {
    // get the refresh token from the HttpOnly cookie
    const { refreshToken: oldToken} = req.cookies;

    if(!oldToken) {
        return res.status(401).json({message: "No refresh token provided"});
    }

    try {
        // check provided refresh token against the refresh secret
        const decoded = jwt.verify(oldToken, config.JWT_REFRESH_SECRET) as AuthRequest["user"];

        // lookup the old token and check if that token still valid
        const result = await db.query(
            "SELECT id, role FROM users WHERE id = $1 AND refresh_token = $2",
            [decoded?.id, oldToken]
        );

        // potential refresh token theft
        if(result.rowCount === 0) {
            return res.status(403).json({message: "Invalid or revoked refresh token"});
        }

        const user = result.rows[0];
        
        // create new tokens and update the db with the new refresh token 
        const {accessToken, refreshToken: newToken} = generateTokens({id: user.id, role: user.role});
        await db.query(
            "UPDATE users SET refresh_token = $1 WHERE id = $2",
            [newToken, user.id]
        );

        res.cookie("refreshToken", newToken, {
            httpOnly: true, // inaccessible for scripts on the client
            secure: config.NODE_ENV === "production", // if no SSL in 'development' mode
            sameSite: true,
            path: "/refresh", // browser sends cookie only to this path
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({accessToken});
    } catch (error) {
        res.status(403).json({message: "Token verification failed"});
    }
};


export const logout = async (req: AuthRequest, res: Response) => {
    try {
        // remove refresh token of current user
        await db.query(
            "UPDATE users SET refresh_token = NULL WHERE id = $1",
            [req.user?.id]
        );
        res.json({message: "Logged out"});
    } catch (error) {
        res.status(500).json({message: "Failed to log out"});
    }
};
