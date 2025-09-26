import getToken from "../config/token.js";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

export const signUp = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({ message: "Email Already Exists !" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 Charecter !" });
    }
    const handlePassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      password: handlePassword,
      email
    });

    const token = await getToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false
    });
    return res.status(201).json(user);
  } catch (err) {
    return res.status(500).json({ message: `signUp Eror ${err}` });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 Charecter !" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect Password !" });
    }

    const token = await getToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
      secure: false
    });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: `login Eror ${err}` });
  }
};


export const logOut = async(req , res)=>{
  try{
  res.clearCookie("token")
    return res.status(200).json({message:"Logout Successfully !"});

  }catch(err){
       return res.status(500).json({message:`logout Eror ${err}` });
  }
}



// OTP store (temporary)
const otpStore = {}; // { email: { otp, expiresAt } }

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Send OTP Email
const sendOTPEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
  });
};

// Step 1: Request OTP
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
console.log(email)
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found!" });

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    otpStore[email] = { otp, expiresAt };

    await sendOTPEmail(email, otp);

    return res
      .status(200)
      .json({ message: "OTP sent to your email, valid for 10 minutes!" });
  } catch (err) {
    return res.status(500).json({ message: `Forgot Password Error: ${err}` });
  }
};

// Step 2: Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: "No OTP requested!" });

    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired!" });
    }

    if (parseInt(otp) !== record.otp)
      return res.status(400).json({ message: "Invalid OTP!" });

    return res.status(200).json({ message: "OTP verified successfully!" });
  } catch (err) {
    return res.status(500).json({ message: `OTP Verify Error: ${err}` });
  }
};

// Step 3: Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = otpStore[email];
    if (!record) return res.status(400).json({ message: "No OTP requested!" });

    if (Date.now() > record.expiresAt) {
      delete otpStore[email];
      return res.status(400).json({ message: "OTP expired!" });
    }

    if (parseInt(otp) !== record.otp)
      return res.status(400).json({ message: "Invalid OTP!" });

    if (newPassword.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters!" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    delete otpStore[email];

    return res.status(200).json({ message: "Password reset successfully!" });
  } catch (err) {
    return res.status(500).json({ message: `Reset Password Error: ${err}` });
  }
};