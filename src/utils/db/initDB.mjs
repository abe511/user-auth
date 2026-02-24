import path from "path";
import { access, constants, readFile } from "fs/promises";
import { Client } from "pg";
import bcrypt from "bcrypt";

export const db = new Client({
    connectionString: process.env.DATABASE_URL,
});

const initializeDB = async (filename) => {
    try {
        // resolve file path, check if it exists and not empty
        const initFilePath = path.resolve(import.meta.dirname, filename);
        await access(initFilePath, constants.F_OK);
        const sql = await readFile(initFilePath, "utf-8");
        if(!sql) {
            throw new Error("DB initialization failed. SQL file is empty");
        }

        // admin creds
        const adminEmail = "admin@domain.com";
        const adminPassword = "password123";
        const hashedPassword = await bcrypt.hash(adminPassword, parseInt(process.env.SALT_ROUNDS));
        
        // initialize the db
        await db.connect();
        console.log("DB connection established");
        
        await db.query(sql);
        
        // add admin
        await db.query(
            `INSERT INTO users (fullname, birthdate, email, password, role) 
            VALUES ('Default Admin', '1901-01-01', $1, $2, 'admin')`,
            [adminEmail, hashedPassword]
        );

        console.log(`DB default user with role *admin* added. Email: ${adminEmail} Password: ${adminPassword}`);
        
        console.log("DB initialized successfully");
    } catch(error) {
        console.error("DB initialization error:", error.message);
        process.exit(1);
    } finally {
        await db.end();
        console.log("DB connection closed");
    }
};

initializeDB("./init.sql");