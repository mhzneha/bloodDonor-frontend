export type DonorUser = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
};

export type Donor = {
  id: number;
  blood_group: string;
  created_at: string;
  last_active_at: string | null;
  last_donated_at: string | null;
  latitude: string;
  longitude: string;
  location: string | null;
  updated_at: string;
  user_id: number;
  verified: boolean | null;
  available: boolean;
  user: DonorUser;
};