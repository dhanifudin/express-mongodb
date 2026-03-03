const MAIL_DRIVER = process.env.MAIL_DRIVER || "smtp";

function createSmtpTransporter() {
  const nodemailer = require("nodemailer");
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendMail({ from, to, subject, text, html }) {
  if (MAIL_DRIVER === "resend") {
    const { Resend } = require("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from, to, subject, text, html });
  } else {
    const transporter = createSmtpTransporter();
    await transporter.sendMail({ from, to, subject, text, html });
  }
}

async function sendPasswordResetEmail(to, resetToken) {
  const resetUrl = `${process.env.APP_URL}/users/reset-password/${resetToken}`;
  const from = `"${process.env.MAIL_FROM_NAME || "No Reply"}" <${process.env.MAIL_FROM_EMAIL}>`;

  await sendMail({
    from,
    to,
    subject: "Password Reset Request",
    text: `You requested a password reset. Use the link below to reset your password (expires in 1 hour):\n\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>You requested a password reset. Click the link below to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you did not request this, ignore this email.</p>`,
  });
}

module.exports = { sendPasswordResetEmail };
