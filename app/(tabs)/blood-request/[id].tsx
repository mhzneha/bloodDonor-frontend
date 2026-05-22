import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type BloodRequest = {
  id: number;
  blood_group: string;
  contact_number: string;
  hospital_name: string;
  latitude: string;
  longitude: string;
  patient_name: string;
  urgency: string;
  units_required: number;
  created_at: string;
  status: string;
};

export default function RequestDetail() {
  const { id } = useLocalSearchParams();

  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequest = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      const res = await axios.get(
        "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = res.data.blood_requests;

      const found = data.find(
        (item: BloodRequest) => String(item.id) === String(id),
      );

      setRequest(found || null);
    } catch (err) {
      console.log("ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!request) {
    return (
      <View className="items-center justify-center flex-1">
        <Text>Request not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 p-5">
      {/* <Text className="text-lg font-bold">Blood Request ID: {request.id}</Text> */}

      <Text className="text-lg font-bold">Blood Request </Text>
      <View className="items-center justify-center my-5">
        <View className="items-center justify-center w-24 h-24 bg-red-100 rounded-full">
          <Image
            source={require("../../../assets/images/blood-donation.png")}
            className="!w-20 !h-20"
            resizeMode="contain"
          />
        </View>
      </View>

      <View className="space-y-3">
        <Text className="py-3 text-base font-bold border-b">
          Name: <Text className="font-normal">{request.patient_name}</Text>
        </Text>

        <Text className="py-3 !mt-0 text-base font-bold border-b">
          Blood Group:{" "}
          <Text className="font-normal">{request.blood_group}</Text>
        </Text>

        <Text className="py-3 !mt-0 text-base font-bold border-b">
          Hospital: <Text className="font-normal">{request.hospital_name}</Text>
        </Text>

        <Text className="py-3 !mt-0 text-base font-bold border-b">
          Contact: <Text className="font-normal">{request.contact_number}</Text>
        </Text>

        <Text className="py-3 !mt-0 text-base font-bold border-b">
          Units Required:{" "}
          <Text className="font-normal">{request.units_required}</Text>
        </Text>

        <Text className="py-3 !mt-0 text-base font-bold border-b">
          Urgency: <Text className="font-normal">{request.urgency}</Text>
        </Text>

        <Text className="pb-2 text-base font-bold border-b">
          Location:{" "}
          <Text className="font-normal">
            Lat: {request.latitude}, Lng: {request.longitude}
          </Text>
        </Text>

        <Text className="pb-2 text-base font-bold border-b">
          Created At:{" "}
          <Text className="font-normal">
            {new Date(request.created_at).toLocaleString()}
          </Text>
        </Text>
      </View>
      <View>
        <TouchableOpacity className="flex-1 bg-red-500 rounded-xl py-2.5 px-1 items-center mt-6">
          <Text className="text-sm font-semibold text-white">Donate Blood</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
