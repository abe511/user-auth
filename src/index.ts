import express from "express";
import { userRouter } from "./routes/user.routes";
import { config } from "./config";

const app = express();

app.use(express.json({limit: "123kb"}));

app.get("/", (req, res) => {
    res.send("all ok");
})

app.use("/api/users", express.json({limit: "11kb"}), userRouter);

app.listen(config.PORT, () => {
    console.log(`Server running in *${config.NODE_ENV}* mode on ${config.HOST}:${config.PORT}`);
});