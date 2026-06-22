import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (user) => {
    if (!user) {
      setProfile(null);
      return;
    }

    const { data, error } = await supabase
      .from("degul_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("profile load error:", error);
      setProfile(null);
      return;
    }

    setProfile(data);
  };

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user ?? null;

      setAuthUser(user);
      await loadProfile(user);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;

      setAuthUser(user);
      await loadProfile(user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        authUser,
        profile,
        loading,
        isLoggedIn: !!authUser,
        reloadProfile: () => loadProfile(authUser),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}