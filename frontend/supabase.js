const SUPABASE_URL = "https://fuxwddgjxhmagdyetsth.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_1Z6sHymJpj2VshazcgE8eg_bg5-ISUT";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
);

console.log("SkillTrack Supabase client:", supabaseClient);
