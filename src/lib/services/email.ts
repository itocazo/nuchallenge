const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001';

interface WelcomeEmailParams {
  to: string;
  name: string;
  password: string;
}

interface PasswordResetEmailParams {
  to: string;
  name: string;
  token: string;
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
    console.error('Welcome email error:', error);
    return false;
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  token,
}: PasswordResetEmailParams): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const resendKey = process.env.RESEND_API_KEY;

  if (!resendKey) {
    console.log('──────────────────────────────────────');
    console.log(`🔑 Password reset for ${name}`);
    console.log(`   To: ${to}`);
    console.log(`   Link: ${resetUrl}`);
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
        subject: 'Reset your NuChallenge password',
        html: `
          <h2>Password reset request</h2>
          <p>Hi ${name},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <p><a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">Reset password</a></p>
          <p>If you didn't request this, ignore this email — your password won't change.</p>
          <p>— The NuChallenge Team</p>
        `,
      }),
    });

    if (!res.ok) {
      console.error('Failed to send reset email:', await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Reset email error:', error);
    return false;
  }
}
