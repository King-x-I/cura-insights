import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/database';
import { Provider, ProviderSignupData } from '@/types/provider';
// Local type (replaces @supabase/supabase-js PostgrestError)
type PostgrestError = { message: string; details?: string; hint?: string; code?: string };

type ProviderDetails = Database['public']['Tables']['provider_details']['Insert'];
type ProviderStatus = 'pending' | 'approved' | 'rejected';

export class ProviderService {
  static async signup(data: {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    service_type: string;
    experience_years: number;
    skills: string[];
    govt_id_url: string;
    license_url: string;
    profile_picture: string;
    languages: string[];
    id_type: string;
    id_number: string;
    driving_license_number: string;
    vehicle_type: string;
    license_expiry_date: string;
    working_hours_from: string;
    working_hours_to: string;
    bank_account_name: string;
    bank_account_number: string;
    ifsc_code: string;
    upi_id: string;
    resume_url: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting provider signup with data:', {
        email: data.email,
        full_name: data.full_name
      });
      
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return { success: false, error: 'User not authenticated' };
      }

      if (!user) {
        console.error('No user found in auth');
        return { success: false, error: 'User not found' };
      }

      console.log('Found authenticated user:', user.id);

      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('provider_details')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        return { success: false, error: 'Error checking existing profile' };
      }

      if (existingProfile) {
        console.log('Provider profile already exists');
        return { success: true };
      }

      // Prepare provider data
      const providerData = {
        user_id: user.id,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        service_type: data.service_type,
        experience_years: data.experience_years,
        skills: data.skills.join(','),
        govt_id_url: data.govt_id_url,
        license_url: data.license_url,
        profile_picture: data.profile_picture,
        languages: data.languages.join(','),
        id_type: data.id_type,
        id_number: data.id_number,
        driving_license_number: data.driving_license_number,
        vehicle_type: data.vehicle_type,
        license_expiry_date: data.license_expiry_date,
        working_hours_from: data.working_hours_from,
        working_hours_to: data.working_hours_to,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number,
        ifsc_code: data.ifsc_code,
        upi_id: data.upi_id,
        resume_url: data.resume_url,
        status: 'pending',
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Inserting provider data for user:', user.id);

      // Insert provider data
      const { data: insertedData, error: insertError } = await supabase
        .from('provider_details')
        .insert(providerData)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting provider data:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        return { success: false, error: insertError.message };
      }

      console.log('Successfully created provider profile:', insertedData);
      return { success: true };
    } catch (error) {
      console.error('Error in provider signup:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async updateAvailability(isOnline: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData?.user) {
        console.error('Error retrieving user:', userError);
        return { success: false, error: 'Failed to retrieve user information' };
      }

      const { error: updateError } = await supabase
        .from('provider_details')
        .update({ 
          is_online: isOnline,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userData.user.id);

      if (updateError) {
        console.error('Error updating availability:', updateError);
        return { success: false, error: 'Failed to update availability' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating availability:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async getProviderStatus(userId: string): Promise<{ 
    data: { status: ProviderStatus; is_online: boolean } | null; 
    error: PostgrestError | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('status, is_online')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      // Ensure the status is cast to the expected ProviderStatus type
      return { 
        data: data ? { 
          status: data.status as ProviderStatus, 
          is_online: data.is_online || false 
        } : null, 
        error: null 
      };
    } catch (error) {
      console.error('Error getting provider status:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  static async approveProvider(
    providerUserId: string, 
    approved: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('provider_details')
        .update({ 
          status: approved ? 'approved' : 'rejected' as ProviderStatus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', providerUserId);

      if (error) {
        console.error('Error approving provider:', error);
        return { success: false, error: 'Failed to update provider status' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error approving provider:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  static async getProviderDetails(
    userId: string
  ): Promise<{ data: any | null; error: PostgrestError | null }> {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting provider details:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  static async getAllPendingProviders(): Promise<{ 
    data: any[] | null; 
    error: PostgrestError | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('provider_details')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting pending providers:', error);
      return { data: null, error: error as PostgrestError };
    }
  }

  static async checkProviderData(userId: string) {
    console.log('Checking provider data for user:', userId);
    
    try {
      // Check auth user
      const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
      if (authError) {
        console.error('Auth user check failed:', authError);
        return { auth: null, provider: null, error: authError };
      }
      console.log('Auth user data:', authData);

      // Check provider details
      const { data: providerData, error: providerError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (providerError) {
        console.error('Provider data check failed:', providerError);
        return { auth: authData, provider: null, error: providerError };
      }
      console.log('Provider data:', providerData);

      return { auth: authData, provider: providerData, error: null };
    } catch (error) {
      console.error('Data check failed:', error);
      return { auth: null, provider: null, error };
    }
  }
}
