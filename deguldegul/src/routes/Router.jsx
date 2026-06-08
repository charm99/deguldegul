import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import SignupPage from "../pages/auth/SignupPage";
import HomePage from "../pages/home/HomePage";

function Router() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/signup"
          element={<SignupPage />}
        />

        <Route
          path="/home"
          element={<HomePage />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default Router;