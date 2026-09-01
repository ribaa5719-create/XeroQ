const nodemailer = require('nodemailer')

const getTransporter = () => {
  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASS

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465,
    auth: {
      user,
      pass,
    },
  })
}

const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const appUrl = process.env.FRONTEND_URL || 'https://xeroq-frontend.onrender.com'
  const transporter = getTransporter()

  if (!transporter) {
    return {
      success: false,
      message: 'Email delivery is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and FRONTEND_URL to enable password reset emails.',
    }
  }

  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Reset your XeroQ password',
      html: `
        <h2>Password reset request</h2>
        <p>Hello ${name || 'there'},</p>
        <p>We received a request to reset your password for XeroQ.</p>
        <p><a href="${resetLink}">Reset your password</a></p>
        <p>This link expires in 1 hour.</p>
      `,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: `Password reset email failed: ${error.message}`,
    }
  }
}

module.exports = { sendPasswordResetEmail }
