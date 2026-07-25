// пока просто лог в консоль, smtp не настраивал
async function sendPasswordResetEmail({ email, resetUrl }) {
  if (process.env.SMTP_HOST) {
    console.log(`[email] Would send reset to ${email}: ${resetUrl}`);
    return;
  }
  console.log(`[forgot-password] Reset link for ${email}: ${resetUrl}`);
}

module.exports = { sendPasswordResetEmail };
