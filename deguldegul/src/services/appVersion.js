/* global __APP_VERSION__ */
export const APP_VERSION = __APP_VERSION__;

const VERSION_CHECK_INTERVAL = 60_000;
let lastCheckedAt = 0;
let pendingCheck = null;
let refreshing = false;

async function fetchDeployedVersion() {
  const response = await fetch(`/version.json?t=${Date.now()}`, {
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

export async function ensureCurrentAppVersion({ force = false, blockOnFailure = false } = {}) {
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

      return !blockOnFailure;
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
  return url.includes("/rest/v1/") && method !== "GET" && method !== "HEAD";
}
