interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';

export async function sendPlatformEmail(message: EmailMessage): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) throw new Error('RESEND_API_KEY is not configured.');
  if (!from) throw new Error('EMAIL_FROM is not configured.');

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email provider failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  return { id: data.id as string };
}
