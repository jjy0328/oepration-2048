import { SCORE_TABLE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config.js";

const NICKNAME_KEY = "shooterPixel2048Nickname";
const LOCAL_SCORES_KEY = "shooterPixel2048Scores";

let activeConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  scoreTable: SCORE_TABLE,
};
let configPromise = null;
let supabaseClientPromise = null;

function hasSupabaseConfig(config = activeConfig) {
  return config.url.startsWith("https://") && config.anonKey.length > 20;
}

function normalizeConfig(config) {
  return {
    url: config.supabaseUrl || config.SUPABASE_URL || config.url || "",
    anonKey: config.supabaseAnonKey || config.SUPABASE_ANON_KEY || config.anonKey || "",
    scoreTable: config.scoreTable || config.SCORE_TABLE || config.score_table || SCORE_TABLE,
  };
}

async function loadSupabaseConfig() {
  if (configPromise) return configPromise;

  configPromise = (async () => {
    if (hasSupabaseConfig(activeConfig)) {
      return activeConfig;
    }

    try {
      const response = await fetch("/api/supabase-config", { cache: "no-store" });

      if (!response.ok) {
        return activeConfig;
      }

      const nextConfig = normalizeConfig(await response.json());

      if (hasSupabaseConfig(nextConfig)) {
        activeConfig = nextConfig;
      }
    } catch {
      return activeConfig;
    }

    return activeConfig;
  })();

  return configPromise;
}

function normalizeNickname(nickname) {
  return nickname.trim().replace(/\s+/g, " ").slice(0, 16);
}

function readLocalScores() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SCORES_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeLocalScores(scores) {
  localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(scores.slice(0, 10)));
}

export function getNickname() {
  return localStorage.getItem(NICKNAME_KEY) || "";
}

export function saveNickname(nickname) {
  const normalized = normalizeNickname(nickname);

  if (!normalized) return "";

  localStorage.setItem(NICKNAME_KEY, normalized);
  return normalized;
}

export function isLeaderboardOnline() {
  return hasSupabaseConfig();
}

async function getSupabaseClient() {
  const config = await loadSupabaseConfig();

  if (!hasSupabaseConfig(config)) return null;

  if (!supabaseClientPromise) {
    supabaseClientPromise = import("https://esm.sh/@supabase/supabase-js@2").then(
      ({ createClient }) => createClient(config.url, config.anonKey),
    );
  }

  return supabaseClientPromise;
}

export async function loadTopScores() {
  const supabase = await getSupabaseClient();

  if (!supabase) {
    return readLocalScores();
  }

  const { data, error } = await supabase
    .from(activeConfig.scoreTable)
    .select("nickname, score")
    .order("score", { ascending: false })
    .limit(10);

  if (error) throw error;

  return data || [];
}

export async function submitScore(nickname, score) {
  const normalized = normalizeNickname(nickname);
  const numericScore = Number(score) || 0;
  const supabase = await getSupabaseClient();

  if (!normalized) return;

  if (!supabase) {
    const nextScores = [
      { nickname: normalized, score: numericScore },
      ...readLocalScores(),
    ].sort((a, b) => b.score - a.score);
    writeLocalScores(nextScores);
    return;
  }

  const { error } = await supabase
    .from(activeConfig.scoreTable)
    .insert({ nickname: normalized, score: numericScore });

  if (error) throw error;
}
