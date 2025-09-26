import { uploadOnCloudinary } from "../config/cloudinary.js";
import geminiResponse from "../gemini.js";
import User from "../models/user.model.js";
import moment from "moment";

// ✅ Get Current User
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "User error" });
  }
};

// ✅ Update Assistant (name & image)
export const updateAssistant = async (req, res) => {
  try {
    const { assistantName, imageUrl } = req.body;

    let assistantImage;
    if (req.file) {
      assistantImage = await uploadOnCloudinary(req.file.path);
    } else {
      assistantImage = imageUrl;
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { assistantImage, assistantName },
      { new: true }
    ).select("-password");

    return res.status(200).json(user);
  } catch (error) {
    return res.status(400).json({ message: "Update error" });
  }
};

// ✅ Virtual Assistant Route
export const askToAssistant = async (req, res) => {
  try {
    const { command } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ response: "User not found" });
    }

    const userName = user.name;
    const assistantName = user.assistantName;

    // Build conversation history
    const historyText = user.history
      .map((h) => `User: ${h.userInput}\nAI: ${h.aiResponse}`)
      .join("\n");

    const prompt = `
    Tum ek friendly aur helpful AI ho jiska naam ${assistantName} hai. 
    Tum ${userName} ke saath baatcheet kar rahe ho. Ye ab tak ka conversation hai:

    ${historyText}

    User: ${command}
    AI:
    `;

    const result = await geminiResponse(prompt, assistantName, userName);

    const jsonMatch = result.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      return res.status(400).json({ response: "Sorry, I can't Understand" });
    }

    const gemResult = JSON.parse(jsonMatch[0]);
    const type = gemResult.type;
    const followUp = gemResult.followUp || "";

    let finalResponse;
    switch (type) {
      case "get_date":
        finalResponse = `Current date is ${moment().format("YYYY-MM-DD")}`;
        break;
      case "get_time":
        finalResponse = `Current time is ${moment().format("hh:mm A")}`;
        break;
      case "get_day":
        finalResponse = `Today is ${moment().format("dddd")}`;
        break;
      case "get_month":
        finalResponse = `Current month is ${moment().format("MMMM")}`;
        break;
      default:
        finalResponse = gemResult.response || "I didn't understand that command";
    }

    // Save history
    const newHistory = {
      userInput: command,
      aiResponse: finalResponse,
      followUp,
      timestamp: new Date()
    };

    user.history.push(newHistory);
    await user.save();

    return res.json({
      type,
      userInput: command,
      response: finalResponse,
      followUp,
      history: user.history
    });
  } catch (error) {
    console.error("askToAssistant error:", error);
    return res.status(500).json({ response: "Ask Assistant Error" });
  }
};

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ response: "User not found" });

    const wantsDetail = /detail|explain|pura|full|vistar/i.test(message);
    const isHinglish =
      /[अ-ह]/.test(message) || /(kaise|kya|tum|hai|ho|acha|bhai)/i.test(message);

    // Include history only for long/detailed replies
    const historyText = wantsDetail
      ? user.chatHistory.map(h => `User: ${h.userInput}\nAI: ${h.aiResponse}`).join("\n")
      : "";

    // Prepare prompt
    const prompt = `
You are a helpful AI Chatbot chatting with ${user.name}.
${wantsDetail ? `Here is the conversation history so far:\n\n${historyText}\n\n` : ""}

Current user message: "${message}"

Rules:
- Reply in the same language as user (English/Hinglish)
- Default: short & simple
- If user requests "detail/full/explain in detail/vistar":
  * Use structured format, headings, subheadings, bullet points
  * For programming concepts, use code blocks (\`\`\`javascript ... \`\`\`)
  * Step-by-step explanation
  * Include real-life examples
- For short replies, return plain text only. If JSON object returned, extract 'response'.
- For long replies, return full explanation as **plain text**, not JSON.
`;

    // Get AI response
    let aiRawResponse = await geminiResponse(prompt, "ChatBot", user.name);
    let finalResponse = "";

    if (wantsDetail) {
      try {
        // Check if AI returned JSON, extract 'response' and any text outside
        const jsonMatch = aiRawResponse.match(/```json([\s\S]*?)```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          let parsedResp = (parsed.response || "").trim();

          // Any text outside JSON
          const outsideText = aiRawResponse.replace(jsonMatch[0], "").trim();

          // Final response is outside text + parsed.response
          finalResponse = (outsideText ? outsideText + "\n\n" : "") + parsedResp;

          // Fallback if empty
          if (!finalResponse || finalResponse.trim() === "") {
            finalResponse = aiRawResponse;
          }
        } else {
          finalResponse = aiRawResponse;
        }
      } catch (err) {
        console.error("JSON parse error:", err);
        finalResponse = aiRawResponse;
      }
    } else {
      // Short reply handling
      try {
        const jsonMatch = aiRawResponse.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          finalResponse = parsed.response || aiRawResponse;
        } else {
          finalResponse = aiRawResponse;
        }
      } catch (err) {
        finalResponse = aiRawResponse;
      }

      // Cleanup repetitive phrases like "ज़रूर"
      finalResponse = finalResponse.replace(/^(ज़रूर[, ]*)+/i, "").trim();

      // Fallback
      if (!finalResponse || finalResponse.trim() === "") {
        finalResponse = isHinglish
          ? "Sorry bhai, samajh nahi aaya."
          : "Sorry, I couldn't understand.";
      }
    }

    // Save response in DB
    user.chatHistory.push({
      userInput: message,
      aiResponse: finalResponse,
      timestamp: new Date(),
    });
    await user.save();

    

    return res.json({
      userInput: message,
      response: finalResponse, // ✅ Always plain text
      history: user.chatHistory,
    });

  } catch (error) {
    console.error("chatWithAI error:", error);
    return res.status(500).json({ response: "Chat AI Error" });
  }
};






// ✅ Clear Assistant History
export const clearAssistantHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.history = [];
    await user.save();

    return res.json({
      success: true,
      message: "Assistant history cleared",
      history: user.history
    });
  } catch (error) {
    console.error("clearAssistantHistory error:", error);
    return res.status(500).json({ success: false, message: "Error clearing history" });
  }
};

// ✅ Clear Chat History
export const clearChatHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    user.chatHistory = [];
    await user.save();

    return res.json({
      success: true,
      message: "Chat history cleared",
      history: user.chatHistory
    });
  } catch (error) {
    console.error("clearChatHistory error:", error);
    return res.status(500).json({ success: false, message: "Error clearing chat history" });
  }
};
