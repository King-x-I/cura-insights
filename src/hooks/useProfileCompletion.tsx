
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProfileCompletionHook {
  isProfileComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  checkProfileCompletion: () => Promise<void>;
  updateProfileCompletion: (fieldName: string, value: any) => Promise<void>;
}

interface ConsumerProfileFields {
  full_name: string | null;
  phone: string | null;
  profile_picture: string | null;
  address: string | null;
}

interface ProviderProfileFields {
  full_name: string | null;
  phone: string | null;
  profile_picture: string | null;
  address: string | null;
  govt_id_url: string | null;
  experience_years: number | null;
  service_type: string | null;
  license_url?: string | null;
  vehicle_type?: string | null;
  skills: string | null;
}

export const useProfileCompletion = (): ProfileCompletionHook => {
  const { user, userType } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [profileData, setProfileData] = useState<Record<string, any> | null>(null);

  const checkProfileCompletion = async () => {
    if (!user || !userType) {
      setIsProfileComplete(false);
      setCompletionPercentage(0);
      setMissingFields([]);
      return;
    }

    try {
      if (userType === "consumer") {
        await checkConsumerProfile();
      } else {
        await checkProviderProfile();
      }
    } catch (error) {
      console.error("Error checking profile completion:", error);
    }
  };

  const updateProfileCompletion = async (fieldName: string, value: any) => {
    if (!user || !userType || !profileData) return;

    try {
      const tableName = userType === "consumer" ? "consumer_details" : "provider_details";
      
      const { error } = await (supabase
        .from(tableName) as any)
        .update({ [fieldName]: value })
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Update local state
      const updatedProfileData = { ...profileData, [fieldName]: value };
      setProfileData(updatedProfileData);
      
      // Recalculate completion stats
      if (userType === "consumer") {
        calculateCompletion(updatedProfileData as ConsumerProfileFields, getConsumerRequiredFields());
      } else {
        calculateCompletion(updatedProfileData as unknown as ProviderProfileFields, getProviderRequiredFields(updatedProfileData as unknown as ProviderProfileFields));
      }
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      throw error;
    }
  };

  const checkConsumerProfile = async () => {
    const { data, error } = await supabase
      .from("consumer_details")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (error) throw error;
    
    // Ensure the data has the required fields by creating a properly typed object
    const profile: ConsumerProfileFields = {
      full_name: data.full_name || null,
      phone: data.phone || null,
      profile_picture: data.profile_picture || null,
      address: data.address || null
    };
    
    setProfileData(data);
    calculateCompletion(profile, getConsumerRequiredFields());
  };

  const checkProviderProfile = async () => {
    const { data, error } = await supabase
      .from("provider_details")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (error) throw error;
    
    setProfileData(data);
    // Cast to ProviderProfileFields to ensure proper typing
    const profile: ProviderProfileFields = {
      full_name: data.full_name || null,
      phone: data.phone || null,
      profile_picture: data.profile_picture || null,
      address: data.address || null,
      govt_id_url: data.govt_id_url || null,
      experience_years: data.experience_years || null,
      service_type: data.service_type || null,
      license_url: data.license_url || null,
      vehicle_type: data.vehicle_type || null,
      skills: data.skills || null,
    };
    
    calculateCompletion(profile, getProviderRequiredFields(profile));
  };

  const getConsumerRequiredFields = () => {
    return {
      full_name: "Full Name",
      phone: "Phone Number",
      profile_picture: "Profile Picture",
      address: "Address"
    };
  };

  const getProviderRequiredFields = (profile: ProviderProfileFields) => {
    const requiredFields: Record<string, string> = {
      full_name: "Full Name",
      phone: "Phone Number",
      profile_picture: "Profile Picture",
      address: "Address",
      govt_id_url: "Government ID",
      experience_years: "Experience",
      service_type: "Service Type",
      skills: "Skills"
    };

    // Add driver-specific fields if they're a driver
    if (profile.service_type === "driver") {
      requiredFields.license_url = "Driver's License";
      requiredFields.vehicle_type = "Vehicle Type";
    }

    return requiredFields;
  };

  const calculateCompletion = (
    profile: Record<string, any>,
    requiredFields: Record<string, string>
  ) => {
    const missing: string[] = [];
    let completeCount = 0;
    
    Object.entries(requiredFields).forEach(([key, label]) => {
      if (!profile[key]) {
        missing.push(label);
      } else {
        completeCount++;
      }
    });

    const totalFields = Object.keys(requiredFields).length;
    const percentage = Math.round((completeCount / totalFields) * 100);
    
    setMissingFields(missing);
    setCompletionPercentage(percentage);
    setIsProfileComplete(missing.length === 0);
  };

  useEffect(() => {
    checkProfileCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userType]);

  return {
    isProfileComplete,
    completionPercentage,
    missingFields,
    checkProfileCompletion,
    updateProfileCompletion
  };
};
