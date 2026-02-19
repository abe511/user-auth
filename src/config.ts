type Config = {
    NODE_ENV: "development" | "production" | "test",
    HOST: string,
    PORT: number,
    DATABASE_URL: string,
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
};