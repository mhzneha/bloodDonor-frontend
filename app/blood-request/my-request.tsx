import CustomHeader from "@/components/CustomHeader";
import RequestCard from "@/components/request-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

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
      <CustomHeader title="My Request" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5">
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
              isMyRequest
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
    </View>
  );
}
