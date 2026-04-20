require('dotenv').config();
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

console.log('=== Email Config Test ===');
console.log('EMAIL_USER:', EMAIL_USER);
console.log('EMAIL_PASS length:', EMAIL_PASS ? EMAIL_PASS.replace(/\s/g,'').length : 0, 'chars');
console.log('Is Gmail?', EMAIL_USER && EMAIL_USER.endsWith('@gmail.com'));
console.log('');

if (!EMAIL_USER || EMAIL_USER === 'YOUR_GMAIL@gmail.com') {
    console.error('❌ EMAIL_USER is not set! Please edit .env with your real Gmail.');
    process.exit(1);
}
if (!EMAIL_PASS || EMAIL_PASS === 'YOUR_16_CHAR_APP_PASSWORD') {
    console.error('❌ EMAIL_PASS is not set! Please edit .env with your Gmail App Password.');
    process.exit(1);
}
if (!EMAIL_USER.endsWith('@gmail.com')) {
    console.error('❌ EMAIL_USER must be a Gmail address ending in @gmail.com');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS.replace(/\s/g, '') }
});

console.log('Testing SMTP connection...');
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection FAILED:');
        console.error(error.message);
        console.log('');
        console.log('Common fixes:');
        console.log('1. Make sure 2-Factor Auth is ON for your Google account');
        console.log('2. The password must be an APP PASSWORD, not your normal Gmail password');
        console.log('3. Generate App Password at: https://myaccount.google.com/apppasswords');
        console.log('4. Make sure "Less secure app access" is NOT needed (App Password bypasses this)');
    } else {
        console.log('✅ SMTP Connection SUCCESS!');
        console.log('Sending test OTP email to:', EMAIL_USER);

        transporter.sendMail({
            from: `"LearnifyX" <${EMAIL_USER}>`,
            to: EMAIL_USER, // sends to yourself as a test
            subject: 'Test OTP - 123456',
            html: `<h2>Test Email</h2><p>Your OTP is: <b>123456</b></p><p>If you received this, email is working!</p>`
        }, (err, info) => {
            if (err) {
                console.error('❌ Send failed:', err.message);
            } else {
                console.log('✅ Test email sent! Check your inbox at:', EMAIL_USER);
                console.log('Message ID:', info.messageId);
            }
        });
    }
});
