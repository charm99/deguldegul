import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { AuthProvider } from "./contexts/AuthContext.jsx";
import { CommonCodeProvider } from "./contexts/CommonCodeContext.jsx";
import AppVersionGuard from "./shared/components/AppVersionGuard.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppVersionGuard>
      <AuthProvider>
        <CommonCodeProvider>
          <App />
        </CommonCodeProvider>
      </AuthProvider>
    </AppVersionGuard>
  </React.StrictMode>
);
