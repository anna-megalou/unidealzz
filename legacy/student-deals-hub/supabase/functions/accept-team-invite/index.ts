import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      // Called without a session (e.g. before auth restored). Treat as a no-op
      // so callers don't see noisy 401s on every page load.
      return new Response(JSON.stringify({ success: true, no_session: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user?.email) {
      return new Response(JSON.stringify({ success: true, no_session: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Find a pending invite matching the signed-in user's email
    const email = user.email.toLowerCase();
    const { data: invite, error: inviteErr } = await admin
      .from("team_invites")
      .select("id, role, status")
      .eq("email", email)
      .eq("status", "pending")
      .order("invited_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!invite) {
      // Not an error — most sign-ins have no pending invite. Return 200 so callers don't log noise.
      return new Response(JSON.stringify({ success: true, no_invite: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assign the role (idempotent)
    await admin
      .from("user_roles")
      .insert({ user_id: user.id, role: invite.role });

    // Mark invite accepted
    await admin
      .from("team_invites")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return new Response(
      JSON.stringify({ success: true, role: invite.role }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
