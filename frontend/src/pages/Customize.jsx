import React, { useState,useRef, useContext } from "react";
import Card from "../compoents/Card.jsx";
import image1 from "../assets/image1.jpg";
import image2 from "../assets/image2.png";
import image3 from "../assets/image3.jpg"; 
import image4 from "../assets/image4.png";
import image5 from "../assets/image5.png";
import image6 from "../assets/image6.png";
import image7 from "../assets/image7.png";
import { RiImageAddLine } from "react-icons/ri";
import { userDataContext } from "../context/UserContext.jsx";
import { useNavigate } from "react-router-dom";
import { MdKeyboardBackspace } from "react-icons/md";
function Customize() {
const {  serverUrl,
    userData,
    setUserData,
    loading,frontendImage,setFrontendImage,backendImage,setBackendImage,selectedImage,setSelectedImage} = useContext(userDataContext)
    const inputImage = useRef();
const navigate = useNavigate()
 const handleImage =(e)=>{
const file = e.target.files[0];
setBackendImage(file)
setFrontendImage(URL.createObjectURL(file))
 }

  return (
    <div className="w-full h-[100vh] bg-gradient-to-t from-[black] to-[#030353] flex justify-center items-center flex-col p-[20px] ">


    <div className="w-[60px] h-[40px]  bg-[#5763ce] absolute top-[30px] left-[30px] flex items-center justify-center rounded-lg hover:bg-[#409bc9]" onClick={()=>navigate("/")}>
  <MdKeyboardBackspace className="w-[30px] h-[30px] text-[#ffae00] cursor-pointer" /> 
</div>
      <h1 className="text-white text-[35px] text-center mb-[30px]">
        Selcet your <span className="text-yellow-500">Assistant Image</span>
      </h1>

      <div className="w-[90%] max-w-[900px] flex justify-centeritems-center flex-wrap bg-cover gap-[20px] ">
        <Card image={image1} />
        <Card image={image2} />
        <Card image={image3} />
        <Card image={image4} />
        <Card image={image5} />
        <Card image={image6} />
        <Card image={image7} />

   <div
  className={`w-[85px] h-[170px] lg:w-[150px] lg:h-[280px] bg-[#030326] border-2 border-[#5757e1] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer hover:border-3 hover:border-white flex items-center justify-center  ${
    selectedImage == "input" ? "border-[#f31616] shadow-blue-950 border-4" : "hover:border-white"
  }`}
  onClick={() => {inputImage.current.click()
  setSelectedImage("input")}}
>
  {!frontendImage && (
    <RiImageAddLine className="text-white w-[35px] h-[35px]" />
  )}

  {frontendImage && (
    <img src={frontendImage} className="h-full object-cover" />
  )}
</div>

<input
  type="file"
  accept="image/*"
  ref={inputImage}
  hidden
  onChange={handleImage}
/>

      </div>

      {selectedImage && <button className="w-[150px] h-[50px] outline-none border-2 rounded-full border-white px-[20px] py-[8px]   text-[18px] bg-[white] text-[#121213] placeholder-gray-300 hover:bg-[#8ff459] cursor-pointer mt-[20px] mb-[10px] " onClick={()=>navigate("/customize2")}>
        Next
      </button>}
      
    </div>
  );
}

export default Customize;
