function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(url: string): string {
  if (/^https?:\/\//.test(url) || url.startsWith('/')) {
    return escapeHtml(url);
  }
  return '#';
}

export function notificationEmailHtml(params: {
  title: string;
  message: string;
  link?: string;
  recipientName: string;
}): string {
  const { title, message, link, recipientName } = params;
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeName = escapeHtml(recipientName);
  const safeLink = link ? sanitizeUrl(link) : '';
  const linkHtml = link
    ? `<p style="margin-top: 16px;"><a href="${safeLink}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">View Details</a></p>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="margin: 0 0 8px; color: #18181b; font-size: 18px;">${safeTitle}</h2>
      <p style="margin: 0; color: #71717a; font-size: 14px;">Hi ${safeName},</p>
      <p style="margin: 12px 0 0; color: #3f3f46; font-size: 14px; line-height: 1.6;">${safeMessage}</p>
      ${linkHtml}
    </div>
    <p style="margin-top: 16px; text-align: center; color: #a1a1aa; font-size: 12px;">Kurweball — Recruiting Platform</p>
  </div>
</body>
</html>`.trim();
}
