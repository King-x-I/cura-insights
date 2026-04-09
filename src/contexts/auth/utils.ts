
// Local User type (replaces @supabase/supabase-js)
type User = { id: string; email?: string; user_metadata?: Record<string, any> };
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Clean up user details to avoid debug logs cluttering
export const logUser = (user: User | null) => {
  if (!user) return null;
  const { id, email } = user;
  return { id, email };
};

// Create consumer profile
export const createConsumerProfile = async (userId: string, email: string, fullName: string) => {
  try {
    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from("consumer_details")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      console.log("Consumer profile already exists");
      return true;
    }

    // Create the profile with minimal required fields
    const { data, error: insertError } = await supabase
      .from("consumer_details")
      .insert({
        user_id: userId,
        email: email,
        full_name: fullName || email.split('@')[0],
        phone: null,
        address: null,
        profile_picture: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating consumer profile:", insertError);
      // Try to get more details about the error
      if (insertError.code === '23505') {
        console.error("Duplicate key error - profile might already exist");
        return true;
      }
      return false;
    }

    console.log("Consumer profile created:", data);
    return true;
  } catch (error) {
    console.error("Error creating consumer profile:", error);
    return false;
  }
};

// Create provider profile
export const createProviderProfile = async (userId: string, email: string, fullName: string) => {
  try {
    // First check if profile already exists
    const { data: existingProfile } = await supabase
      .from("provider_details")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfile) {
      console.log("Provider profile already exists");
      return true;
    }

    const { data, error: insertError } = await supabase
      .from("provider_details")
      .insert({
        user_id: userId,
        email: email,
        full_name: fullName || email.split('@')[0],
        phone: "", // Adding required fields
        id_type: "default", // Adding required fields
        id_number: "default", // Adding required fields
        service_type: "driver", // Adding required field
        status: "pending" as "pending" | "approved" | "rejected",  // Cast to the expected union type
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error("Error creating provider profile:", insertError);
      return false;
    }

    console.log("Provider profile created:", data);
    return true;
  } catch (error) {
    console.error("Error creating provider profile:", error);
    return false;
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await supabase.auth.signOut();
    toast.success("You've been logged out successfully");
    return true;
  } catch (error: any) {
    toast.error(error.message || "Failed to sign out");
    return false;
  }
};
