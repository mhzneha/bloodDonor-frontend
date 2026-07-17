import { useAuth } from "@/context/AuthContext";
import { FontAwesome6, Fontisto } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const { user, token, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await axios.delete(
              "https://blood-donor-finder-be.onrender.com/users/sign_out",
              { headers: { Authorization: `Bearer ${token}` } },
            );
          } catch (error: any) {
            console.log("Sign out request failed:", error);
            // Don't block local logout on a failed server call —
            // the user should still be signed out on-device.
          } finally {
            await logout();
            setLoading(false);
            router.replace("/login");
          }
        },
      },
    ]);
  };

  const menuItems = [
    {
      icon: <FontAwesome6 name="user-large" size={20} color="#6b7280" />,
      label: "View My Donor Profile",
      subtitle: "See your public donor profile",
      onPress: () => router.push("/blood-donor/detail"),
    },
    {
      icon: <FontAwesome6 name="pen-to-square" size={20} color="#ED3632" />,
      label: "Edit Profile",
      subtitle: "Update your name and email",
      onPress: () => router.push("/blood-donor/update"),
    },
    {
      icon: <Fontisto name="blood-drop" size={20} color="#ED3632" />,
      label: "My Blood Requests",
      subtitle: "View requests you've made",
      onPress: () => router.push("/blood-request/my-request"),
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-zinc-50 dark:bg-zinc-950"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="px-5 pb-6 bg-white border-b dark:bg-zinc-900 pt-14 border-zinc-100 dark:border-zinc-800">
        <Text className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          Profile
        </Text>
      </View>

      {/* Avatar Card */}
      <View
        className="flex-row items-center gap-4 p-5 mx-4 mt-5 bg-white border dark:bg-zinc-900 rounded-2xl border-zinc-100 dark:border-zinc-800"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="items-center justify-center w-16 h-16 bg-red-100 border-2 border-red-200 rounded-full dark:bg-red-950 dark:border-red-800">
          <Text className="text-2xl font-black text-red-500">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-black text-zinc-900 dark:text-white">
            {user?.name || "User"}
          </Text>

          <Text className="text-zinc-400 text-sm mt-0.5">
            {user?.email || "No email"}
          </Text>

          <Text className="mt-1 text-xs text-zinc-400">
            <FontAwesome6 name="phone-volume" size={10} color="#ED3632" />
            {"  "}
            <Text className=" text-zinc-400">{user?.phone_number}</Text>
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <View
        className="mx-4 mt-4 overflow-hidden bg-white border dark:bg-zinc-900 rounded-2xl border-zinc-100 dark:border-zinc-800"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={item.onPress}
            className={`flex-row items-center px-4 py-4 gap-4 ${index < menuItems.length - 1 ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}
            activeOpacity={0.6}
          >
            <View className="items-center justify-center w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800">
              <Text className="text-lg">{item.icon}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-zinc-900 dark:text-white">
                {item.label}
              </Text>
              <Text className="text-zinc-400 text-xs mt-0.5">
                {item.subtitle}
              </Text>
            </View>
            <Text className="text-lg text-zinc-300 dark:text-zinc-600">›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        disabled={loading}
        className="items-center justify-center py-4 mx-4 mt-4 bg-primary-100 rounded-2xl"
        style={{
          shadowColor: "#dc2626",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-black text-white">Log Out</Text>
        )}
      </TouchableOpacity>

      <Text className="mt-6 text-xs text-center text-zinc-300 dark:text-zinc-700">
        Blood Donor Finder v1.0
      </Text>
    </ScrollView>
  );
}
