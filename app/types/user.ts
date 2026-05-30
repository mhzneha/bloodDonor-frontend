export type LoggedInUser = {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  is_admin: boolean;
  is_donor: boolean;
  created_at: string;
  updated_at: string;
  jti: string;
};
