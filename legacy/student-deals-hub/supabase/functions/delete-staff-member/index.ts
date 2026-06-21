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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
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
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: isAdminData, error: roleErr } = await admin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (roleErr || !isAdminData) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = typeof body.user_id === "string" ? body.user_id : "";
    const deleteAuthUser = Boolean(body.delete_auth_user);
    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (targetUserId === user.id) {
      return new Response(JSON.stringify({ error: "You cannot remove yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the target user's email so we can also clean up matching invites
    let targetEmail: string | null = null;
    try {
      const { data: target } = await admin.auth.admin.getUserById(targetUserId);
      targetEmail = target?.user?.email ?? null;
    } catch (_) {}

    // Remove all roles for this user (kicks them out of staff directory)
    const { error: rolesErr } = await admin
      .from("user_roles")
      .delete()
      .eq("user_id", targetUserId);
    if (rolesErr) {
      return new Response(JSON.stringify({ error: rolesErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up any invites tied to this email so they can be re-invited fresh
    if (targetEmail) {
      await admin
        .from("team_invites")
        .delete()
        .eq("email", targetEmail.toLowerCase());
    }

    // Optionally delete the auth user entirely (so they can sign up fresh on re-invite)
    if (deleteAuthUser) {
      try {
        await admin.auth.admin.deleteUser(targetUserId);
      } catch (e) {
        // non-fatal — role removal already succeeded
        console.warn("deleteUser failed:", e);
      }
    }

    // Best-effort activity log
    try {
      await admin.rpc("log_activity", {
        _action: "team.member_removed",
        _summary: `Removed ${targetEmail ?? targetUserId} from staff`,
        _entity: "user",
        _entity_id: targetUserId,
        _metadata: { email: targetEmail, deleted_auth_user: deleteAuthUser },
      });
    } catch (_) {}

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
