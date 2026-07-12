import RequestCard from "@/components/request-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests/my_requests";

export default function MyRequestsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyRequests = async () => {
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
      console.log("MY REQUEST FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <View className="flex-1 ">
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
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-[18px] font-bold text-gray-900 dark:text-gray-300">
            My Requests
          </Text>

          <TouchableOpacity onPress={fetchMyRequests}>
            <Text className="text-sm font-semibold text-red-500">Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Empty State */}
        {data.length === 0 && (
          <View className="items-center mt-20">
            <Text className="text-base text-gray-500">
              No blood requests found
            </Text>
          </View>
        )}

        {/* Request Cards */}
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
      </ScrollView>
    </View>
  );
}
