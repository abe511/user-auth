import { Pool } from "pg";
import { config } from "../../config";

console.log(`DB URL: ${config.DATABASE_URL}`);

export const db = new Pool({
    connectionString: config.DATABASE_URL,
});