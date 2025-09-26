import React, { useContext, useEffect, useRef, useState } from "react";
import { userDataContext } from "../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { HiBars3BottomRight } from "react-icons/hi2";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif";
import { MdDataUsage } from "react-icons/md";
import aiImg from "../assets/ai.gif";
// import communicate from "../assets/ai.png";
import communicate from "../assets/a11.jpg";
import { TbMessageChatbot } from "react-icons/tb";
import { TbMessageChatbotFilled } from "react-icons/tb";
function Home() {
  const { serverUrl, userData, setUserData, getGeminiResponse } =
    useContext(userDataContext);
  const [listening, setListening] = useState(false);
  const isSpeakingRef = useRef(false); // true while TTS playing
  const isRecongnizingRef = useRef(false); // true while recognition active
  const expectingUserReplyRef = useRef(false);
  const recognitionRef = useRef(null);

  const [userText, setUserText] = useState("");
  const [aiText, setAiText] = useState("");
  const [conversationMode, setConversationMode] = useState(false);
  const [ham, setHam] = useState("");
  const [ham2, setHam2] = useState(false);
  const [hover, setHover] = useState(false);
  // track last AI-spoken text (best-effort filter) and ignore-until timestamp
  const lastAiSpokenRef = useRef("");
  const ignoreUntilRef = useRef(0); // ms timestamp until which recognition results are ignored

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, {
        withCredentials: true
      });
      setUserData(null);
      navigate("/signin");
    } catch (error) {
      setUserData(null);
      console.log(error);
    }
  };

  const startRecongnition = () => {
    // only start if not speaking and not already recognizing
    if (isSpeakingRef.current) {
      console.log("Won't start recognition while speaking.");
      return;
    }
    if (!isRecongnizingRef.current) {
      try {
        recognitionRef.current?.start();
        console.log("recognition start request");
      } catch (error) {
        if (error.name !== "InvalidStateError") {
          console.log("recognition start error", error);
        }
      }
    }
  };

  // central speak function
  const speak = (text, followUp = null) => {
    if (!text) {
      if (followUp) {
        speak(followUp, null);
      } else {
        setTimeout(() => startRecongnition(), 400);
      }
      return;
    }

    // stop recognition before TTS (best-effort)
    try {
      recognitionRef.current?.stop();
    } catch (e) {}

    // mark speaking state & ignore short window after TTS so recognition doesn't pick TTS
    isSpeakingRef.current = true;
    lastAiSpokenRef.current = text;
    ignoreUntilRef.current = Date.now() + 1500; // ignore next 1.5s results (adjustable)
    setListening(false);

    setAiText(text);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN";

    const voices = window.speechSynthesis.getVoices
      ? window.speechSynthesis.getVoices()
      : [];
    const hindiVoice = voices.find((v) => v.lang === "hi-IN");
    if (hindiVoice) utterance.voice = hindiVoice;

    utterance.onend = () => {
      // main TTS finished
      isSpeakingRef.current = false;

      // if followUp and conversationMode ON => speak followUp next
      if (followUp && conversationMode) {
        // small gap before follow-up
        setTimeout(() => {
          // mark follow-up as last spoken and set ignore window again
          lastAiSpokenRef.current = followUp;
          ignoreUntilRef.current = Date.now() + 1500;
          isSpeakingRef.current = true;
          setAiText(followUp);

          const fUtter = new SpeechSynthesisUtterance(followUp);
          fUtter.lang = "hi-IN";
          if (hindiVoice) fUtter.voice = hindiVoice;

          fUtter.onend = () => {
            isSpeakingRef.current = false;
            // keep follow-up text briefly then clear
            setTimeout(() => {
              setAiText("");
              // now accept user's reply without assistant name (since conversation mode)
              expectingUserReplyRef.current = true;
              // allow recognition after a short gap
              setTimeout(() => {
                ignoreUntilRef.current = Date.now() + 250; // small guard
                startRecongnition();
              }, 200);
            }, 1000); // aiText visible for 1s
          };

          try {
            synth.speak(fUtter);
          } catch (e) {
            console.log("followUp speak error", e);
            isSpeakingRef.current = false;
            setAiText("");
            startRecongnition();
          }
        }, 300);
      } else {
        // no follow-up or conversation mode off
        setTimeout(() => {
          setAiText("");
          expectingUserReplyRef.current = false;
          // small guard before starting recognition
          ignoreUntilRef.current = Date.now() + 250;
          startRecongnition();
        }, 1000); // show aiText for 1s then clear
      }
    };

    try {
      synth.cancel();
      synth.speak(utterance);
    } catch (e) {
      console.log("speak error", e);
      isSpeakingRef.current = false;
      setAiText("");
      // recover: permit recognition after short delay
      setTimeout(() => {
        ignoreUntilRef.current = Date.now() + 250;
        startRecongnition();
      }, 500);
    }
  };

  const handleCommand = (data, originalTranscript = "") => {
    if (!data) return;
    // allow both key casings from backend
    const type = data.type;
    const userInput =
      data.userInput ?? data.userinput ?? originalTranscript ?? "";
    const response = data.response ?? data.reply ?? "";
    const followUp = data.followUp ?? data.followup ?? "";
    const history = data.history;

    if (history) {
      setUserData((prev) => ({ ...prev, history }));
    }

    // If conversationMode ON -> allow followUp chaining. Else only single response.
    if (conversationMode && followUp) {
      speak(response, followUp);
    } else {
      speak(response, null);
    }

    console.log("AI response:", response, "followUp:", followUp);

    // Action handlers
    if (type === "google_search") {
      const query = encodeURIComponent(userInput || originalTranscript);
      window.open(`https://www.google.com/search?q=${query}`, "_blank");
      return;
    }

    if (type === "calculator_open") {
      window.open(`https://www.google.com/search?q=calculator`, "_blank");
      return;
    }

    if (type === "instagram_open") {
      window.open(`https://www.instagram.com/`, "_blank");
      return;
    }

    if (type === "facebook_open") {
      window.open(`https://www.facebook.com/`, "_blank");
      return;
    }

    if (type === "weather-show") {
      window.open(`https://www.google.com/search?q=weather`, "_blank");
      return;
    }

    if (type === "youtube_search" || type === "youtube_play") {
      const q = encodeURIComponent(userInput || originalTranscript);
      window.open(
        `https://www.youtube.com/results?search_query=${q}`,
        "_blank"
      );
      return;
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognitionRef.current = recognition;

    let isMounted = true;

    // Greeting utterance
    const hours = new Date().getHours();
    let timeGreeting = "Hello";
    if (hours < 12) timeGreeting = "Good morning";
    else if (hours < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const greeting = new SpeechSynthesisUtterance(
      `${timeGreeting} ${userData?.name || ""}, I'm ${
        userData?.assistantName || "Assistant"
      }. How can I help you today?`
    );
    greeting.lang = "hi-IN";

    greeting.onend = () => {
      // After greeting finished, allow recognition to start (guarded by isSpeakingRef)
      isSpeakingRef.current = false;
      ignoreUntilRef.current = Date.now() + 250;
      setTimeout(() => startRecongnition(), 300);
    };

    // ensure recognition stopped while greeting plays
    try {
      recognition.stop();
    } catch (e) {}
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(greeting);
      isSpeakingRef.current = true;
      // mark lastAi to avoid immediate pickup
      lastAiSpokenRef.current = greeting.text || "";
      ignoreUntilRef.current = Date.now() + 1200;
    } catch (e) {
      console.log("greeting speak error", e);
      isSpeakingRef.current = false;
    }

    recognition.onstart = () => {
      isRecongnizingRef.current = true;
      setListening(true);
    };

    recognition.onend = () => {
      isRecongnizingRef.current = false;
      setListening(false);
      // if not speaking, try to restart recognition after short delay
      if (isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
            } catch (err) {
              if (err.name !== "InvalidStateError") console.log(err);
            }
          }
        }, 700);
      }
    };

    recognition.onerror = (event) => {
      isRecongnizingRef.current = false;
      setListening(false);
      if (event.error !== "aborted" && isMounted && !isSpeakingRef.current) {
        setTimeout(() => {
          if (isMounted) {
            try {
              recognition.start();
            } catch (err) {
              if (err.name !== "InvalidStateError") console.log(err);
            }
          }
        }, 800);
      }
    };

    recognition.onresult = async (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      console.log("Heard:", transcript);

      // Ignore if within ignore window (to avoid picking TTS)
      if (Date.now() < (ignoreUntilRef.current || 0)) {
        console.log("Ignored (within guard window):", transcript);
        return;
      }

      // If currently speaking, ignore
      if (isSpeakingRef.current) {
        console.log("Ignored (is speaking):", transcript);
        return;
      }

      // If transcript resembles last AI-spoken string, ignore
      const lastAi = (lastAiSpokenRef.current || "").toLowerCase().trim();
      const tLower = transcript.toLowerCase();
      if (
        lastAi &&
        (tLower === lastAi ||
          lastAi.includes(tLower) ||
          tLower.includes(lastAi))
      ) {
        console.log("Ignored (matches last AI):", transcript);
        return;
      }

      // If conversationMode is ON => accept ANY speech as command/reply
      if (conversationMode) {
        // If we were expecting a reply because of followUp, accept it
        expectingUserReplyRef.current = false;
        setUserText(transcript);
        try {
          recognition.stop();
        } catch (err) {}
        isRecongnizingRef.current = false;
        setListening(false);

        try {
          const data = await getGeminiResponse(transcript);
          handleCommand(data, transcript);
          setUserText("");
        } catch (err) {
          console.log("Error getting response:", err);
          setTimeout(() => {
            ignoreUntilRef.current = Date.now() + 200;
            startRecongnition();
          }, 500);
        }
        return;
      }

      // conversationMode is OFF -> only react if assistant name present in transcript
      const assistantName = (userData?.assistantName || "").toLowerCase();
      if (assistantName && transcript.toLowerCase().includes(assistantName)) {
        // normal invocation
        setUserText(transcript);
        try {
          recognition.stop();
        } catch (err) {}
        isRecongnizingRef.current = false;
        setListening(false);

        try {
          const data = await getGeminiResponse(transcript);
          handleCommand(data, transcript);
          setUserText("");
        } catch (err) {
          console.log("getGeminiResponse error", err);
          setTimeout(() => {
            ignoreUntilRef.current = Date.now() + 200;
            startRecongnition();
          }, 500);
        }
      } else {
        // ignore ambient speech when not in conversation mode
        console.log("Ignored (not for assistant):", transcript);
      }
    };

    return () => {
      isMounted = false;
      try {
        recognition.stop();
      } catch (e) {}
      setListening(false);
      isRecongnizingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.assistantName, conversationMode]);

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[#000000] to-[#030353] flex justify-center items-center flex-col gap-[15px] relative overflow-hidden">
      <HiBars3BottomRight
        className="lg:hidden text-[white] absolute top-[20px] right-[20px] h-[35px] w-[35px] cursor-pointer "
        onClick={() => setHam(true)}
      />

      <div
        className={`absolute lg:hidden top-0 w-full h-full bg-[#00000041] backdrop-blur-lg flex flex-col justify-start items-start  p-[20px] gap-[20px] ${
          ham ? "translate-x-0" : "translate-x-full"
        } transition-transform`}
      >
        <RxCross1
          className="text-[white] absolute top-[20px] right-[20px] h-[25px] w-[25px] cursor-pointer"
          onClick={() => setHam(false)}
        />

        <button
          className="w-[260px] h-[50px] outline-none border-2 rounded-full border-white px-[20px] py-[8px]   text-[18px]  text-[#121213] placeholder-gray-300 bg-[#e89e28] cursor-pointer  a hover:bg-[#8bd524] "
          onClick={() => {
            navigate("/customize");
          }}
        >
          Customize your Assistant
        </button>


<button
      className="w-[55px] h-[55px] flex items-center justify-center  border-2 rounded-full border-white  text-[#3c3ce0] bg-[#e89e28] cursor-pointer transition-colors duration-300 hover:bg-[#8bd524]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate("/chat")}
    >
      {hover ? <TbMessageChatbotFilled size={24} /> : <TbMessageChatbot size={24} />}
    
    </button>


        <button
          className="w-[100px] h-[50px] outline-none border-2 rounded-full border-white px-[20px] py-[8px]   text-[18px]  text-[#121213] placeholder-gray-300 bg-[#e89e28] cursor-pointer   hover:bg-[#8bd524] "
          onClick={handleLogout}
        >
          Logout
        </button>
        <div className=" w-full h-[2px] bg-gray-400"></div>

        <div className="w-full flex justify-center">
          <h1 className="text-white font-semibold text-[28px]">History</h1>
        </div>

        <div className="w-full flex justify-end">
          <button
            className="w-[100px] h-[40px] outline-none border-2 rounded-full border-white px-[15px] py-[5px] text-[18px] text-[#121213] bg-[#ff4d4d] hover:bg-[#ff1a1a] cursor-pointer"
            onClick={async () => {
              try {
                const res = await axios.delete(`${serverUrl}/api/user/clear-assistant`, {
                  withCredentials: true
                });
                if (res.data.success) {
                  setUserData((prev) => ({ ...prev, history: [] }));
                }
              } catch (error) {
                console.log(error);
              }
            }}
          >
            Clear History
          </button>
        </div>

        <div className="w-full h-[400px] overflow-y-auto flex flex-col gap-[20px] pb-[20px] pr-[10px]">
          {userData.history?.map((his, index) => (
            <div
              key={index}
              className="text-gray-300 text-[16px] border-b border-gray-500 pb-2 flex flex-col gap-1 bg-[#33337e] rounded-lg p-[10px]"
            >
              <p className="text-yellow-400 text-[18px]">
                🧑 You: {his.userInput}
              </p>
              <p className="text-green-400   text-[18px]">
                🤖 AI: {his.aiResponse}
              </p>
              <p className="text-gray-400 text-[14px] self-end mt-[8px] mr-[5px]  ">
                {new Date(his.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="hidden lg:block w-[50px] h-[50px] outline-none border-2 rounded-full border-white pl-[9px] pt-[9px]  text-[18px]  text-[#121213] placeholder-gray-300 bg-[#e89e28] cursor-pointer  mt-[30px] absolute top-[0px] right-[20px] hover:bg-[#8bd524]"
        onClick={() => setHam2(true)}
      >
        <MdDataUsage className="w-[30px] h-[30px] text-[blue]" />
      </div>

      <button
        className="w-[260px] h-[50px] outline-none border-2 rounded-full border-white px-[20px] py-[8px]   text-[18px]  text-[#121213] placeholder-gray-300 bg-[#e89e28] cursor-pointer  mt-[30px] absolute top-[60px] right-[20px] hover:bg-[#8bd524] hidden lg:block"
        onClick={() => {
          navigate("/customize");
        }}
      >
        Customize your Assistant
      </button>
      



 <button
      className={`w-[50px] h-[50px] rounded-full  items-center justify-center text-white text-2xl pl-[11px] pt-[5px]  cursor-pointer 
                 bg-[#e89e28] absolute top-[150px] right-[20px] 
                 hover:bg-[#8bd524] transition-colors duration-300
                 lg:block hidden`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate("/chat")}
    >
      {hover ? <TbMessageChatbotFilled className="text-[28px]" /> : <TbMessageChatbot  className="text-[28px]" />}
    </button>





      <button
        className="w-[100px] h-[50px] outline-none border-2 rounded-full border-white px-[20px] py-[8px]   text-[18px]  text-[#121213] placeholder-gray-300 bg-[#e89e28] cursor-pointer  mt-[30px] absolute top-[180px] right-[20px] hover:bg-[#8bd524] hidden lg:block"
        onClick={handleLogout}
      >
        Logout
      </button>

      {/* <button
        className="w-[200px] h-[50px]  rounded-full bg-[#28a745] text-[#161618] text-lg font-semibold hover:bg-[#05691c] cursor-pointer"
        onClick={() =>
          setConversationMode((prev) => {
            const newMode = !prev;
            // reset expecting reply when toggling
            expectingUserReplyRef.current = false;
            // if enabling conversation mode, ensure recognition starts to accept free speech
            if (!prev) {
              setTimeout(() => startRecongnition(), 300);
            }
            return newMode;
          })
        }
      >
        {conversationMode ? "Stop Communicate" : "Communicate"}
      </button> */}



{/* <button
  className="w-[200px] h-[50px] rounded-full bg-[#007bff] text-white text-lg font-semibold hover:bg-[#0056b3] cursor-pointer"
  onClick={() => navigate("/chat")}
>
  Chat
</button> */}




      {ham2 && (
        <div
          className={`absolute top-0 w-full h-[100vh] bg-[#00000041] backdrop-blur-lg flex-col justify-center items-center p-[20px] gap-[20px] flex ${
            ham2 ? "translate-x-0" : "translate-x-full"
          } transition-transform`}
        >
          <div className="absolute  top-[50px] w-[480px] min-h-[600px] bg-[#00000041] backdrop-blur-lg flex flex-col justify-start items-start  p-[20px] gap-[20px] rounded-lg">
            <RxCross1
              className="text-[white] absolute top-[20px] right-[20px] h-[25px] w-[25px] cursor-pointer"
              onClick={() => setHam2(false)}
            />

            <div className="w-full flex justify-center">
              <h1 className="text-white font-semibold text-[28px]">History</h1>
            </div>

            <div className="w-full flex justify-end">
              <button
                className="w-[100px] h-[40px] outline-none border-2 rounded-full border-white px-[15px] py-[5px] text-[18px] text-[#121213] bg-[#ff4d4d] hover:bg-[#ff1a1a] cursor-pointer"
                onClick={async () => {
                  try {
                    const res = await axios.delete(
                      `${serverUrl}/api/user/clear-assistant`,
                      {
                        withCredentials: true
                      }
                    );
                    if (res.data.success) {
                      setUserData((prev) => ({ ...prev, history: [] }));
                    }
                  } catch (error) {
                    console.log(error);
                  }
                }}
              >
                Clear
              </button>
            </div>

            <div className=" w-full h-[2px] bg-gray-400"></div>

            <div className="w-full h-[400px] overflow-y-auto flex flex-col gap-[20px]  pb-[20px] pr-[10px]">
              {userData.history?.map((his, index) => (
                <div
                  key={index}
                  className="text-gray-300 text-[16px] border-b border-gray-500 pb-2 flex flex-col gap-1 bg-[#33337e] rounded-lg p-[10px] "
                >
                  <p className="text-yellow-400 text-[18px]">
                    🧑 You: {his.userInput}
                  </p>
                  <p className="text-green-400   text-[18px]">
                    🤖 AI: {his.aiResponse}
                  </p>
                  <p className="text-gray-400 text-[14px] self-end mt-[8px] mr-[5px]  ">
                    {new Date(his.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


{/* Overlay for blur */}
<div
  className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 pointer-events-none
    ${conversationMode ? "opacity-100 pointer-events-auto" : "opacity-0"}`}
></div>

{/* Assistant button */}
<div
  className={`fixed bottom-[30px] left-[5%] sm:left-[2%] z-50 cursor-pointer select-none transition-all duration-300 rounded-full
    border-3 border-[#f7f7f5] 
    ${conversationMode 
      ? "scale-115 shadow-[0_0_15px_rgba(128,0,255,0.7),0_0_25px_rgba(255,0,0,0.6),0_0_35px_rgba(0,0,255,0.5),0_0_45px_rgba(0,255,0,0.4)]"
      : "scale-105 shadow-[0_0_10px_rgba(128,0,255,0.3),0_0_15px_rgba(255,0,0,0.3),0_0_20px_rgba(0,0,255,0.2),0_0_25px_rgba(0,255,0,0.2)]"
    }`}
  onClick={() =>
    setConversationMode((prev) => {
      const newMode = !prev;
      expectingUserReplyRef.current = false;
      if (!prev) setTimeout(() => startRecongnition(), 300);
      return newMode;
    })}
>
  <img
    src={communicate}
    className="w-[80px] sm:w-[100px] rounded-full transition-all duration-300"
    alt="Communicate"
  />
</div>






      <div className="w-[360px] h-[350px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg">
        <img
          src={userData?.assistantImage}
          className="h-full object-cover rounded-2xl "
        />
      </div>

      <h1 className="text-white text-[28px] font-semibold">
        I'm <span className="text-[#ff0015]">{userData?.assistantName}</span>
      </h1>



      {!aiText && <img src={userImg} className="w-[200px]" />}

      {aiText && <img src={aiImg} className="w-[200px]" />}

      {/* <h1
        className={`text-[20px] ${
          userText
            ? "text-yellow-400"
            : aiText
            ? "text-[red]"
            : "text-[#00ffae]"
        }`}
      >
        {userText ? userText : aiText ? aiText : null}
      </h1> */}

        {/* <h1
    className={` inset-0 flex items-center justify-center text-[20px] font-semibold z-50
      ${userText ? "text-yellow-400" : aiText ? "text-red-500" : "text-[#00ffae]"}`}
  >
    {userText ? userText : aiText ? aiText : null}
  </h1> */}


      <h1
  className={`absolute inset-0 flex items-center justify-center 
    text-xs sm:text-sm md:text-lg lg:text-2xl font-semibold z-50 
    ${userText ? "text-yellow-400" : aiText ? "text-red-500" : "text-[#00ffae]"}`}
>
  {userText ? userText : aiText ? aiText : null}
</h1>




    </div>
  );
}

export default Home;
