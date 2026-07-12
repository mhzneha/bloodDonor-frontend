// lib/api/notifications.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  notifiable_id: number;
  notifiable_type: "BloodDonationRequest" | "BloodRequest" | string;
  read_at: string | null;
  created_at: string;
  data?: {
    blood_request_id?: number;
    donor_id?: number;
    [key: string]: any;
  };
}

const authHeaders = async () => {
  const token = await AsyncStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

export const fetchNotifications = async (): Promise<AppNotification[]> => {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE_URL}/notifications`, { headers });
  console.log("NOTIF RAW:", JSON.stringify(data, null, 2)); // temp
  return data.notifications ?? data;
};

export const markNotificationAsRead = async (id: number) => {
  const headers = await authHeaders();
  const { data } = await axios.patch(
    `${BASE_URL}/notifications/${id}/read`,
    {},
    { headers },
  );
  return data;
};

export const markAllNotificationsAsRead = async () => {
  const headers = await authHeaders();
  const { data } = await axios.patch(
    `${BASE_URL}/notifications/read_all`,
    {},
    { headers },
  );
  return data;
};
