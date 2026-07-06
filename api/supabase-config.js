module.exports = function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    scoreTable: process.env.SUPABASE_SCORE_TABLE || "scores",
  });
};
