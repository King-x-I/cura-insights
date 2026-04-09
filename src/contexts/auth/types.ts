
export type UserType = "consumer" | "provider" | "admin" | null;

// Separate interfaces for profile data to avoid circular references
export interface ConsumerDetails {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  profile_picture: string | null;
  created_at: string | null;
}

export interface ProviderDetails {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_picture: string | null;
  is_approved: boolean | null;
}

// Add a basic type for other provider fields
export interface ProviderDetailExtras {
  [key: string]: any;
}

// Use type intersection instead of extending to avoid circularity
export type ProviderDetailsWithExtras = ProviderDetails & ProviderDetailExtras;

export interface AuthContextState {
  user: any | null;
  session: any | null;
  userType: UserType;
  isLoading: boolean;
  isProviderApproved: boolean;
  signIn: (email: string, password: string, userType: "consumer" | "provider") => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName: string, userType: "consumer" | "provider") => Promise<void>;
  signOut: () => Promise<void>;
  setUserType: (type: UserType) => void;
}
