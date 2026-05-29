import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// ── Types ─────────────────────────────────────────────────────────────────────
interface BloodRequest {
  id: number;
  blood_group: string;
  contact_number: string;
  created_at: string;
  hospital_name: string;
  latitude: string;
  longitude: string;
  patient_name: string;
  status: string;
  units_required: number;
  updated_at: string;
  urgency: "normal" | "urgent" | "critical";
  user_id: number;
}

// interface Donor {
//   id: number;
//   user_id: number;
//   blood_group: string;
//   available: boolean;
//   location: string | null;
//   latitude: string | null;
//   longitude: string | null;
//   last_donated_at: string | null;
//   verified: boolean | null;
//   last_active_at: string | null;
//   // user info may be nested depending on API
//   name?: string;
//   phone_number?: string;
//   email?: string;
//   user?: {
//     name?: string;
//     phone_number?: string;
//     email?: string;
//   };
// }
interface Donor {
  donor_id: number;
  donor_name: string;
  donor_phone_number: string;
  blood_group: string;
  distance_km: number;
  priority_score: number;
  verified: boolean | null;
  available: boolean;
}

interface MatchingDonorsResponse {
  blood_request: BloodRequest;
  donors: Donor[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "#ef4444",
  "A-": "#f97316",
  "B+": "#8b5cf6",
  "B-": "#a78bfa",
  "AB+": "#ec4899",
  "AB-": "#f472b6",
  "O+": "#dc2626",
  "O-": "#b91c1c",
};

const URGENCY_CONFIG = {
  normal: {
    label: "Normal",
    color: "#22c55e",
    bg: "#052e16",
    border: "#166534",
  },
  urgent: {
    label: "Urgent",
    color: "#f97316",
    bg: "#2a1500",
    border: "#9a3412",
  },
  critical: {
    label: "Critical",
    color: "#ef4444",
    bg: "#2a0a0a",
    border: "#991b1b",
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const timeAgo = (iso: string | null): string => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
};

const canDonate = (lastDonated: string | null) => {
  if (!lastDonated) return true;
  return Date.now() - new Date(lastDonated).getTime() >= 90 * 86400000;
};

// const getDonorName = (donor: Donor): string =>
//   donor.name || donor.user?.name || `Donor #${donor.user_id}`;

// const getDonorPhone = (donor: Donor): string | null =>
//   donor.phone_number || donor.user?.phone_number || null;

const getDonorName = (donor: Donor): string => donor.donor_name;

const getDonorPhone = (donor: Donor): string | null => donor.donor_phone_number;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const Skeleton = ({
  w,
  h,
  rounded = 8,
}: {
  w: number | string;
  h: number;
  rounded?: number;
}) => (
  <View
    style={{
      width: w as any,
      height: h,
      borderRadius: rounded,
      backgroundColor: "#F9FAFB",
    }}
  />
);

const DonorCardSkeleton = () => (
  <View
    className="p-4 mb-3 bg-gray-400 border border-gray-300 rounded-2xl"
    style={{ gap: 12 }}
  >
    <View className="flex-row items-center" style={{ gap: 12 }}>
      <Skeleton w={48} h={48} rounded={24} />
      <View style={{ gap: 6, flex: 1 }}>
        <Skeleton w={140} h={14} rounded={6} />
        <Skeleton w={100} h={11} rounded={4} />
      </View>
      <Skeleton w={40} h={40} rounded={20} />
    </View>
    <View className="flex-row" style={{ gap: 8 }}>
      <Skeleton w="48%" h={38} rounded={10} />
      <Skeleton w="48%" h={38} rounded={10} />
    </View>
  </View>
);

// ── Donor Card ────────────────────────────────────────────────────────────────
const DonorCard = ({
  donor,
  requestBloodGroup,
  onSendRequest,
}: {
  donor: Donor;
  requestBloodGroup: string;
  onSendRequest: () => void;
}) => {
  const router = useRouter();
  const bloodColor = BLOOD_GROUP_COLORS[donor.blood_group] ?? "#ef4444";
  //   const eligible = canDonate(donor.last_donated_at);
  const phone = getDonorPhone(donor);
  const name = getDonorName(donor);

  const callDonor = () => {
    if (!phone) {
      Alert.alert("No contact", "This donor hasn't provided a phone number.");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <View className="p-4 mb-3 bg-gray-100 shadow-sm rounded-2xl">
      {/* Top row */}
      <View className="flex-row items-center mb-3" style={{ gap: 12 }}>
        {/* Avatar */}
        {/* <View
          className="items-center justify-center border-2 rounded-full"
          style={{
            width: 48,
            height: 48,
            backgroundColor: bloodColor + "22",
            borderColor: bloodColor,
          }}
        >
          <Text style={{ fontSize: 20 }}>🩸</Text>
        </View> */}

        {/* Info */}
        <View style={{ flex: 1, gap: 3 }}>
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Text
              className="text-base font-bold text-black-300"
              numberOfLines={1}
            >
              {name}
            </Text>
            {donor.verified && (
              <View
                className="px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#1e3a5f" }}
              >
                <Text className="text-xs font-bold text-blue-400">✓</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center" style={{ gap: 6 }}>
            {/* Available badge */}
            <View
              className="flex-row items-center px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: donor.available ? "#14532d" : "#1c1917",
                borderWidth: 1,
                borderColor: donor.available ? "#166534" : "#44403c",
                gap: 4,
              }}
            >
              <View
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: donor.available ? "#4ade80" : "#78716c",
                }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: donor.available ? "#4ade80" : "#78716c" }}
              >
                {donor.available ? "Available" : "Unavailable"}
              </Text>
            </View>

            {/* Eligible badge */}
            {/* <View
              className="px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: eligible ? "#052e16" : "#422006",
                borderWidth: 1,
                borderColor: eligible ? "#14532d" : "#78350f",
              }}
            >
              <Text
                className="text-xs font-semibold"
                style={{ color: eligible ? "#4ade80" : "#fbbf24" }}
              >
                {eligible ? "Eligible" : "On wait"}
              </Text>
            </View> */}
          </View>

          {/* {donor.location && (
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              📍 {donor.location}
            </Text>
          )} */}
        </View>

        {/* Blood group circle */}
        <View
          className="items-center justify-center rounded-full"
          style={{
            width: 44,
            height: 44,
            backgroundColor: bloodColor,
          }}
        >
          <Text className="text-xs font-extrabold text-white">
            {donor.blood_group}
          </Text>
        </View>
      </View>

      {/* Meta row */}
      {/* <View
        className="flex-row items-center px-3 py-2 mb-3 rounded-xl"
        style={{ backgroundColor: "#111116", gap: 16 }}
      >
        <View style={{ gap: 2 }}>
          <Text className="text-xs text-gray-600">Last donated</Text>
          <Text className="text-xs font-semibold text-gray-300">
            {timeAgo(donor.last_donated_at)}
          </Text>
        </View>
        <View style={{ width: 1, height: 28, backgroundColor: "#2a2a36" }} />
        <View style={{ gap: 2 }}>
          <Text className="text-xs text-gray-600">Last active</Text>
          <Text className="text-xs font-semibold text-gray-300">
            {timeAgo(donor.last_active_at)}
          </Text>
        </View>
        <View style={{ width: 1, height: 28, backgroundColor: "#2a2a36" }} />
        <View style={{ gap: 2 }}>
          <Text className="text-xs text-gray-600">Donor ID</Text>
          <Text className="text-xs font-semibold text-gray-300">
            #{donor.id}
          </Text>
        </View>
      </View> */}

      {/* Meta row */}
      <View
        className="flex-row items-center justify-between px-3 py-2 mb-3 rounded-xl"
        style={{ gap: 14 }}
      >
        {/* Distance */}
        <View style={{ gap: 2 }}>
          <Text className="text-xs text-gray-700">Distance</Text>
          <Text className="text-xs font-semibold text-gray-500">
            {donor.distance_km ? `${donor.distance_km.toFixed(1)} km` : "—"}
          </Text>
        </View>

        {/* Verified */}
        <View style={{ gap: 2 }}>
          <Text className="text-xs text-gray-700">Verified</Text>
          <Text
            className="text-xs font-semibold"
            style={{
              color: donor.verified ? "#4ade80" : "#f87171",
            }}
          >
            {donor.verified ? "Yes" : "No"}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row" style={{ gap: 8 }}>
        <TouchableOpacity
          onPress={callDonor}
          className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 bg-primary-200"
          style={{ gap: 6 }}
          activeOpacity={0.85}
        >
          <FontAwesome6 name="phone-volume" size={15} color="#ffffff" />
          <Text className="text-sm font-bold text-white">Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSendRequest}
          className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 bg-primary-200"
          style={{ gap: 6 }}
          activeOpacity={0.85}
        >
          <FontAwesome name="send-o" size={15} color="#ffffff" />
          <Text className="text-sm font-bold text-white">Send Request</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/blood-donor",
              params: { id: donor.id },
            })
          }
          className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 border border-gray-700"
          style={{ backgroundColor: "#1a1a22", gap: 6 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 14 }}>👤</Text>
          <Text className="text-sm font-bold text-gray-200">Profile</Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/blood-donor/detail",
              params: { id: donor.donor_id.toString() },
            })
          }
          className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 border border-gray-700"
          style={{ backgroundColor: "#1a1a22", gap: 6 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 14 }}>👤</Text>
          <Text className="text-sm font-bold text-gray-200">Profile</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MatchingDonorsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<MatchingDonorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDonors = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const { data: res } = await axios.get<MatchingDonorsResponse>(
        `${BASE_URL}/blood_requests/${id}/matching_donors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      );
      // console.log("DONORS RESPONSE:", JSON.stringify(res, null, 2));

      setData(res);
    } catch (err: any) {
      console.log("ERROR:", err?.response?.data);
      if (err?.response?.status === 401) {
        Alert.alert("Session expired", "Please login again.");
        router.replace("/login");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load donors.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDonors();
    }, [id]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonors(true);
  };

  const urgency = data?.blood_request?.urgency ?? "normal";
  const urgencyConf = URGENCY_CONFIG[urgency] ?? URGENCY_CONFIG.normal;
  const bloodColor =
    BLOOD_GROUP_COLORS[data?.blood_request?.blood_group ?? ""] ?? "#ef4444";
  const donors = data?.donors ?? [];
  const availableDonors = donors.filter((d) => d.available);
  const unavailableDonors = donors.filter((d) => !d.available);

  // ── Error ─────────────────────────────────────────────────────────────────
  //   if (error) {
  //     return (
  //       <View
  //         className="items-center justify-center flex-1 px-8 bg-gray-950"
  //         style={{ gap: 16 }}
  //       >
  //         <Text style={{ fontSize: 48 }}>⚠️</Text>
  //         <Text className="text-base font-semibold text-center text-white">
  //           {error}
  //         </Text>
  //         <TouchableOpacity
  //           onPress={() => fetchDonors()}
  //           className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl"
  //         >
  //           <Text className="text-sm font-bold text-white">Try Again</Text>
  //         </TouchableOpacity>
  //       </View>
  //     );
  //   }

  // const sendDonationRequest = async (donorId: number) => {
  //   try {
  //     const token = await AsyncStorage.getItem("auth_token");

  //     if (!token) {
  //       router.replace("/login");
  //       return;
  //     }

  //     const { data } = await axios.post(
  //       `${BASE_URL}/blood_donation_requests`,
  //       {
  //         blood_request_id: Number(id),
  //         donor_profile_id: donorId,
  //         message: "Can you accept please?",
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //         },
  //       },
  //     );

  //     Alert.alert("Success", data.message || "Request sent");

  //     console.log("Donation Request:", data);
  //   } catch (err: any) {
  //     console.log("ERROR:", err?.response?.data);

  //     Alert.alert(
  //       "Error",
  //       err?.response?.data?.message || "Failed to send request",
  //     );
  //   }
  // };

  const sendDonationRequest = async (donorId: number, donorName: string) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const { data } = await axios.post(
        `${BASE_URL}/blood_donation_requests`,
        {
          blood_request_id: Number(id),
          donor_profile_id: donorId,
          message: "Can you accept please?",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        },
      );

      Toast.show({
        type: "success",
        text1: "Request Sent",
        text2: `${donorName} has been notified.`,
        visibilityTime: 3000,
        position: "bottom",
      });

      console.log("Donation Request:", data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to send request";

      Toast.show({
        type: "error",
        text1: "Failed to Send",
        text2: msg,
        visibilityTime: 3000,
        position: "bottom",
      });
    }
  };

  return (
    <View className="flex-1 ">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ef4444"
            colors={["#ef4444"]}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View className="px-6 pt-10 pb-6 bg-red-200 rounded-b-3xl">
          {/* Back + title */}
          {/* <TouchableOpacity
              onPress={() => router.back()}
              className="flex-row items-center px-3 py-2 border border-gray-800 rounded-xl"
              style={{ backgroundColor: "#111116", gap: 6 }}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-gray-300">
                ← Back
              </Text>
            </TouchableOpacity> */}

          {/* Request summary card */}
          {loading ? (
            <View style={{ gap: 8 }}>
              <Skeleton w={180} h={22} rounded={8} />
              <Skeleton w={240} h={14} rounded={6} />
              <Skeleton w={140} h={14} rounded={6} />
            </View>
          ) : data ? (
            <View>
              <View
                className="flex-row items-center justify-between"
                style={{ gap: 12 }}
              >
                <View className="flex-row items-center" style={{ gap: 12 }}>
                  <View
                    className="items-center justify-center rounded-full"
                    style={{
                      width: 52,
                      height: 52,
                      backgroundColor: bloodColor,
                    }}
                  >
                    <Text className="text-base font-extrabold text-white">
                      {data.blood_request.blood_group}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-xl font-bold tracking-tight text-black-300">
                      {data.blood_request.patient_name}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-0.5">
                      <FontAwesome6
                        name="location-dot"
                        size={20}
                        color="#EF5350"
                        solid
                      />{" "}
                      {data.blood_request.hospital_name}
                    </Text>
                  </View>
                </View>
                <View
                  className="px-3 py-1.5 rounded-full"
                  style={{
                    backgroundColor: urgencyConf.bg,
                    borderWidth: 1,
                    borderColor: urgencyConf.border,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: urgencyConf.color }}
                  >
                    ● {urgencyConf.label}
                  </Text>
                </View>
              </View>

              {/* Stats strip */}
              <View className="flex-row mt-4" style={{ gap: 8 }}>
                {[
                  {
                    label: "Blood Group",
                    value: data.blood_request.blood_group,
                    color: bloodColor,
                  },
                  {
                    label: "Units Needed",
                    value: `${data.blood_request.units_required}`,
                    color: "#000000",
                  },
                  {
                    label: "Matching",
                    value: `${donors.length}`,
                    color: donors.length > 0 ? "#4ade80" : "#f87171",
                  },
                ].map((s) => (
                  <View
                    key={s.label}
                    className="items-center flex-1 py-3 bg-white border border-gray-800 rounded-xl"
                    // style={{ backgroundColor: "#111116" }}
                  >
                    <Text
                      className="text-base font-extrabold"
                      style={{ color: s.color }}
                    >
                      {s.value}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {s.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <View className="px-5 pt-5" style={{ gap: 0 }}>
          {/* ── Loading skeletons ────────────────────────────────────────── */}
          {loading && (
            <View>
              <Skeleton w={160} h={13} rounded={4} />
              <View style={{ marginTop: 12 }}>
                {[1, 2, 3].map((i) => (
                  <DonorCardSkeleton key={i} />
                ))}
              </View>
            </View>
          )}

          {/* ── No donors empty state ────────────────────────────────────── */}
          {!loading && donors.length === 0 && (
            <View
              className="items-center px-6 py-12 border border-gray-800 rounded-2xl"
              style={{ gap: 14 }}
            >
              <FontAwesome6 name="magnifying-glass" size={18} color="#1F1F1F" />
              <View className="items-center" style={{ gap: 6 }}>
                <Text className="text-lg font-bold text-center text-gray-500">
                  No matching donors found
                </Text>
                <Text className="text-sm leading-relaxed text-center text-gray-400">
                  There are no registered donors with{" "}
                  <Text className="font-bold" style={{ color: bloodColor }}>
                    {data?.blood_request.blood_group}
                  </Text>{" "}
                  blood group in the system yet.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => fetchDonors()}
                className="flex-row items-center px-5 py-3 border border-gray-700 rounded-xl"
                style={{ backgroundColor: "#1a1a22", gap: 6 }}
                activeOpacity={0.8}
              >
                <Text className="text-sm font-semibold text-gray-300">
                  Refresh
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Available donors ─────────────────────────────────────────── */}
          {!loading && availableDonors.length > 0 && (
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-semibold tracking-widest text-gray-900 uppercase">
                  Available Donors
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#14532d" }}
                >
                  <Text className="text-xs font-bold text-green-400">
                    {availableDonors.length}
                  </Text>
                </View>
              </View>
              {availableDonors.map((donor) => (
                <DonorCard
                  key={donor.donor_id}
                  donor={donor}
                  requestBloodGroup={data?.blood_request.blood_group ?? ""}
                  onSendRequest={() =>
                    sendDonationRequest(donor.donor_id, donor.donor_name)
                  }
                />
              ))}
            </View>
          )}

          {/* ── Unavailable donors ───────────────────────────────────────── */}
          {!loading && unavailableDonors.length > 0 && (
            <View style={{ marginTop: availableDonors.length > 0 ? 8 : 0 }}>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                  Currently Unavailable
                </Text>
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#1c1917" }}
                >
                  <Text className="text-xs font-bold text-gray-500">
                    {unavailableDonors.length}
                  </Text>
                </View>
              </View>
              <View style={{ opacity: 0.6 }}>
                {unavailableDonors.map((donor) => (
                  <DonorCard
                    key={donor.donor_id}
                    donor={donor}
                    requestBloodGroup={data?.blood_request.blood_group ?? ""}
                    onSendRequest={() =>
                      sendDonationRequest(donor.donor_id, donor.donor_name)
                    }
                  />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
