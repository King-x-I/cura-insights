import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Local type definitions (replaces @supabase/supabase-js types)
type User = {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
  created_at?: string;
};

type Session = {
  access_token: string;
  user: User;
};
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserType, AuthContextState } from "./types";
import { useCheckUserType } from "./useCheckUserType";
import { 
  signOutUser, 
  logUser, 
  createConsumerProfile, 
  createProviderProfile 
} from "./utils";

// Use the simplified type definition to avoid deep instantiation
type AuthContextType = AuthContextState | undefined;

const AuthContext = createContext<AuthContextType>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const navigate = useNavigate();
  const { checkUserType, checkAdminStatus, isProviderApproved } = useCheckUserType();

  useEffect(() => {
    console.log("Setting up auth context...");
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state change event:", event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const detectedType = await checkUserType(session.user.id);
            
            if (detectedType) {
              setUserType(detectedType);
              console.log("Detected user type:", detectedType);
            } else if (checkAdminStatus(session.user)) {
              setUserType("admin");
              console.log("Detected admin user");
            } else if (session.user.user_metadata?.user_type) {
              setUserType(session.user.user_metadata.user_type);
              console.log("Using metadata user type:", session.user.user_metadata.user_type);
            }
            
            setIsLoading(false);
          }, 0);
        } else {
          setUserType(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session found" : "No session");
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const detectedType = await checkUserType(session.user.id);
          
          if (detectedType) {
            setUserType(detectedType);
            console.log("Initial detected user type:", detectedType);
          } else if (checkAdminStatus(session.user)) {
            setUserType("admin");
            console.log("Initial detected admin user");
          } else if (session.user.user_metadata?.user_type) {
            setUserType(session.user.user_metadata.user_type);
            console.log("Initial using metadata user type:", session.user.user_metadata.user_type);
          }
          
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, userType: "consumer" | "provider") => {
    setIsLoading(true);
    console.log(`Attempting to sign in as ${userType} with email: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        throw new Error(error.message || "Failed to sign in");
      }

      if (!data.user) {
        throw new Error("No user data returned after login");
      }
      
      console.log("Sign in successful:", logUser(data.user));
      
      const tableName = userType === "consumer" ? "consumer_details" : "provider_details";
      
      const { data: profileData, error: profileError } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", data.user.id)
        .maybeSingle();
      
      if (!profileData || profileError) {
        console.log(`${userType} profile not found or error occurred, creating one...`);
        const success = userType === "consumer" 
          ? await createConsumerProfile(
              data.user.id, 
              email, 
              data.user.user_metadata?.full_name || email.split('@')[0]
            )
          : await createProviderProfile(
              data.user.id, 
              email, 
              data.user.user_metadata?.full_name || email.split('@')[0]
            );
            
        if (!success) {
          console.error(`Failed to create ${userType} profile`);
          // Don't throw error here, continue with login
        }
      }
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { user_type: userType }
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
      }

      setUserType(userType);
      setUser(data.user);
      setSession(data.session);
      
      navigate(`/${userType}/dashboard`, { replace: true });
      toast.success("Login successful!");

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/auth/google-callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: "consumer" | "provider") => {
    setIsLoading(true);
    console.log(`Signing up as ${userType} with email: ${email}, name: ${fullName}`);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: userType,
          },
          emailRedirectTo: `${window.location.origin}/${userType}/dashboard`,
        },
      });

      if (error) throw error;
      console.log("Sign up successful:", logUser(data.user));

      if (userType === "consumer") {
        await createConsumerProfile(
          data.user.id,
          email,
          fullName
        );
      } else {
        await createProviderProfile(
          data.user.id,
          email,
          fullName
        );
      }

      setUserType(userType);
      toast.success(
        "Account created successfully! Please check your email for verification instructions."
      );
      
      navigate(`/${userType}/dashboard`);
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    const success = await signOutUser();
    if (success) {
      setUser(null);
      setSession(null);
      setUserType(null);
      navigate("/");
    }
  };
  
  const setUserTypeManually = (type: UserType) => {
    console.log("Manually setting user type to:", type);
    setUserType(type);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userType,
        isLoading,
        isProviderApproved,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        setUserType: setUserTypeManually,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
