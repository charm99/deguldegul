import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
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
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#fff" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={30} />
          <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 13 }}>
            최신 버전을 확인하고 있습니다.
          </Typography>
        </Box>
      </Box>
    );
  }

  return children;
}

export default AppVersionGuard;
