import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = user.id;

    // Admin client (service role)
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Verify caller is an admin
    const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr || !isAdminData) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse + validate body
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = typeof body.role === "string" ? body.role : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 120) : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail) || rawEmail.length > 255) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!["admin", "curator", "analyst"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existingInvite, error: existingInviteError } = await admin
      .from("team_invites")
      .select("id")
      .eq("email", rawEmail)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInviteError) {
      return new Response(JSON.stringify({ error: existingInviteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let inviteId = existingInvite?.id as string | undefined;

    if (!inviteId) {
      // Insert team invite row
      const { data: inviteRow, error: insertErr } = await admin
        .from("team_invites")
        .insert({
          email: rawEmail,
          role,
          status: "pending",
          invited_by: callerId,
          full_name: fullName || null,
        })
        .select("id")
        .single();

      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message ?? "Could not create invite" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      inviteId = inviteRow.id;
    }

    // Send the actual invitation email via Supabase Auth
    const redirectTo = `${SUPABASE_URL.replace(".supabase.co", ".lovable.app")}`;
    const siteUrl = req.headers.get("origin") ?? undefined;
    const acceptUrl = siteUrl ? `${siteUrl}/accept-invite` : `${redirectTo}/accept-invite`;

    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(rawEmail, {
      data: {
        invited_role: role,
        team_invite_id: inviteId,
        display_name: fullName || undefined,
        invited_staff: true,
        must_change_password: true,
      },
      redirectTo: acceptUrl,
    });

    if (inviteErr) {
      const msg = inviteErr.message ?? "Could not send invite email";
      const alreadyRegistered =
        msg.toLowerCase().includes("already") || msg.toLowerCase().includes("registered");

      if (alreadyRegistered) {
        // Keep invite pending. Send the existing user a real magic-link email so they can accept.
        try {
          const siteUrlHeader = req.headers.get("origin") ?? undefined;
          const acceptRedirect = siteUrlHeader
            ? `${siteUrlHeader}/accept-invite?invite=${inviteId}`
            : `${redirectTo}/accept-invite?invite=${inviteId}`;

          const { error: otpErr } = await userClient.auth.signInWithOtp({
            email: rawEmail,
            options: {
              emailRedirectTo: acceptRedirect,
              shouldCreateUser: false,
            },
          });

          if (otpErr) throw otpErr;
        } catch (linkErr) {
          return new Response(
            JSON.stringify({
              error: (linkErr as Error).message ?? "Could not send invite email",
              invite_id: inviteId,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            already_registered: true,
            invite_id: inviteId,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: msg, invite_id: inviteId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity (best effort)
    try {
      await admin.rpc("log_activity", {
        _action: "team.invite_sent",
        _summary: `Invited ${rawEmail} as ${role}`,
        _entity: "team_invite",
        _entity_id: inviteId,
        _metadata: { email: rawEmail, role },
      });
    } catch (_) {
      // ignore activity log failures
    }

    return new Response(
      JSON.stringify({ success: true, already_pending: Boolean(existingInvite), invite_id: inviteId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-team-invite error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
