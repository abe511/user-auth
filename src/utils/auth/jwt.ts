import jwt from "jsonwebtoken";
import { UUID } from "node:crypto";
import { config } from "../../config";

export const generateTokens = (user: {id: UUID, role: string}) => {
    const accessToken = jwt.sign(user, config.JWT_ACCESS_SECRET, {expiresIn: config.JWT_ACCESS_DURATION});
    const refreshToken = jwt.sign({id: user.id}, config.JWT_REFRESH_SECRET, {expiresIn: config.JWT_REFRESH_DURATION});
    return {accessToken, refreshToken};
};