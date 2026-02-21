import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // a. Total count of shift_calls
    const { count: totalShiftCalls } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true });

    // b. Count with service_user_address populated vs null
    const { count: addressPopulated } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true })
      .not("service_user_address", "is", null)
      .neq("service_user_address", "");

    const { count: addressNull } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true })
      .or("service_user_address.is.null,service_user_address.eq.");

    // c. Count with service_user_id populated vs null
    const { count: serviceUserIdPopulated } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true })
      .not("service_user_id", "is", null);

    const { count: serviceUserIdNull } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true })
      .is("service_user_id", null);

    // d. 5 sample shift_calls
    const { data: sampleShiftCalls, error: scError } = await supabase
      .from("shift_calls")
      .select("id, service_user_name, service_user_address, service_user_id, drove_to_call, clock_in_time")
      .order("created_at", { ascending: false })
      .limit(5);

    // e. 5 sample service_users
    const { data: sampleServiceUsers, error: suError } = await supabase
      .from("service_users")
      .select("id, full_name, address, postcode")
      .limit(15);

    // f. Extract UK postcodes from sample service_user addresses
    const postcodeRegex = /[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i;
    const serviceUserPostcodes = (sampleServiceUsers || []).map((su: any) => {
      const match = su.address ? su.address.match(postcodeRegex) : null;
      return {
        id: su.id,
        full_name: su.full_name,
        address: su.address,
        postcode_found: !!match,
        extracted_postcode: match ? match[0] : null,
      };
    });

    // g. Count of shift_calls where drove_to_call = true
    const { count: droveToCallTrue } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true })
      .eq("drove_to_call", true);

    // h. Count of shift_calls where clock_in_time is not null
    const { count: clockInNotNull } = await supabase
      .from("shift_calls")
      .select("*", { count: "exact", head: true })
      .not("clock_in_time", "is", null);

    // i. Count of service_users with address populated vs null
    const { count: suAddressPopulated } = await supabase
      .from("service_users")
      .select("*", { count: "exact", head: true })
      .not("address", "is", null)
      .neq("address", "");

    const { count: suAddressNull } = await supabase
      .from("service_users")
      .select("*", { count: "exact", head: true })
      .or("address.is.null,address.eq.");

    const diagnostics = {
      timestamp: new Date().toISOString(),
      shift_calls: {
        total_count: totalShiftCalls,
        service_user_address_populated: addressPopulated,
        service_user_address_null_or_empty: addressNull,
        service_user_id_populated: serviceUserIdPopulated,
        service_user_id_null: serviceUserIdNull,
        drove_to_call_true: droveToCallTrue,
        clock_in_time_not_null: clockInNotNull,
        samples: sampleShiftCalls,
        sample_error: scError?.message || null,
      },
      service_users: {
        address_populated: suAddressPopulated,
        address_null_or_empty: suAddressNull,
        samples: sampleServiceUsers,
        sample_error: suError?.message || null,
        postcode_extraction: serviceUserPostcodes,
      },
    };

    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
