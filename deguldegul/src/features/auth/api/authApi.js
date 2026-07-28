import { supabase } from "../../../services/supabase";

export const getSession = () => supabase.auth.getSession();
export const getCurrentUser = () => supabase.auth.getUser();
export const signIn = (credentials) => supabase.auth.signInWithPassword(credentials);
export const signUp = (credentials) => supabase.auth.signUp(credentials);
export const signOut = () => supabase.auth.signOut();
export const updateAuthUser = (values) => supabase.auth.updateUser(values);
export const onAuthStateChange = (callback) => supabase.auth.onAuthStateChange(callback);

export function fetchProfile(userId) {
  return supabase.from("degul_users").select("*").eq("id", userId).maybeSingle();
}

export function createProfile(values) {
  return supabase.from("degul_users").insert(values);
}

export function updateProfile(userId, values) {
  return supabase.from("degul_users").update(values).eq("id", userId);
}
