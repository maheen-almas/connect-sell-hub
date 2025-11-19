import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'admin' | 'worker';

export interface UserProfile {
  id: string;
  email: string;
  role: AppRole;
}

export const authHelpers = {
  async signUp(email: string, password: string, role: AppRole) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData) return null;

    return {
      id: user.id,
      email: user.email!,
      role: roleData.role as AppRole,
    };
  },
};
