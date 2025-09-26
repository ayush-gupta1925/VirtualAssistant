import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    assistantName: {
      type: String,
      default: "Assistant"
    },
    assistantImage: {
      type: String,
      default: ""
    },
    history: [
      {
        userInput: String,
        aiResponse: String,
        followUp: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    chatHistory: [
      {
        userInput: String,
        aiResponse: String,
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
