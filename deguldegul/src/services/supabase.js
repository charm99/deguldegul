import { createClient } from "@supabase/supabase-js";
import { ensureCurrentAppVersion, isVersionedDataRequest } from "./appVersion";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const versionAwareFetch = async (input, init = {}) => {
  if (isVersionedDataRequest(input, init)) {
    const isCurrent = await ensureCurrentAppVersion({
      force: true,
      blockOnFailure: true,
    });
    if (!isCurrent) {
      throw new Error("새 버전으로 업데이트 중입니다.");
    }
  }

  return window.fetch(input, init);
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    fetch: versionAwareFetch,
  },
});
