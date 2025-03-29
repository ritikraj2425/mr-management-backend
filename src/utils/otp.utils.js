const crypto = require("crypto");
const { sendEmail } = require("./nodeMailer.utils");

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const sendOtpEmail = async (email, otp) => {
    const subject = "Your OTP for Signup Verification";
    const htmlContent = `<p>Your OTP for signup is: <b>${otp}</b>. It is valid for 10 minutes.</p>`;
    const textContent = `Your OTP is ${otp}. It is valid for 10 minutes.`;
    
    await sendEmail(email, subject, htmlContent, textContent);
};

module.exports = { generateOTP, sendOtpEmail };
