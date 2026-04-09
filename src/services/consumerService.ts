import { supabase } from "@/integrations/supabase/client";

export interface ConsumerProfile {
  id?: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  profile_picture?: string;
  preferred_language?: string;
  emergency_contact?: string;
}

export class ConsumerService {
  static async getProfile(userId: string): Promise<ConsumerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('consumer_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching consumer profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      return null;
    }
  }

  static async updateProfile(userId: string, profile: Partial<ConsumerProfile>): Promise<ConsumerProfile | null> {
    try {
      const { data, error } = await supabase
        .from('consumer_details')
        .update({
          ...profile,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating consumer profile:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return null;
    }
  }

  static async signup(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    address?: string;
  }): Promise<{ user: any; error: any }> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name
          }
        }
      });

      if (authError) throw authError;

      // Consumer details will be created automatically by the database trigger
      // But we can update additional fields if provided
      if (authData.user && (userData.phone || userData.address)) {
        await this.updateProfile(authData.user.id, {
          user_id: authData.user.id,
          phone: userData.phone,
          address: userData.address
        });
      }

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Error in consumer signup:', error);
      return { user: null, error };
    }
  }

  static async deleteProfile(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('consumer_details')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting consumer profile:', error);
      return false;
    }
  }
} 