// supabase/functions/send-booking-email/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// Пока заявки идут на твою почту
const SALON_EMAIL = "nechay1996@gmail.com";

if (!RESEND_API_KEY) {
  console.error("Missing RESEND_API_KEY");
}

// Общая обертка для красивого письма
function baseTemplate(params: {
  title: string;
  heading: string;
  intro: string;
  contentHtml: string;
  footer?: string;
}) {
  const { title, heading, intro, contentHtml, footer } = params;

  return `
  <!doctype html>
  <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f5f3ef;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f3ef;padding:24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e3ded4;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a1a,#312c24);padding:24px 32px;">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tr>
                      <td style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:22px;font-weight:600;letter-spacing:3px;color:#f8f6f3;text-transform:uppercase;">
                        HARMONIE
                      </td>
                      <td align="right" style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;letter-spacing:2px;color:#d4af37;text-transform:uppercase;">
                        Beautysalon Hannover
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:28px 32px 8px 32px;">
                  <h1 style="margin:0 0 12px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1f1c18;">
                    ${heading}
                  </h1>
                  <p style="margin:0 0 20px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.6;color:#4b4740;">
                    ${intro}
                  </p>

                  ${contentHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px 24px 32px;border-top:1px solid #eee8dd;">
                  <p style="margin:0 0 4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1.5;color:#8a8278;">
                    ${footer || "Diese E-Mail wurde automatisch von der Online Buchungsseite gesendet."}
                  </p>
                  <p style="margin:4px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1.5;color:#b0a79c;">
                    Beautysalon Harmonie, Hannover
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}

serve(async (req: Request) => {
  // CORS для браузера
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();

    const name = body.name ?? "";
    const email = body.email ?? "";
    const phone = body.phone ?? "";
    const service = body.service ?? "";
    const message = body.message ?? "";
    const source_page = body.source_page ?? "";

    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing email" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing RESEND_API_KEY" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // HTML для салона (админ)
    const salonContent = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 6px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#7a7268;text-transform:uppercase;letter-spacing:1px;">
            Neue Anfrage
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border-radius:10px;border:1px solid #eee4d7;background-color:#fbf8f3;">
        <tr>
          <td style="padding:14px 18px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
              ${[
        ["Name", name || "Nicht angegeben"],
        ["E-Mail", email],
        ["Telefon", phone || "Nicht angegeben"],
        ["Leistung", service || "Nicht angegeben"],
      ]
        .map(
          ([label, value]) => `
                <tr>
                  <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8a8278;width:130px;">
                    ${label}:
                  </td>
                  <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#332f29;font-weight:500;">
                    ${value}
                  </td>
                </tr>
              `,
        )
        .join("")}
              <tr>
                <td style="padding:10px 0 4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8a8278;vertical-align:top;">
                  Nachricht:
                </td>
                <td style="padding:10px 0 4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#332f29;line-height:1.6;">
                  ${message ? message.replace(/\n/g, "<br>") : "-"}
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#a1998f;">
                  Seite:
                </td>
                <td style="padding:8px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#a1998f;">
                  ${source_page || "-"}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const salonHtml = baseTemplate({
      title: "Neue Termin-Anfrage",
      heading: "Neue Termin-Anfrage",
      intro: "Es ist eine neue Termin-Anfrage über das Online Formular eingegangen.",
      contentHtml: salonContent,
      footer: "Diese E-Mail wurde automatisch vom Terminformular der Webseite gesendet.",
    });

    // HTML для клиента
    const clientContent = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:0 0 10px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#332f29;">
            Guten Tag ${name || ""},
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 16px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.7;color:#4b4740;">
            vielen Dank für Ihre Anfrage bei Beautysalon Harmonie. Wir haben Ihre Daten erhalten und melden uns so bald wie möglich zur Bestätigung Ihres Termins.
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;border-radius:10px;border:1px solid #eee4d7;background-color:#fbf8f3;margin:0 0 16px 0;">
        <tr>
          <td style="padding:14px 18px;">
            <table width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td colspan="2" style="padding:0 0 8px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#8a8278;">
                  Zusammenfassung Ihrer Anfrage
                </td>
              </tr>
              ${[
        ["Name", name || "Nicht angegeben"],
        ["Leistung", service || "Nicht angegeben"],
        ["Telefon", phone || "Nicht angegeben"],
      ]
        .map(
          ([label, value]) => `
                <tr>
                  <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8a8278;width:130px;">
                    ${label}:
                  </td>
                  <td style="padding:4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#332f29;font-weight:500;">
                    ${value}
                  </td>
                </tr>
              `,
        )
        .join("")}
              <tr>
                <td style="padding:10px 0 4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8a8278;vertical-align:top;">
                  Nachricht:
                </td>
                <td style="padding:10px 0 4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#332f29;line-height:1.6;">
                  ${message ? message.replace(/\n/g, "<br>") : "-"}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:4px 0 16px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.7;color:#4b4740;">
            Falls Sie Ihre Anfrage ändern möchten, können Sie uns jederzeit telefonisch erreichen.
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 4px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8a8278;">
            Mit freundlichen Grüßen
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 2px 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#332f29;font-weight:600;">
            Ihr Team von Beautysalon Harmonie
          </td>
        </tr>
      </table>
    `;

    const clientHtml = baseTemplate({
      title: "Ihre Termin-Anfrage bei Beautysalon Harmonie",
      heading: "Bestätigung Ihrer Termin-Anfrage",
      intro: "Wir haben Ihre Anfrage erfolgreich erhalten.",
      contentHtml: clientContent,
    });

    // 1) письмо салону
    const salonRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // КОГДА настроишь домен в Resend под xinvestai.com - поменяешь "from" здесь
        from: "Beautysalon Harmonie <booking@xinvestai.com>",
        to: [SALON_EMAIL],
        subject: "Neue Termin-Anfrage von der Webseite",
        html: salonHtml,
      }),
    });

    if (!salonRes.ok) {
      const text = await salonRes.text();
      console.error("Resend error (salon):", text);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Resend error (salon)",
          details: text,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 2) письмо клиенту
    const clientRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Beautysalon Harmonie <booking@xinvestai.com>",
        to: [email],
        subject: "Ihre Termin-Anfrage bei Beautysalon Harmonie",
        html: clientHtml,
      }),
    });

    if (!clientRes.ok) {
      const text = await clientRes.text();
      console.error("Resend error (client):", text);
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Resend error (client)",
          details: text,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, error: "Invalid request" }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
  }
});
