const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const appUrl = process.env.FRONTEND_URL || 'https://xeroq-frontend.onrender.com'
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev'

  if (!apiKey) {
    return {
      success: false,
      message: 'Email delivery is not configured. Set RESEND_API_KEY, EMAIL_FROM, and FRONTEND_URL to enable password reset emails.',
    }
  }

  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Reset your XeroQ password',
        html: `
          <h2>Password reset request</h2>
          <p>Hello ${name || 'there'},</p>
          <p>We received a request to reset your password for XeroQ.</p>
          <p><a href="${resetLink}">Reset your password</a></p>
          <p>This link expires in 1 hour.</p>
        `,
      }),
    })

    if (!response.ok) {
      throw new Error(`Resend API request failed with status ${response.status}`)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: `Password reset email failed: ${error.message}`,
    }
  }
}

module.exports = { sendPasswordResetEmail }
