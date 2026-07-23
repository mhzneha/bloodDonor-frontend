import CustomHeader from "@/components/CustomHeader";
import { FontAwesome6 } from "@expo/vector-icons";
import Fontisto from "@expo/vector-icons/build/Fontisto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

type Donor = {
  id: number;
  blood_group: string;
  available: boolean;
  latitude: string;
  longitude: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
  };
};

export default function FindDonorsScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);

  // Fetch all donors from API
  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        const res = await axios.get(`${BASE_URL}/donor_profiles`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = res.data.donors as Donor[];

        // Filter out donors with missing or 0 coordinates
        const validDonors = data.filter((d) => {
          const lat = parseFloat(d.latitude);
          const lng = parseFloat(d.longitude);
          return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
        });

        setDonors(validDonors);
      } catch (err) {
        console.log("Fetch donors error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, []);

  // Auto-fit map to show all donor markers
  useEffect(() => {
    if (isMapReady && donors.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(
        donors.map((d) => ({
          latitude: parseFloat(d.latitude),
          longitude: parseFloat(d.longitude),
        })),
        {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        },
      );
    }
  }, [donors, isMapReady]);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#dc2626" />
        <Text className="mt-2.5 text-zinc-500">Loading donors map...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CustomHeader title="Find Donors" />

      <MapView
        ref={mapRef}
        onMapReady={() => setIsMapReady(true)}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: 27.6682266,
          longitude: 85.3337006,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {donors.map((donor) => (
          <Marker
            key={donor.id}
            coordinate={{
              latitude: parseFloat(donor.latitude),
              longitude: parseFloat(donor.longitude),
            }}
            title={donor.user.name}
            description={`Blood Group: ${donor.blood_group}`}
            pinColor={donor.available ? "green" : "gray"}
            onCalloutPress={() => setSelectedDonor(donor)}
            onPress={() => setSelectedDonor(donor)}
          />
        ))}
      </MapView>

      {/* DONOR DETAILS PANEL */}
      {selectedDonor && (
        <View
          className="absolute p-4 bg-white shadow-lg rounded-2xl"
          style={{ bottom: 30, left: 20, right: 20 }}
        >
          <Text className="mb-1 text-lg font-bold">
            {selectedDonor.user.name}
          </Text>

          <Text className="mb-0.5 text-zinc-500">
            <Fontisto name="blood-drop" size={18} color="#ED3632" /> Blood
            Group: {selectedDonor.blood_group}
          </Text>

          <Text className="mb-0.5 text-zinc-500">
            <FontAwesome6 name="phone-volume" size={15} color="#a1a1aa" />{" "}
            Phone: {selectedDonor.user.phone_number}
          </Text>

          <Text className="mb-2.5 text-zinc-500">
            Status: {selectedDonor.available ? "Available" : "Unavailable"}
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedDonor(null)}
            className="p-3 bg-blue-600 rounded-xl"
          >
            <Text className="font-bold text-center text-white">
              Close Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
