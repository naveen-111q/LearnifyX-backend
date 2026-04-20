const nodemailer = require('nodemailer');

// Set up the transporter
// Note: To use this in production, you must set EMAIL_USER and EMAIL_PASS in your .env file
const isGmail = process.env.EMAIL_USER && process.env.EMAIL_USER.endsWith('@gmail.com');

const transporter = nodemailer.createTransport(isGmail ? {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
} : {
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: `"LearnifyX" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`); // Logs link to see the email online
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

const sendRegistrationOTP = async (email, otp) => {
    console.log(`\n================================`);
    console.log(`[TESTING OTP] Registration Code for ${email}: ${otp}`);
    console.log(`================================\n`);
    
    const subject = 'Your Verification Code';
    const text = `Welcome! Your verification code is: ${otp}. It will expire in 2 hours.`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to the Platform!</h2>
            <p>Your verification code is:</p>
            <h1 style="color: #4CAF50; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 2 hours.</p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
    return await sendEmail(email, subject, text, html);
};

const sendPasswordResetOTP = async (email, otp) => {
    console.log(`\n================================`);
    console.log(`[TESTING OTP] Password Reset Code for ${email}: ${otp}`);
    console.log(`================================\n`);

    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Your reset code is: ${otp}. It will expire in 2 hours.`;
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Password Reset Request</h2>
            <p>Your password reset code is:</p>
            <h1 style="color: #2196F3; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 2 hours.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
        </div>
    `;
    return await sendEmail(email, subject, text, html);
};

module.exports = {
    sendRegistrationOTP,
    sendPasswordResetOTP
};
