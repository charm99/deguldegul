import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user) => {
    if (!user?.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("degul_users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("profile load error:", error);
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data || null;
  }, []);

  const refreshSession = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("session load error:", error);
      setAuthUser(null);
      setProfile(null);
      setLoading(false);
      return null;
    }

    const user = session?.user ?? null;
    setAuthUser(user);

    const loadedProfile = await loadProfile(user);

    setLoading(false);

    return {
      user,
      profile: loadedProfile,
    };
  }, [loadProfile]);

  useEffect(() => {
    refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;

      setLoading(true);
      setAuthUser(user);

      setTimeout(async () => {
        await loadProfile(user);
        setLoading(false);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, loadProfile]);

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        authUser,
        profile,
        loading,
        isLoggedIn: !!authUser,
        reloadProfile: () => loadProfile(authUser),
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}