
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendResetEmail(email, resetLink) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your CityPulse Password",
    text: `Reset your password using this link: ${resetLink}\n\nThis link expires in 15 minutes.`,
    html: `
      <h2>Reset Your Password</h2>
      <p>Click below to reset your CityPulse password.</p>
      <a href="${resetLink}">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}

export default sendResetEmail;
