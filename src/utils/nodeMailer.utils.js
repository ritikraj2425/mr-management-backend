// utils/email.js
const nodemailer = require('nodemailer');


// Create a transporter object using Gmail's SMTP settings
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Gmail SMTP server
    port: 587,              // Port for TLS/STARTTLS
    secure: false,          // false because we are using STARTTLS
    auth: {
        user: process.env.EMAIL_APP_USER || 'rajritik2425@gmail.com',    // your Gmail address
        pass: process.env.EMAIL_APP_PASSWORD || 'rfnhwnguwwxslkgv',  // your Gmail app password
    }
});

/**
 * Sends an email using the configured transporter.
 * @param {string} recipientEmail - The recipient's email address.
 * @param {string} subject - The subject of the email.
 * @param {string} htmlContent - The HTML content of the email.
 * @param {string} textContent - The plain text content of the email.
 * @returns {Promise} - A promise that resolves when the email is sent.
 */
exports.sendEmail = async (recipientEmail, subject, htmlContent, textContent) => {
    const mailOptions = {
        from: process.env.EMAIL_APP_USER || 'rajritik2425@gmail.com', // use the same email as defined in environment variables
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent
    };

    return transporter.sendMail(mailOptions);
};
