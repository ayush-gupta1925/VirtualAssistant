import React, { useContext, useState } from "react";
import bg from "../assets/banner1.jpg";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { userDataContext } from "../context/UserContext.jsx";
import { MdErrorOutline, MdCheckCircle } from "react-icons/md";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1: enter email, 2: verify OTP, 3: reset password
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(""); // for success messages
  const [loading, setLoading] = useState(false);

  const { serverUrl } = useContext(userDataContext);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    setErr("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/forgot-password`, { email });
      setSuccess("OTP has been sent to your email.");
      setStep(2);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErr(err.response?.data?.message || "Something went wrong!");
    }
  };

  const handleVerifyOTP = async () => {
    setErr("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp });
      setSuccess("OTP verified successfully!");
      setStep(3);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErr(err.response?.data?.message || "OTP verification failed!");
    }
  };

  const handleResetPassword = async () => {
    setErr("");
    setSuccess("");
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/auth/reset-password`, { email, otp, newPassword });
      setSuccess("Password reset successfully!");
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setLoading(false);
      navigate("/signin");
    } catch (err) {
      setLoading(false);
      setErr(err.response?.data?.message || "Password reset failed!");
    }
  };

  return (
    <div
      className="w-full h-[100vh] flex justify-center items-center m-0 p-0 bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Transparent layer on background */}
      <div className="absolute inset-0 bg-[#7e1b1b69] backdrop-blur-xs"></div>

      {/* Content */}
      <div className="relative z-10 w-[90%] max-w-[500px] bg-[#a8282869] backdrop-blur-md rounded-lg shadow-lg shadow-[#e44242] flex flex-col items-center justify-center gap-[20px] px-[20px] py-[30px]">
        <h1 className="text-white text-[28px] font-semibold  text-center">
          Forgot <span className="text-blue-400">Password</span>
        </h1>

        {/* Error Message */}
        {err && (
          <p className=" text-red-400 flex items-center text-[19px] gap-2">
            <MdErrorOutline className="text-red-600" /> {err}
          </p>
        )}

        {/* Success Message */}
        {success && (
          <p className=" text-green-400 flex items-center text-[19px] gap-2">
            <MdCheckCircle className="text-green-600" /> {success}
          </p>
        )}

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[60px] outline-none border-2 rounded-full border-white bg-transparent px-[20px] text-[#afdf10] text-[18px] placeholder-gray-300"
            />
            <button
              onClick={handleSendOTP}
              className="w-full h-[60px] bg-[#f42b2b] text-[#121213] text-[21px] rounded-full mt-[10px] hover:bg-[#f45959] cursor-pointer"
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full h-[60px] outline-none border-2 rounded-full border-white bg-transparent px-[20px] text-[#afdf10] text-[18px] placeholder-gray-300"
            />
            <button
              onClick={handleVerifyOTP}
              className="w-full h-[60px] bg-[#f42b2b] text-[#121213] text-[21px] rounded-full mt-[10px] hover:bg-[#f45959] cursor-pointer"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-[60px] outline-none border-2 rounded-full border-white bg-transparent px-[20px] text-[#afdf10] text-[18px] placeholder-gray-300"
            />
            <button
              onClick={handleResetPassword}
              className="w-full h-[60px] bg-[#f42b2b] text-[#121213] text-[21px] rounded-full mt-[10px] hover:bg-[#f45959] cursor-pointer"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>





          </>
        )}
           {/* Back to Login */}
        <p className="mt-4 text-[#63b9f3] text-[17px]">
          Remembered your password?
          <span
            className="text-[#19fab3] cursor-pointer ml-[5px] hover:underline"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </span>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
