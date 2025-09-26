



import React, { useContext, useState, useRef, useEffect } from "react";
import { userDataContext } from "../context/UserContext.jsx";
import axios from "axios";
import { RxCross1 } from "react-icons/rx";
import { FaTrash, FaHistory, FaArrowLeft } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { useNavigate } from "react-router-dom";

function Chat() {
  const { serverUrl, userData, setUserData } = useContext(userDataContext);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, loading]);

  const fetchCurrentUser = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/user/current`, {
        withCredentials: true,
      });
      if (res.data) {
        setUserData(res.data);
        setChatHistory(res.data.chatHistory || []);
      }
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    const newUserMessage = {
      userInput: message,
      aiResponse: "",
      timestamp: new Date(),
    };
    setChatHistory([...chatHistory, newUserMessage]);
    setMessage("");

    try {
      setLoading(true);
      const res = await axios.post(
        `${serverUrl}/api/user/chat`,
        { message },
        { withCredentials: true }
      );

      if (res.data?.history) {
        setChatHistory(res.data.history);
        setUserData((prev) => ({ ...prev, chatHistory: res.data.history }));
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      const res = await axios.delete(`${serverUrl}/api/user/clear-chat`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setChatHistory([]);
        setUserData((prev) => ({ ...prev, chatHistory: [] }));
      }
    } catch (err) {
      console.error("Clear chat error:", err);
    }
  };

  // Common Markdown Renderer
  const MarkdownRenderer = ({ content }) => (
    <ReactMarkdown
      components={{
        p: ({ node, ...props }) => (
          <p
            {...props}
            className="break-words whitespace-pre-wrap overflow-hidden"
          />
        ),
        li: ({ node, ...props }) => (
          <li
            {...props}
            className="break-words whitespace-pre-wrap overflow-hidden list-disc ml-5"
          />
        ),
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code
              {...props}
              className="bg-gray-800 text-yellow-300 px-1 py-0.5 rounded"
            />
          ) : (
            <pre className="bg-gray-900 p-2 rounded overflow-x-auto">
              <code {...props} className="text-green-400" />
            </pre>
          ),
      }}
    >
      {content || ""}
    </ReactMarkdown>
  );

  return (
    <div className="w-full h-screen flex justify-center items-center bg-gradient-to-b from-[#0a0a0a] to-[#1e1e2f] text-white">
      {/* Chat Container */}
      <div className="flex flex-col w-full sm:w-full md:w-[90%] lg:w-[70%] h-[90%] bg-[#1a1a2e] rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-2 md:p-4 bg-[#121212] shadow-md relative">
          <button
            className="absolute left-3 sm:left-2 text-white hover:text-yellow-400"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft size={20} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>
          <h1 className="text-xl sm:text-lg md:text-2xl lg:text-3xl font-bold text-yellow-400 mx-auto">
            AI Chat
          </h1>
          <div className="flex gap-3 sm:gap-2">
            <FaHistory
              className="text-[20px] sm:text-[18px] md:text-[22px] lg:text-[24px] cursor-pointer hover:text-yellow-400"
              onClick={() => setShowHistory(!showHistory)}
            />
            <FaTrash
              className="text-[20px] sm:text-[18px] md:text-[22px] lg:text-[24px] cursor-pointer hover:text-red-500"
              onClick={handleClear}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-2 md:p-6 flex flex-col gap-3 sm:gap-2 md:gap-4 text-sm sm:text-xs md:text-base">
          {chatHistory.length === 0 && (
            <p className="text-gray-400 text-center text-base sm:text-sm md:text-lg">
              Start chatting with AI...
            </p>
          )}
          {chatHistory.map((chat, index) => (
            <div key={index} className="flex flex-col gap-2">
              {/* User Message */}
              {chat.userInput && (
                <div className="self-end bg-[#007bff] text-white px-3 py-2 sm:px-2 sm:py-1 md:px-5 md:py-3 rounded-2xl shadow-md max-w-[85%] break-words whitespace-pre-wrap overflow-hidden">
                  {chat.userInput}
                </div>
              )}

              {/* AI Response */}
              <div className="self-start bg-[#33337e] text-white px-3 py-2 sm:px-2 sm:py-1 md:px-5 md:py-3 rounded-2xl shadow-md max-w-[85%] sm:max-w-[90%] md:max-w-[80%] break-words whitespace-pre-wrap overflow-hidden">
                {loading && index === chatHistory.length - 1 ? (
                  <div className="flex items-center gap-2 w-full h-6">
                    <div className="w-5 h-5 sm:w-4 sm:h-4 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <p className="ml-1 text-yellow-300 animate-pulse text-xs sm:text-[10px] md:text-sm">
                      AI is typing...
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-base sm:text-sm md:text-lg font-bold text-yellow-300 mb-1">
                      AI Response:
                    </h2>
                    <MarkdownRenderer content={chat.aiResponse} />
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-2 sm:p-2 md:p-4 flex gap-2 border-t border-gray-700 bg-[#121212]">
          <input
            type="text"
            className="flex-1 px-3 py-2 sm:px-2 sm:py-1 md:px-4 md:py-3 rounded-lg bg-[#2a2a40] text-white outline-none text-sm sm:text-xs md:text-lg"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            className="px-3 py-2 sm:px-2 sm:py-1 md:px-6 md:py-3 bg-[#28a745] rounded-lg font-semibold hover:bg-[#1d7a32] text-sm sm:text-xs md:text-lg"
            onClick={handleSend}
          >
            Send
          </button>
        </div>
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="absolute top-0 right-0 w-full sm:w-[90%] md:w-[350px] h-full bg-[#1c1c2e] shadow-xl p-4 overflow-y-auto pb-20 transition-transform">
          <RxCross1
            className="absolute top-4 right-4 text-white cursor-pointer hover:text-red-500"
            onClick={() => setShowHistory(false)}
          />
          <h2 className="text-lg sm:text-base md:text-2xl font-semibold mb-4 text-yellow-400">
            Chat History
          </h2>
          {chatHistory.map((his, i) => (
            <div
              key={i}
              className="bg-[#2a2a40] rounded-lg p-3 sm:p-2 md:p-4 mb-3 flex flex-col gap-2 break-words whitespace-pre-wrap overflow-hidden"
            >
              <p className="text-yellow-400 font-medium">🧑 {his.userInput}</p>
              <div className="bg-[#33337e] text-white px-3 py-2 rounded-2xl shadow-md break-words whitespace-pre-wrap overflow-hidden">
                <h3 className="text-sm sm:text-xs md:text-base font-bold text-yellow-300 mb-1">
                  🤖 AI Response:
                </h3>
                <MarkdownRenderer content={his.aiResponse} />
              </div>
              <p className="text-gray-400 text-xs sm:text-[10px] md:text-sm self-end">
                {new Date(his.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          {chatHistory.length === 0 && (
            <p className="text-gray-400">No history available</p>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;
