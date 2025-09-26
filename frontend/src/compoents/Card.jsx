import React, { useContext } from 'react'
import { userDataContext } from '../context/UserContext.jsx'
import axios from 'axios'

function Card({image}) {

const {  serverUrl,
    userData,
    setUserData,
    loading,frontendImage,setFrontendImage,backendImage,setBackendImage,selectedImage,setSelectedImage} = useContext(userDataContext)
   

  return (
    <div
  className={`w-[85px] h-[170px] lg:w-[150px] lg:h-[280px] bg-[rgb(3,3,38)] border-2 border-[#5757e1] rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-950 cursor-pointer ${
    selectedImage == image ? "border-[#f31616] shadow-blue-950 border-4" : "hover:border-white"
  }`} onClick={
      ()=>{setSelectedImage(image)
      setBackendImage(null)
      setFrontendImage(null)}
    }>
       <img src={image} className='h-full object-cover bg-cover'/>
    </div>
  )
}

export default Card
