import express from "express";
import { userRouter } from "./routes/user.routes";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json({limit: "123kb"}));

app.get("/", (req, res) => {
    res.send("all ok");
})

app.use("/api/users", express.json({limit: "11kb"}), userRouter);


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})