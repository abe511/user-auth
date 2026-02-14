import express from "express";
import { userRouter } from "./routes/user.routes";

const app = express();

const PORT = process.env.POR || 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("all ok");
})

app.use("/api/users", userRouter);


app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})