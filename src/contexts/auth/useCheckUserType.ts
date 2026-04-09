
import { useState, useCallback } from "react";
// Local User type (replaces @supabase/supabase-js)
type User = { id: string; email?: string; user_metadata?: Record<string, any> };
import { supabase } from "@/integrations/supabase/client";
import { UserType } from "./types";

export const useCheckUserType = () => {
  const [isProviderApproved, setIsProviderApproved] = useState(false);
  
  const checkUserType = useCallback(async (userId: string): Promise<UserType> => {
    console.log("Checking user type for:", userId);
    try {
      // Check if user is a consumer
      const { data: consumerData, error: consumerError } = await supabase
        .from("consumer_details")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      console.log("Consumer check:", consumerData ? "Found" : "Not found", consumerError);

      if (!consumerError && consumerData) {
        console.log("User is a consumer");
        return "consumer";
      }

      // Check if user is a provider
      const { data: providerData, error: providerError } = await supabase
        .from("provider_details")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      console.log("Provider check:", providerData ? "Found" : "Not found", providerError);

      if (!providerError && providerData) {
        console.log("User is a provider");
        // Check provider status
        setIsProviderApproved(providerData.status === "approved");
        return "provider";
      }

      return null;
    } catch (error) {
      console.error("Error checking user type:", error);
      return null;
    }
  }, []);

  const checkAdminStatus = useCallback((user: User | null): boolean => {
    if (!user) return false;
    
    // Admin emails list - this could be stored in a database table in production
    const adminEmails = [
      'admin@example.com',
      'admin@cura.com',
      'admin@admin.com'
    ];
    
    // Check if user's email is in the admin list
    return adminEmails.includes(user.email || '');
  }, []);

  return { 
    checkUserType, 
    checkAdminStatus, 
    isProviderApproved 
  };
};
