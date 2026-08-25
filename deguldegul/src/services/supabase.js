import { createClient } from "@supabase/supabase-js";
import { ensureCurrentAppVersion, isVersionedDataRequest } from "./appVersion";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const versionAwareFetch = async (input, init = {}) => {
  if (isVersionedDataRequest(input, init)) {
    const isCurrent = await ensureCurrentAppVersion({ force: true });
    if (!isCurrent) {
      // 버전 불일치 시 appVersion에서 이미 새 페이지로 이동을 시작했다.
      // 기존 화면의 오류 처리기가 경고창을 띄우거나 저장 요청을 전송하지
      // 않도록 현재 요청은 페이지가 교체될 때까지 대기시킨다.
      return new Promise(() => {});
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
