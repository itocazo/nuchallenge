interface WelcomeEmailParams {
  to: string;
  name: string;
  password: string;
}

export async function sendWelcomeEmail({ to, name, password }: WelcomeEmailParams): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.log('──────────────────────────────────────');
    console.log(`📧 Welcome email for ${name}`);
    console.log(`   To: ${to}`);
    console.log(`   Password: ${password}`);
    console.log('   (Set RESEND_API_KEY to send real emails)');
    console.log('──────────────────────────────────────');
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? 'NuChallenge <noreply@nuchallenge.app>',
        to,
        subject: 'Welcome to NuChallenge — Your credentials',
        html: `
          <h2>Welcome to NuChallenge, ${name}!</h2>
          <p>Your account has been created. Here are your login credentials:</p>
          <p><strong>Email:</strong> ${to}<br/>
          <strong>Password:</strong> ${password}</p>
          <p>Please change your password after your first login.</p>
          <p>— The NuChallenge Team</p>
        `,
      }),
    });

    if (!res.ok) {
      console.error('Failed to send welcome email:', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}
