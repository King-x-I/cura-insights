export interface Provider {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  service_type: string;
  experience_years: number;
  skills: string[];
  govt_id_url: string;
  license_url: string;
  profile_picture?: string;
  status: 'pending' | 'approved' | 'rejected';
  is_online?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type ProviderSignupData = Omit<Provider, 'user_id' | 'status' | 'is_online' | 'created_at' | 'updated_at'>; 