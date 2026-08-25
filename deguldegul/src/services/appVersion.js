/* global __APP_VERSION__ */
export const APP_VERSION = __APP_VERSION__;

const VERSION_CHECK_INTERVAL = 60_000;
let lastCheckedAt = 0;
let pendingCheck = null;
let refreshing = false;

async function fetchDeployedVersion() {
  const response = await fetch("/version.json", {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });

  if (!response.ok) throw new Error(`버전 확인 실패 (${response.status})`);
  const result = await response.json();
  return String(result.version || "");
}

async function clearBrowserCaches() {
  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
  }

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }
}

async function reloadWithVersion(version) {
  if (refreshing) return;
  refreshing = true;

  try {
    await clearBrowserCaches();
  } finally {
    const url = new URL(window.location.href);
    url.searchParams.set("_appVersion", version);
    window.location.replace(url.toString());
  }
}

export async function ensureCurrentAppVersion({ force = false } = {}) {
  if (import.meta.env.DEV) return true;
  if (refreshing) return false;

  const now = Date.now();
  if (!force && now - lastCheckedAt < VERSION_CHECK_INTERVAL) return true;
  if (pendingCheck) return pendingCheck;

  pendingCheck = (async () => {
    try {
      const deployedVersion = await fetchDeployedVersion();
      lastCheckedAt = Date.now();

      if (deployedVersion && deployedVersion !== APP_VERSION) {
        await reloadWithVersion(deployedVersion);
        return false;
      }

      return true;
    } catch (error) {
      // 일시적인 네트워크 장애 때문에 정상 사용까지 막지는 않는다.
      console.warn("앱 버전을 확인하지 못했습니다.", error);
      return true;
    } finally {
      pendingCheck = null;
    }
  })();

  return pendingCheck;
}

export function isVersionedDataRequest(input, init = {}) {
  const method = String(init.method || (input instanceof Request ? input.method : "GET"))
    .toUpperCase();
  const url = String(input instanceof Request ? input.url : input);

  // PostgREST RPC는 조회 함수도 POST를 사용한다. get_* 계열은 데이터를
  // 변경하지 않으므로 저장 요청 버전 차단 대상에서 제외한다.
  const rpcMarker = "/rest/v1/rpc/";
  if (method === "POST" && url.includes(rpcMarker)) {
    const rpcName = url.split(rpcMarker)[1]?.split(/[?#]/)[0] || "";
    if (rpcName.startsWith("get_") || rpcName.startsWith("admin_get_")) {
      return false;
    }
  }

  return url.includes("/rest/v1/") && method !== "GET" && method !== "HEAD";
}
