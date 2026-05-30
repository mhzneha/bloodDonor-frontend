// app/donor/live-tracking.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDistance } from "geolib";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    AppState,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import Toast from "react-native-toast-message";

const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

export default function DonorLiveTrackingScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tracking, setTracking] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lastCoords, setLastCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const donation = data?.donation_request;
  const bloodRequest = data?.blood_request;

  const donorLat = parseFloat(donation?.donor_latitude ?? "0");
  const donorLng = parseFloat(donation?.donor_longitude ?? "0");

  const requesterLat = parseFloat(bloodRequest?.latitude ?? "0");
  const requesterLng = parseFloat(bloodRequest?.longitude ?? "0");

  const distanceMeters =
    !isNaN(donorLat) &&
    !isNaN(donorLng) &&
    !isNaN(requesterLat) &&
    !isNaN(requesterLng)
      ? getDistance(
          {
            latitude: donorLat,
            longitude: donorLng,
          },
          {
            latitude: requesterLat,
            longitude: requesterLng,
          },
        )
      : 0;

  const distanceKm =
    distanceMeters > 0 ? (distanceMeters / 1000).toFixed(2) : "0.00";

  const fetchTrackingData = async () => {
    const token = await AsyncStorage.getItem("auth_token");

    if (!token) return;

    const res = await axios.get(
      `${BASE_URL}/blood_donation_requests/${requestId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    setData(res.data);
  };

  useEffect(() => {
    fetchTrackingData();
  }, []);

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

      console.log("donorLat:", donorLat);
      console.log("donorLng:", donorLng);
      console.log("requesterLat:", requesterLat);
      console.log("requesterLng:", requesterLng);
      console.log("lastCoords:", lastCoords);

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

  const styles = StyleSheet.create({
    liveMarker: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(220,38,38,0.3)",
      justifyContent: "center",
      alignItems: "center",
    },

    liveDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#dc2626",
    },
  });

  if (!data || !data.donation_request || !data.blood_request) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* MAP */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: requesterLat || donorLat || 27.7172,
          longitude: requesterLng || donorLng || 85.324,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* 🔴 Donor */}
        {lastCoords && (
          <Marker
            coordinate={{
              latitude: lastCoords.lat,
              longitude: lastCoords.lng,
            }}
          >
            <View style={styles.liveMarker}>
              <View style={styles.liveDot} />
            </View>
          </Marker>
        )}

        {/* 🟦 Requester */}
        {requesterLat && requesterLng && (
          <Marker
            coordinate={{
              latitude: requesterLat,
              longitude: requesterLng,
            }}
            title={bloodRequest?.hospital_name || "Requester"}
            pinColor="blue"
          />
        )}
      </MapView>

      {/* FLOATING CONTROL PANEL */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: 20,
          right: 20,
          backgroundColor: "white",
          padding: 16,
          borderRadius: 16,
          elevation: 5,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
          {tracking ? "Sharing Location 📡" : "Tracking Paused"}
        </Text>

        <Text style={{ marginBottom: 8, color: "#6b7280" }}>
          {`Distance: ${distanceKm} km`}
        </Text>

        <Text style={{ color: "#6b7280", marginBottom: 10 }}>
          {lastCoords
            ? `${lastCoords.lat.toFixed(5)}, ${lastCoords.lng.toFixed(5)}`
            : "Waiting for location..."}
        </Text>

        <TouchableOpacity
          onPress={tracking ? stopTracking : startTracking}
          style={{
            backgroundColor: tracking ? "#dc2626" : "#16a34a",
            padding: 12,
            borderRadius: 10,
            marginBottom: 8,
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "700" }}
          >
            {tracking ? "Stop Tracking" : "Start Tracking"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            stopTracking();
            router.back();
          }}
        >
          <Text style={{ textAlign: "center", color: "#6b7280" }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
