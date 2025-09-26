import express from "express";
import {
  askToAssistant,
  chatWithAI,
  clearAssistantHistory,
  clearChatHistory,
  getCurrentUser,
  updateAssistant
} from "../controllers/user.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// ✅ User Routes
userRouter.get("/current", isAuth, getCurrentUser);
userRouter.post("/update", isAuth, upload.single("assistantImage"), updateAssistant);

// ✅ Virtual Assistant Routes
userRouter.post("/asktoassistant", isAuth, askToAssistant);
userRouter.delete("/clear-assistant", isAuth, clearAssistantHistory);

// ✅ Chat Page Routes
userRouter.post("/chat", isAuth, chatWithAI);
userRouter.delete("/clear-chat", isAuth, clearChatHistory);

export default userRouter;
