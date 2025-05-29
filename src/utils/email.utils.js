const { Resend } = require('resend');
const config = require('../config/email.config');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOtpEmail = async (email, otp) => {
    try {
        await resend.emails.send({
            from:  'no-reply@purchase-finance.flashfund.in', 
            to: email,
            subject: 'Email Verification OTP',
            html: `<p>Your OTP for email verification Flashfund (beta-prod) is: <strong>${otp}</strong></p>`
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};
const sendReferrerCredentials = async (referrerEmail, password) => {
    try {
        await resend.emails.send({
            from: 'no-reply@flashfund.in',
            to: referrerEmail,
            subject: 'Your Flashfund Referrer Account Credentials',
            html: `
                <h2>Welcome to Flashfund Personal Loan Referral Program</h2>
                <p>Your referrer account has been created successfully.</p>
                <p>Please find your login credentials below:</p>
                <p>Email: <strong>${referrerEmail}</strong></p>
                <p>Password: <strong>${password}</strong></p>
                <p>Login URL: <a href="https://pl-referral-dashboard.vercel.app/">https://pl-referral-dashboard.vercel.app/</a></p>
                <h3>Important Information:</h3>
                <ul>
                    <li>After logging in, you'll find your unique QR code in your dashboard</li>
                    <li>Share this QR code with potential customers to track your referrals</li>
                    <li>Each scan of your QR code will be linked to your referrer account</li>
                    <li>Track all your referrals through the dashboard</li>
                </ul>
                
                <p>Start growing with Flashfund Personal Loans today!</p>
            `
        });
        return true;
    } catch (error) {
        console.error('Referrer email send error:', error);
        return false;
    }
};

const sendAdminNotification = async (adminEmail, referrerEmail) => {
    try {
        await resend.emails.send({
            from: 'no-reply@purchase-finance.flashfund.in',
            to: adminEmail,
            subject: 'New Referrer Account Created',
            html: `
                <h2>New Referrer Account Notification</h2>
                <p>A new referrer account has been created with the following details:</p>
                <p>Referrer Email: <strong>${referrerEmail}</strong></p>
                <p>Creation Time: <strong>${new Date().toLocaleString()}</strong></p>
                <p>Please review the account in the admin dashboard.</p>
            `
        });
        return true;
    } catch (error) {
        console.error('Admin notification email send error:', error);
        return false;
    }
};

module.exports = { 
    sendOtpEmail,
    sendReferrerCredentials,
    sendAdminNotification 
};