import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
export const userDataContext = createContext();

function UserContext({ children }) {
  const serverUrl = "https://virtualassistant-backend-n623.onrender.com";
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
const [selectedImage,setSelectedImage] = useState(null)
  const [frontendImage,setFrontendImage] = useState(null);
    const [backendImage,setBackendImage] = useState(null);
    
const handleCurrentUser = async () => {
  setLoading(true);
  try {
    // Get the token from localStorage (or wherever you store it)
    const token = localStorage.getItem("token");

    const result = await axios.get(`${serverUrl}/api/user/current`,{
  withCredentials: true,  // 🔑 ye add karna zaroori hai
});

    setUserData(result.data);
   
  } catch (err) {
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  } finally {
    setLoading(false);
  }
};



const getGeminiResponse = async (command) => {
  try {
    const result = await axios.post(
      `${serverUrl}/api/user/asktoassistant`,
      { command },
      { withCredentials: true }
    );

    // result.data = { type, userInput, response, history }
    if (result?.data?.history) {
      // Update frontend userData.history instantly
      setUserData((prev) => ({ ...prev, history: result.data.history }));
    }

    return result.data;
  } catch (error) {
    console.log("getGeminiResponse error:", error);
    return null;
  }
};




  useEffect(() => {
    handleCurrentUser();
  }, []);

  const value = {
    serverUrl,
    userData,
    setUserData,
    loading,frontendImage,setFrontendImage,backendImage,setBackendImage,selectedImage,setSelectedImage,getGeminiResponse 
  };

  return (
    <userDataContext.Provider value={value}>
      {children}
    </userDataContext.Provider>
  );
}

export default UserContext;
