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
  "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests";

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

      setData(res.data.blood_requests);
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
      <View className="flex-row items-center justify-between px-5 pb-6 bg-white border-b dark:bg-zinc-900 pt-14 border-zinc-100 dark:border-zinc-800">
        {/* <Text className="mb-1 text-xs font-bold tracking-widest text-red-500">
                  BLOOD DONOR FINDER
                </Text> */}
        <Text className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          Blood Request
        </Text>
        <TouchableOpacity onPress={fetchRequests}>
          <Text className="text-sm font-semibold text-red-500">Refresh</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1 bg-zinc-50 dark:bg-zinc-950"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cards */}
        <View className="px-5">
          {data.map((item) => (
            <RequestCard
              key={item.id}
              item={{
                id: String(item.id),
                name: item.patient_name,
                location: item.hospital_name,
                time: new Date(item.created_at).toLocaleString(),
                bloodGroup: item.blood_group,
                phone_number: item.contact_number,
                unitsRequired: item.units_required,
                unitsCollected: item.units_collected,
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/blood-request/create")}
        className="absolute px-5 py-3 bottom-6 right-6 bg-primary-200 rounded-xl"
      >
        <Text className="font-bold text-white">+ Add Request</Text>
      </TouchableOpacity>
    </View>
  );
}
