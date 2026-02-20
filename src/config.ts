type Config = {
    NODE_ENV: "development" | "production" | "test",
    HOST: string,
    PORT: number,
    DATABASE_URL: string,
    JWT_ACCESS_SECRET: string,
    JWT_REFRESH_SECRET: string,
    JWT_ACCESS_DURATION: any,
    JWT_REFRESH_DURATION: any,
    SALT_ROUNDS: number,
};

const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if(!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }
    
    return value;
};

export const config: Config = {
    NODE_ENV: getEnv("NODE_ENV", "development") as Config["NODE_ENV"],
    HOST: getEnv("HOST", "http://localhost"),
    PORT: parseInt(getEnv("PORT", "3000")),
    DATABASE_URL: getEnv("DATABASE_URL"),
    JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET", "default_access_secret"),
    JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET", "default_refresh_secret"),
    JWT_ACCESS_DURATION: getEnv("JWT_ACCESS_DURATION", "15m"),
    JWT_REFRESH_DURATION: getEnv("JWT_REFRESH_DURATION", "7d"),
    SALT_ROUNDS: parseInt(getEnv("SALT_ROUNDS", "10")),
};