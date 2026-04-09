import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserType, AuthContextState } from "./types";
import { useCheckUserType } from "./useCheckUserType";
import { signOutUser, logUser, createConsumerProfile, createProviderProfile } from "./utils";

type AuthContextType = AuthContextState | undefined;
const AuthContext = createContext<AuthContextType>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userType, setUserType] = useState<UserType>(null);
  const navigate = useNavigate();
  const { checkUserType, checkAdminStatus, isProviderApproved } = useCheckUserType();

  useEffect(() => {
    console.log("Setting up auth context...");

    // Set up listener FIRST
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
            } else if (session.user.user_metadata?.user_type) {
              setUserType(session.user.user_metadata.user_type);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUserType(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session ? "found" : "none");
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setTimeout(async () => {
          const detectedType = await checkUserType(session.user.id);
          if (detectedType) {
            setUserType(detectedType);
          } else if (checkAdminStatus(session.user)) {
            setUserType("admin");
          } else if (session.user.user_metadata?.user_type) {
            setUserType(session.user.user_metadata.user_type);
          }
          setIsLoading(false);
        }, 0);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, loginUserType: "consumer" | "provider") => {
    setIsLoading(true);
    console.log(`Signing in as ${loginUserType}: ${email}`);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("Login error:", error);
        throw new Error(error.message);
      }

      if (!data.user) throw new Error("No user data returned");

      console.log("Sign in successful:", logUser(data.user));

      // For providers, check approval status
      if (loginUserType === "provider") {
        const { data: providerData, error: providerError } = await supabase
          .from("provider_details")
          .select("*")
          .eq("user_id", data.user.id)
          .maybeSingle();

        console.log("Provider profile check:", providerData ? "found" : "not found", providerError);

        if (!providerData) {
          await supabase.auth.signOut();
          throw new Error("No provider profile found. Please sign up first.");
        }

        console.log("Provider status:", providerData.status, "is_approved:", providerData.is_approved);

        if (providerData.status === "rejected") {
          await supabase.auth.signOut();
          throw new Error("Your provider application has been rejected. Please contact support.");
        }

        if (providerData.status === "pending" || !providerData.is_approved) {
          await supabase.auth.signOut();
          throw new Error("Your account is pending approval. We'll notify you once your application is reviewed.");
        }
      }

      // For consumers, create profile if missing
      if (loginUserType === "consumer") {
        const { data: consumerData } = await supabase
          .from("consumer_details")
          .select("user_id")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (!consumerData) {
          console.log("Creating consumer profile on login...");
          await createConsumerProfile(
            data.user.id,
            email,
            data.user.user_metadata?.full_name || email.split("@")[0]
          );
        }
      }

      // Update user metadata with type
      await supabase.auth.updateUser({ data: { user_type: loginUserType } });

      setUserType(loginUserType);
      setUser(data.user);
      setSession(data.session);

      navigate(`/${loginUserType}/dashboard`, { replace: true });
      toast.success("Login successful!");
    } catch (error: any) {
      console.error("Login error:", error);
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
          queryParams: { access_type: "offline", prompt: "consent" },
          redirectTo: `${window.location.origin}/auth/google-callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  const signUp = async (email: string, password: string, fullName: string, signupUserType: "consumer" | "provider") => {
    setIsLoading(true);
    console.log(`Signing up as ${signupUserType}: ${email}, name: ${fullName}`);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, user_type: signupUserType },
          emailRedirectTo: `${window.location.origin}/${signupUserType}/login`,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("No user returned from signup");

      console.log("Signup successful:", logUser(data.user));

      // Create the appropriate profile
      if (signupUserType === "consumer") {
        await createConsumerProfile(data.user.id, email, fullName);
      } else {
        await createProviderProfile(data.user.id, email, fullName);
      }

      setUserType(signupUserType);

      if (signupUserType === "provider") {
        toast.success("Account created! Your application is pending admin approval. You'll be notified once approved.");
        // Sign out provider since they need approval first
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setUserType(null);
        navigate("/provider/login");
      } else {
        toast.success("Account created! Please check your email for verification.");
        navigate("/consumer/login");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
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
        setUserType: (type: UserType) => setUserType(type),
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
