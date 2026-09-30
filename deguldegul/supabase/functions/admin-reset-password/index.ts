import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSecretKey() {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    const parsed = JSON.parse(secretKeys) as Record<string, string>;
    if (parsed.default) return parsed.default;
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKey = getSecretKey();
    const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
    if (!supabaseUrl || !secretKey) return json({ error: "Server configuration is missing" }, 500);
    if (!token) return json({ error: "로그인이 필요합니다." }, 401);

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "유효하지 않은 로그인 정보입니다." }, 401);

    const { data: caller, error: callerError } = await adminClient
      .from("degul_users")
      .select("role, status")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (callerError) throw callerError;
    if (caller?.role !== "ADM" || caller.status !== "ACT") {
      return json({ error: "ADM 권한자만 비밀번호를 초기화할 수 있습니다." }, 403);
    }

    const { userId } = await request.json();
    if (typeof userId !== "string") {
      return json({ error: "요청 형식이 올바르지 않습니다." }, 400);
    }

    const { data: target, error: targetError } = await adminClient
      .from("degul_users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return json({ error: "회원을 찾을 수 없습니다." }, 404);

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, { password: "111111" });
    if (updateError) throw updateError;

    console.info("Admin password reset", { adminUserId: authData.user.id, targetUserId: userId });
    return json({ success: true });
  } catch (error) {
    console.error("admin-reset-password failed", error);
    return json({ error: error instanceof Error ? error.message : "비밀번호 초기화에 실패했습니다." }, 500);
  }
});
