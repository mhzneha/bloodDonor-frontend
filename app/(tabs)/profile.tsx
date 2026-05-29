import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);

      const response = await axios.delete(
        "http://192.168.101.18:3000/users/sign_out",
      );

      Alert.alert("Success", response.data.message);

      // redirect to login screen
      router.replace("/login");
    } catch (error: any) {
      console.log(error);

      Alert.alert("Error", error?.response?.data?.message || "Logout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="items-center justify-center flex-1 px-5 bg-white">
      <Text className="mb-10 text-3xl font-bold text-black">
        Profile Screen
      </Text>

      <TouchableOpacity
        onPress={() => {
          router.push("/blood-donor/detail");
        }}
        disabled={loading}
        className=""
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-lg font-semibold text-black-500">
            Donor Profile
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/blood-request/my-request")}
      >
        <Text>My Requests</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        disabled={loading}
        className="items-center justify-center w-full py-4 bg-red-600 rounded-2xl"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-lg font-semibold text-white">Log Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
