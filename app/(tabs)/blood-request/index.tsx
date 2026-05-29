import RequestCard from "@/components/request-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL =
  "http://192.168.101.18:3000/api/v1/blood_requests";

export default function BloodRequestIndex() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      setData(res.data.blood_requests); // ✅ IMPORTANT
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[17px] font-bold text-gray-900">
            Blood Request
          </Text>

          <TouchableOpacity onPress={fetchRequests}>
            <Text className="text-sm font-semibold text-red-500">Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Cards */}
        {data.map((item) => (
          <RequestCard
            key={item.id}
            item={{
              id: String(item.id),
              name: item.patient_name,
              location: item.hospital_name,
              time: new Date(item.created_at).toLocaleString(),
              bloodGroup: item.blood_group,
            }}
          />
        ))}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/blood-request/create")}
        className="absolute bottom-6 right-6 bg-primary-200  px-5 py-3 rounded-xl"
      >
        <Text className="font-bold text-white">+ Add Request</Text>
      </TouchableOpacity>
    </View>
  );
}
