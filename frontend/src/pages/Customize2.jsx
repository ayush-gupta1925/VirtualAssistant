import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext.jsx";
import { MdKeyboardBackspace } from "react-icons/md";
import axios from "axios";

function Customize2() {
  const { 
    serverUrl,userData,backendImage,setBackendImage,selectedImage,setSelectedImage ,setUserData} = useContext(userDataContext);
    const [loading,setLoading] = useState(false)
  const navigate = useNavigate();
  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || ""
  );


const handleUpdateAssistant = async()=>{
try {
setLoading(true)
let formData = new FormData()

formData.append("assistantName",assistantName)
if (backendImage) {
  formData.append("assistantImage", backendImage)
} else {
  formData.append("imageUrl", selectedImage)
}

  const result = await axios.post(`${serverUrl}/api/user/update`,formData,{withCredentials:true})
  console.log(result.data)
  setLoading(false)
  setUserData(result.data)
} catch (error) {
    setLoading(false)
  console.log(error)
}
}

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] relative">
<div className="w-[60px] h-[40px]  bg-[#5763ce] absolute top-[30px] left-[30px] flex items-center justify-center rounded-lg hover:bg-[#409bc9]" onClick={()=>navigate("/customize")}>
  <MdKeyboardBackspace className="w-[30px] h-[30px] text-[#ffae00] cursor-pointer" /> 
</div>

      <h1 className="text-white text-[35px] text-center mb-[30px]">
        Enter your <span className="text-yellow-500"> Assistant Name </span>{" "}
      </h1>

      <input
        type="text"
        placeholder="eg : Shifra"
        className="w-[90%] max-w-[600px]  h-[60px] outline-none border-2 rounded-full border-white bg-transparent px-[20px] py-[10px] text-[#afdf10]  text-[18px] placeholder-gray-300 required"
        value={assistantName}
        onChange={(e) => setAssistantName(e.target.value)}
      />
      {assistantName && (
        <button
          className="w-[230px] h-[50px] outline-none border-2 rounded-full border-white px-[20px] py-[8px]   text-[18px] bg-[white] text-[#121213] placeholder-gray-300 hover:bg-[#e89e28] cursor-pointer  mt-[30px]"
          onClick={() => {
          handleUpdateAssistant()
          navigate("/")
          }} disabled={loading}
        >
         { !loading? "Create your Assitant" : "Loading.."}
        </button>
      )}
    </div>
  );
}

export default Customize2;
