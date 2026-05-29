// app/donor/live-tracking.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, AppState, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

const BASE_URL = "http://192.168.101.18:3000/api/v1";

export default function DonorLiveTrackingScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tracking, setTracking] = useState(false);
  const [lastCoords, setLastCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const updateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required for tracking.",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      setLastCoords({ lat: latitude, lng: longitude });

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      await axios.patch(
        `${BASE_URL}/blood_donation_requests/${requestId}/update_location`,
        {
          donor_latitude: latitude.toString(),
          donor_longitude: longitude.toString(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (err) {
      console.log("Location update error:", err);
    }
  };

  const startTracking = async () => {
    await updateLocation(); // send immediately
    intervalRef.current = setInterval(updateLocation, 10_000); // then every 10s
    setTracking(true);
    Toast.show({
      type: "success",
      text1: "Live Tracking Started",
      text2: "Your location is being shared.",
      position: "bottom",
    });
  };

  const stopTracking = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTracking(false);
    Toast.show({
      type: "info",
      text1: "Tracking Stopped",
      position: "bottom",
    });
  };

  // Auto-start on mount
  useEffect(() => {
    startTracking();
    return () => stopTracking();
  }, []);

  // Stop tracking if app goes to background for safety
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" && tracking) stopTracking();
    });
    return () => sub.remove();
  }, [tracking]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
      }}
    >
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📍</Text>
      <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 8 }}>
        {tracking ? "Sharing Location" : "Tracking Paused"}
      </Text>
      <Text style={{ color: "#6b7280", textAlign: "center", marginBottom: 24 }}>
        {tracking
          ? "The requester can see your real-time location."
          : "Tap below to resume sharing your location."}
      </Text>

      {lastCoords && (
        <Text style={{ color: "#9ca3af", fontSize: 12, marginBottom: 24 }}>
          Last: {lastCoords.lat.toFixed(5)}, {lastCoords.lng.toFixed(5)}
        </Text>
      )}

      <TouchableOpacity
        onPress={tracking ? stopTracking : startTracking}
        style={{
          backgroundColor: tracking ? "#dc2626" : "#16a34a",
          paddingVertical: 14,
          paddingHorizontal: 40,
          borderRadius: 14,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
          {tracking ? "Stop Tracking" : "Resume Tracking"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => {
          stopTracking();
          router.back();
        }}
      >
        <Text style={{ color: "#6b7280", marginTop: 8 }}>Done / Go back</Text>
      </TouchableOpacity>
    </View>
  );
}
