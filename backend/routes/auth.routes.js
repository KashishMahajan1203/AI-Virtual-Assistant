import express from "express";
import {
    login,
    logOut,
    signUp,
} from "../controllers/auth.controllers.js";

const authRouter = express.Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", login);
authRouter.post("/logout", logOut);

export default authRouter;