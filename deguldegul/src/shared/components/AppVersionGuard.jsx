import { useEffect, useState } from "react";
import { ensureCurrentAppVersion } from "../../services/appVersion";

function AppVersionGuard({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    ensureCurrentAppVersion({ force: true }).then((isCurrent) => {
      if (active && isCurrent) setReady(true);
    });

    const checkVersion = () => {
      if (document.visibilityState === "visible") {
        ensureCurrentAppVersion({ force: true });
      }
    };
    const intervalId = window.setInterval(checkVersion, 5 * 60_000);
    window.addEventListener("focus", checkVersion);
    document.addEventListener("visibilitychange", checkVersion);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", checkVersion);
      document.removeEventListener("visibilitychange", checkVersion);
    };
  }, []);

  if (!ready) {
    return (
      <div role="status" style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#fff", color: "#777", fontFamily: "Pretendard, sans-serif", fontSize: 13 }}>
        최신 버전을 확인하고 있습니다.
      </div>
    );
  }

  return children;
}

export default AppVersionGuard;
