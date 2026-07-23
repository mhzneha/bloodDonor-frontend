import CustomHeader from "@/components/CustomHeader";
import { FontAwesome6 } from "@expo/vector-icons";
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

  // Interval handle for the repeating location updates
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Guards against a stale startTracking() call (e.g. from Strict Mode's
  // mount -> cleanup -> mount cycle) resurrecting an interval after stop
  const stopRequestedRef = useRef(false);

  // Bumped every time startTracking() is called so any in-flight call
  // from a previous invocation can detect it's been superseded
  const trackingSessionRef = useRef(0);

  const [tracking, setTracking] = useState(false);
  const [data, setData] = useState<any>(null);
  const [lastCoords, setLastCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const donation = data?.donation_request;
  const bloodRequest = data?.blood_request;

  const patientName = bloodRequest?.patient_name ?? "the patient";

  const saveDecision = async (decision: "yes" | "no") => {
    try {
      await AsyncStorage.setItem(`donation_decision_${requestId}`, decision);
    } catch (e) {
      console.log("Failed to save donation decision:", e);
    }
  };

  const showCompletionPrompt = (
    onDecision: (decision: "yes" | "no") => void,
  ) => {
    Alert.alert(
      "Donation Completed?",
      `Did you complete a donation of ${patientName}?`,
      [
        {
          text: "No",
          style: "cancel",
          onPress: async () => {
            await saveDecision("no");
            onDecision("no");
          },
        },
        {
          text: "Yes",
          onPress: async () => {
            await saveDecision("yes");
            onDecision("yes");
          },
        },
      ],
      { cancelable: false },
    );
  };

  const handleStopTracking = () => {
    showCompletionPrompt((decision) => {
      stopTracking();
      if (decision === "yes") {
        router.back();
      }
    });
  };

  const handleGoBack = () => {
    showCompletionPrompt(() => {
      stopTracking();
      router.back();
    });
  };

  const donorLat = parseFloat(donation?.donor_latitude ?? "0");
  const donorLng = parseFloat(donation?.donor_longitude ?? "0");

  const requesterLat = parseFloat(bloodRequest?.latitude ?? "0");
  const requesterLng = parseFloat(bloodRequest?.longitude ?? "0");

  // Prefer live GPS coords over the stale value from the initial fetch
  const effectiveDonorLat = lastCoords?.lat ?? donorLat;
  const effectiveDonorLng = lastCoords?.lng ?? donorLng;

  const distanceMeters =
    !isNaN(effectiveDonorLat) &&
    !isNaN(effectiveDonorLng) &&
    !isNaN(requesterLat) &&
    !isNaN(requesterLng) &&
    (effectiveDonorLat !== 0 || effectiveDonorLng !== 0) &&
    (requesterLat !== 0 || requesterLng !== 0)
      ? getDistance(
          { latitude: effectiveDonorLat, longitude: effectiveDonorLng },
          { latitude: requesterLat, longitude: requesterLng },
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

      const { latitude, longitude } = location.coords;

      // If tracking was stopped while we were awaiting the GPS fix,
      // don't push a location update or resurrect state.
      if (stopRequestedRef.current) return;

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
    // Mark this as the active session; any earlier in-flight call becomes stale
    const session = ++trackingSessionRef.current;
    stopRequestedRef.current = false;

    await updateLocation(); // send immediately

    // Bail out if stopTracking() was called, or a newer startTracking()
    // call has already taken over, while we were awaiting the GPS fix.
    if (stopRequestedRef.current || session !== trackingSessionRef.current) {
      return;
    }

    // Always clear any existing interval before creating a new one so we
    // never end up with two intervals running concurrently.
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (stopRequestedRef.current) return;
      updateLocation();
    }, 10_000);

    setTracking(true);
    Toast.show({
      type: "success",
      text1: "Live Tracking Started",
      text2: "Your location is being shared.",
      position: "bottom",
    });
  };

  const stopTracking = () => {
    stopRequestedRef.current = true;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

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
      <CustomHeader title="Track" />
      {/* MAP */}
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: requesterLat || donorLat,
          longitude: requesterLng || donorLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Donor */}
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

        {/* Requester */}
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
        className="absolute p-6 bg-white rounded-2xl bottom-40 left-20 right-20"
        style={{
          elevation: 5,
          bottom: 40,
          right: 20,
          left: 20,
        }}
      >
        <Text className="mb-2 text-lg font-bold">
          {tracking ? "Sharing Location " : "Tracking Paused"}
        </Text>
        <Text className="mb-4 text-[#6b7280]">
          {`Distance: ${distanceKm} km`}
        </Text>
        {/* <Text style={{ color: "#6b7280", marginBottom: 10 }}>
          {lastCoords
            ? `${lastCoords.lat.toFixed(5)}, ${lastCoords.lng.toFixed(5)}`
            : "Waiting for location..."}
        </Text> */}
        <TouchableOpacity
          onPress={fetchTrackingData}
          className="bg-[#2563eb] p-4 rounded-lg mb-3 flex-row justify-center items-center gap-3"
        >
          <FontAwesome6 name="rotate-right" size={14} color="#fff" />
          <Text className="font-bold text-white">Refresh</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-center text-[#6b7280]">Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
