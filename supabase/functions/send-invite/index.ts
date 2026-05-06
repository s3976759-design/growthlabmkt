import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitePayload {
  email: string;
  permission: "view" | "comment" | "edit";
  inviter?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, permission, inviter } = (await req.json()) as InvitePayload;
    if (!email || !permission) {
      return json({ error: "Missing email or permission" }, 400);
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return json(
        {
          error:
            "Email service not configured. Add RESEND_API_KEY to enable real email delivery.",
        },
        503,
      );
    }

    const fromName = inviter || "Growth Lab";
    const subject = `${fromName} invited you to Growth Lab`;
    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#fff;color:#111">
        <h1 style="font-size:22px;margin:0 0 12px">You're invited to Growth Lab</h1>
        <p style="font-size:14px;line-height:1.6;color:#444">
          <b>${escapeHtml(fromName)}</b> has invited you to collaborate on their Growth Lab workspace
          with <b>${permission}</b> access.
        </p>
        <p style="margin:24px 0">
          <a href="https://growthlabmkt.lovable.app"
             style="display:inline-block;background:#111;color:#fff;text-decoration:none;
                    padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">
            Open Growth Lab
          </a>
        </p>
        <p style="font-size:12px;color:#888;margin-top:32px">
          If you weren't expecting this email, you can safely ignore it.
        </p>
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Growth Lab <onboarding@resend.dev>",
        to: [email],
        subject,
        html,
      }),
    });

    const data = await r.json();
    if (!r.ok) return json({ error: data?.message || "Send failed", details: data }, r.status);
    return json({ ok: true, id: data?.id });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
