interface LoginLinkEmailProps {
  email: string;
  loginUrl: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const loginLinkEmailHtml = ({ email, loginUrl }: LoginLinkEmailProps): string => {
  const safeUrl = escapeHtml(loginUrl);
  const safeEmail = escapeHtml(email);

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your Class Beyond login link</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;font-family:'Plus Jakarta Sans','Segoe UI',Helvetica,Arial,sans-serif;color:#1f2933;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid #ece9f5;border-radius:24px;padding:40px 36px;">
            <tr>
              <td style="text-align:center;padding-bottom:8px;font-size:32px;">&#128075;</td>
            </tr>
            <tr>
              <td style="text-align:center;font-size:24px;font-weight:700;color:#1f2933;padding-bottom:12px;">
                Your login link is ready
              </td>
            </tr>
            <tr>
              <td style="text-align:center;font-size:15px;line-height:24px;color:#6b7280;padding-bottom:28px;">
                Tap the button below to sign in to your Class Beyond Academy account. No password needed.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:28px;">
                <a href="${safeUrl}" style="display:inline-block;background-color:#1f2933;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 34px;border-radius:999px;">
                  Log in to Class Beyond
                </a>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;font-size:13px;line-height:20px;color:#9aa1ac;padding-bottom:20px;">
                This link was requested for <strong style="color:#6b7280;">${safeEmail}</strong>. It expires in 1 hour and can only be used once.
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #f0eef7;padding-top:20px;text-align:center;font-size:12px;line-height:20px;color:#9aa1ac;">
                If you didn't request this, you can safely ignore this email.<br />
                Class Beyond Academy &middot; 01438 582848
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
