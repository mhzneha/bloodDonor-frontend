import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

const authHeaders = async () => {
  const token = await AsyncStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

export const fetchMe = async () => {
  const headers = await authHeaders();
  const { data } = await axios.get(`${BASE_URL}/user/me`, { headers });
  return data;
};

export const updatePushToken = async (pushToken: string) => {
  const headers = await authHeaders();
  const { data } = await axios.patch(
    `${BASE_URL}/user/push_token`,
    { push_token: pushToken },
    { headers },
  );
  return data;
};
