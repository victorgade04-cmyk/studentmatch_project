import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "StudentMatch <noreply@studentmatch.dk>";

function template(body: string): string {
  return `<!DOCTYPE html>
<html lang="da">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px;">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#111827;padding:24px 32px;">
      <p style="color:white;font-weight:800;font-size:18px;margin:0;letter-spacing:-0.5px;">StudentMatch</p>
    </div>
    <div style="padding:32px;">
      ${body}
      <hr style="border:none;border-top:1px solid #f3f4f6;margin:28px 0 20px;">
      <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} StudentMatch &middot; Denne e-mail er sendt automatisk, svar venligst ikke.</p>
    </div>
  </div>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#111827;color:white;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:20px;">${label}</a>`;
}

/** Notify company when a student applies to their job */
export async function sendApplicationEmail(opts: {
  companyEmail: string;
  companyName: string;
  studentName: string;
  jobTitle: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM,
    to: opts.companyEmail,
    subject: `Ny ansøgning til "${opts.jobTitle}"`,
    html: template(`
      <p style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;">Ny ansøgning modtaget</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        <strong>${opts.studentName}</strong> har ansøgt om stillingen <strong>${opts.jobTitle}</strong>.
      </p>
      <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">
        Log ind på StudentMatch for at se ansøgningen og tage stilling.
      </p>
      ${btn("Se ansøgning", "https://studentmatch.dk/dashboard/company/jobs")}
    `),
  });
}

/** Notify student when their application is approved or rejected */
export async function sendApplicationStatusEmail(opts: {
  studentEmail: string;
  studentName: string;
  jobTitle: string;
  status: "approved" | "rejected";
  companyName: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const approved = opts.status === "approved";
  await resend.emails.send({
    from: FROM,
    to: opts.studentEmail,
    subject: approved
      ? `Din ansøgning til "${opts.jobTitle}" er godkendt`
      : `Din ansøgning til "${opts.jobTitle}" er desværre afvist`,
    html: template(`
      <p style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;">
        ${approved ? "Tillykke — din ansøgning er godkendt!" : "Din ansøgning er desværre afvist"}
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 8px;">
        <strong>${opts.companyName}</strong> har ${approved ? "godkendt" : "afvist"} din ansøgning til <strong>${opts.jobTitle}</strong>.
      </p>
      ${approved
        ? `<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">De vil snart tage kontakt. Du kan se kontaktoplysningerne i din ansøgningsoversigt.</p>`
        : `<p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Bliv ikke modløs — der er masser af andre muligheder på platformen.</p>`
      }
      ${btn("Se mine ansøgninger", "https://studentmatch.dk/dashboard/student/applications")}
    `),
  });
}

/** Notify recipient when they receive a new message */
export async function sendNewMessageEmail(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  messagePreview: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  await resend.emails.send({
    from: FROM,
    to: opts.recipientEmail,
    subject: `Ny besked fra ${opts.senderName}`,
    html: template(`
      <p style="font-size:20px;font-weight:800;color:#111827;margin:0 0 12px;">Du har fået en ny besked</p>
      <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 16px;"><strong>${opts.senderName}</strong> har skrevet til dig:</p>
      <blockquote style="background:#f9fafb;border-left:3px solid #e5e7eb;margin:0 0 0;padding:12px 16px;color:#374151;font-size:14px;line-height:1.6;border-radius:0 8px 8px 0;">
        ${opts.messagePreview}
      </blockquote>
      ${btn("Svar på besked", "https://studentmatch.dk/dashboard/messages")}
    `),
  });
}
