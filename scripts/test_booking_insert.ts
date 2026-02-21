
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";


// Load env from .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
console.log("Loading env from:", envPath);
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
            process.env[key] = value;
            console.log("Loaded key:", key);
        }
    });
} else {
    console.error("File not found:", envPath);
}


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Or SERVICE_ROLE_KEY if needed for bypassing RLS, but route uses ANON

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert(scenario: string, payload: any) {
    console.log(`\n--- Testing Scenario: ${scenario} ---`);

    // Minimal required fields based on our analysis of route.ts and schema
    const bookingData = {
        booking_request_id: crypto.randomUUID(),
        booking_date: "2025-12-25", // Future date
        start_time: "10:00",
        end_time: "13:00", // 3 hours
        slot_start: "2025-12-25T10:00:00+02:00",
        slot_end: "2025-12-25T13:00:00+02:00",
        duration_hours: 3,
        player_count: 4,
        simulator_id: 1, // Assuming id 1 exists
        user_type: "guest",
        base_price: 100,
        total_price: 100,
        amount_paid: 0,
        payment_type: "full", // Valid: full, deposit, bypass
        status: "pending", // Valid: pending, confirmed...
        payment_status: "pending",
        guest_name: "Test User",
        guest_email: "test@example.com",
        guest_phone: "1234567890",
        ...payload
    };

    const { data, error } = await supabase
        .from("bookings")
        .insert(bookingData)
        .select()
        .single();

    if (error) {
        console.error(`❌ FAILED (${scenario}):`, error.message, error.details || "", error.hint || "");
        console.error("Payload was:", JSON.stringify(bookingData, null, 2));
    } else {
        console.log(`✅ SUCCESS (${scenario}): ID ${data.id}`);
        // Cleanup to keep DB clean-ish
        // await supabase.from("bookings").delete().eq("id", data.id);
    }
}

async function run() {
    // 1. Control: 4-ball (Known working)
    await testInsert("4-Ball Control", {
        session_type: "4ball",
        famous_course_option: "4ball",
        player_count: 4,
        duration_hours: 3
    });

    // 2. Test: 3-ball (Known failing)
    await testInsert("3-Ball Test", {
        session_type: "3ball",
        famous_course_option: "3ball", // schema has both famous_option and famous_course_option
        player_count: 3,
        duration_hours: 3
    });

    // 3. Test: Quick Play (Known failing)
    await testInsert("Quick Play Test", {
        session_type: "quick",
        famous_course_option: "quick", // logic in route.ts assigns session_type to famous_course_option
        player_count: 2,
        duration_hours: 1
    });

    // 4. Test: Quick Play with 0 price (common in quick play dev scenarios?)
    await testInsert("Quick Play Zero Price", {
        session_type: "quick",
        famous_course_option: "quick",
        player_count: 1,
        duration_hours: 1,
        base_price: 0,
        total_price: 0
    });
}

run();
