import { createClient } from "@supabase/supabase-js";
//Data is ignored from this repo
import { sbUrl, sbKey } from "./Data";

const supabaseUrl = sbUrl;
const supabaseKey = sbKey;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
