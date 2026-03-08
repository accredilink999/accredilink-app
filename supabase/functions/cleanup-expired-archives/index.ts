import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * cleanup-expired-archives
 * Deletes archive records whose keep_until date has passed.
 * Can be called via cron (pg_cron) or manually from admin.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // Find and delete expired archive records (non-restored only)
    const { data: expired, error: fetchErr } = await supabase
      .from("archives")
      .select("id, item_name, entity_type")
      .lt("keep_until", now)
      .eq("is_restored", false)
      .limit(500);

    if (fetchErr) throw fetchErr;

    if (!expired || expired.length === 0) {
      return new Response(
        JSON.stringify({ deleted: 0, message: "No expired archives" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ids = expired.map((r: { id: string }) => r.id);

    const { error: deleteErr } = await supabase
      .from("archives")
      .delete()
      .in("id", ids);

    if (deleteErr) throw deleteErr;

    return new Response(
      JSON.stringify({
        deleted: ids.length,
        message: `Permanently deleted ${ids.length} expired archive(s)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("cleanup-expired-archives error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
