import React, { useContext, useState } from "react";
import { IoEye } from "react-icons/io5";
import { IoMdEyeOff } from "react-icons/io";
import bg from "../assets/banner1.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { userDataContext } from "../context/UserContext.jsx";
import { MdErrorOutline } from "react-icons/md";

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { serverUrl ,userData, setUserData} = useContext(userDataContext);
  console.log(serverUrl);
  const handleSignIn = async (e) => {
    e.preventDefault();
    setErr(false);
    setLoading(true);
    try {
      let result = await axios.post(
        `${serverUrl}/api/auth/login`,
        {
          email,
          password
        },
        { withCredentials: true }
      );
      setUserData(result.data)
      setLoading(false);
           navigate("/")
    } catch (error) {
      setLoading(false);
      setUserData(null)
      console.log(error);
      setErr(error.response.data.message);
    }
  };

  return (
    <div
      className="w-full h-[100vh] flex justify-center items-center m-0 p-0 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Transparent layer on background */}
      <div className="absolute inset-0   bg-[#7e1b1b69] backdrop-blur-xs"></div>

      {/* Content */}
      <form
        className="relative z-10 w-[90%] h-[520px] max-w-[500px]   bg-[#a8282869] backdrop-blur-md rounded-lg shadow-lg shadow-[#e44242] flex flex-col items-center justify-center gap-[20px] px-[20px]"
        onSubmit={handleSignIn}
      >
        <h1 className="text-white text-[33px] font-semibold mb-[30px] mt-[-10px]">
          {" "}
          Register to
          <span className="text-blue-400"> Virtual Assistant</span>
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full h-[60px] outline-none border-2 rounded-full border-white bg-transparent px-[20px] py-[10px] text-[#afdf10] text-[18px] placeholder-gray-300 required "
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />

        <div className="w-full h-60px border-white text-white rounded-full text-[18px] relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full h-[60px] outline-none border-2 rounded-full border-white bg-transparent px-[20px] py-[10px] text-[#afdf10]  text-[18px] placeholder-gray-300 required mb-[10px]"
            onChange={(e) => setPassword(e.target.value)}
            values={password}
          />
          {!showPassword && (
            <IoEye
              className="absolute top-[18px] right-[24px] text-[25px] cursor-pointer"
              onClick={() => setShowPassword(true)}
            />
          )}

          {showPassword && (
            <IoMdEyeOff
              className="absolute top-[18px] right-[24px] text-[25px] cursor-pointer "
              onClick={() => setShowPassword(false)}
            />
          )}
        </div>
        {err && (
          <p className="mt-[10px] text-[#06f7e3] flex items-center text-[16px] gap-3">
            <MdErrorOutline className="text-[#0f0e0e]" /> {err}{" "}
            <MdErrorOutline className="text-[#0f0e0e]" />
          </p>
        )}

        <button
          className="w-full h-[60px] outline-none border-2 rounded-full border-white px-[20px] py-[10px]   text-[21px] bg-[#f42b2b] text-[#121213] placeholder-gray-300 hover:bg-[#f45959] cursor-pointer mt-[20px]"
          disabled={loading}
        >
          {loading ? "Loading.." : "Sign In"}
        </button>

        <p
          className=" text-blue-400 text-[18px] cursor-pointer"
          onClick={() => navigate("/signup")}
        >
          Create a new Account ?{" "}
          <span className="text-yellow-400  hover:underline">Sign Up </span>{" "}
        </p>

           <button
          onClick={() => navigate("/forgot-password")}
          className="mt-1 text-[#27dbde] hover:underline font-medium transition duration-200 cursor-pointer"
        >
          Forgot Password?
        </button>
      </form>
    </div>
  );
}

export default SignIn;
