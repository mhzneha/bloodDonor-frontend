import { FontAwesome6, Fontisto, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//  Types
interface DonorProfile {
  id: number;
  available: boolean | null;
  blood_group: string;
  created_at: string;
  last_donated_at: string | null;
  latitude: string | null;
  location: string | null;
  longitude: string | null;
  updated_at: string;
  user_id: number;
  verified: boolean | null;
  last_active_at: string | null;
}

//  Constants
const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/donor_profile";

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

//  Helpers
const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const timeAgo = (iso: string | null): string => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} year${Math.floor(months / 12) > 1 ? "s" : ""} ago`;
};

const canDonateAgain = (lastDonated: string | null): boolean => {
  if (!lastDonated) return true;
  return Date.now() - new Date(lastDonated).getTime() >= 90 * 86400000;
};

//  Sub-components
const InfoRow = ({
  icon,
  label,
  value,
  valueColor,
  last = false,
}: {
  // icon: string;
  icon?: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  last?: boolean;
}) => (
  <View
    className={`flex-row items-center justify-between py-3 ${
      last ? "" : "border-b border-gray-800"
    }`}
  >
    <View className="flex-row items-center" style={{ gap: 10 }}>
      <Text style={{ fontSize: 15, width: 22, textAlign: "center" }}>
        {icon}
      </Text>
      <Text className="text-sm text-gray-600 dark:text-gray-400">{label}</Text>
    </View>
    <Text
      className="text-sm font-semibold"
      style={{
        color: valueColor ?? "#4b5563",
        maxWidth: 180,
        textAlign: "right",
      }}
      numberOfLines={1}
    >
      {value}
    </Text>
  </View>
);

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) => (
  <View
    className="items-center flex-1 py-4 border border-gray-800 rounded-2xl"
    style={{ gap: 4 }}
  >
    <Text style={{ fontSize: 22 }}>{icon}</Text>
    <Text className="text-base font-extrabold" style={{ color }}>
      {value}
    </Text>
    <Text className="text-xs text-center text-gray-500">{label}</Text>
  </View>
);

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
      backgroundColor: "#e5e7eb",
    }}
  />
);

//  Main Screen
export default function DonorProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        Alert.alert("Error", "Please login again.");
        router.replace("/login");
        return;
      }

      const { data } = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      setProfile(data);
    } catch (err: any) {
      console.log("ERROR:", err?.response?.data);
      const status = err?.response?.status;
      if (status === 404) {
        setProfile(null);
        setError("no_profile");
      } else if (status === 401) {
        Alert.alert("Session expired", "Please login again.");
        router.replace("/login");
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load profile.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile(true);
  };

  const toggleAvailability = () => {
    if (!profile) return;
    Alert.alert(
      "Toggle Availability",
      `Mark yourself as ${profile.available ? "unavailable" : "available"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("auth_token");
              await axios.patch(
                API_URL,
                { donor_profile: { available: !profile.available } },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                },
              );
              setProfile((p) => (p ? { ...p, available: !p.available } : p));
            } catch {
              Alert.alert("Error", "Could not update availability.");
            }
          },
        },
      ],
    );
  };

  const bloodColor = profile?.blood_group
    ? (BLOOD_GROUP_COLORS[profile.blood_group] ?? "#ef4444")
    : "#ef4444";

  const eligible = canDonateAgain(profile?.last_donated_at ?? null);

  //  Loading
  if (loading) {
    return (
      <View className="flex-1 ">
        <View
          className="px-6 py-8 rounded-b-3xl"
          style={{ backgroundColor: "#4c0519", gap: 8 }}
        >
          <Skeleton w={160} h={14} rounded={6} />
          <Skeleton w={220} h={28} rounded={8} />
        </View>
        <View className="px-5 pt-6" style={{ gap: 16, alignItems: "center" }}>
          <Skeleton w={84} h={84} rounded={42} />
          <Skeleton w={120} h={22} rounded={20} />
          <View className="flex-row w-full gap-3">
            <Skeleton w="32%" h={80} rounded={16} />
            <Skeleton w="32%" h={80} rounded={16} />
            <Skeleton w="32%" h={80} rounded={16} />
          </View>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} className="flex-row justify-between w-full">
              <Skeleton w={120} h={14} rounded={6} />
              <Skeleton w={90} h={14} rounded={6} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  //  No profile
  if (error === "no_profile" || !profile) {
    return (
      <View className="flex-1 ">
        <View className="px-6 py-8 bg-primary-100 rounded-b-3xl">
          <View className="flex-row items-center" style={{ gap: 12 }}>
            <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <Text style={{ fontSize: 18 }}>❤️</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-white/70">
                Blood Donor Finder
              </Text>
              <Text className="text-2xl font-bold tracking-tight text-white">
                Donor Profile
              </Text>
            </View>
          </View>
        </View>
        <View
          className="items-center justify-center flex-1 px-8"
          style={{ gap: 16 }}
        >
          <Text style={{ fontSize: 64 }}>🩸</Text>
          <Text className="text-xl font-bold text-center text-white">
            No Donor Profile Yet
          </Text>
          <Text className="text-sm leading-relaxed text-center text-gray-400">
            You haven't registered as a donor. Join thousands of heroes saving
            lives by donating blood.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/blood-donor/create")}
            className="px-8 py-4 mt-2 bg-rose-700 rounded-2xl"
            activeOpacity={0.85}
          >
            <Text className="text-base font-bold text-white">
              ❤️ Become a Donor
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  //  Error
  if (error) {
    return (
      <View
        className="items-center justify-center flex-1 px-8"
        style={{ gap: 16 }}
      >
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text className="text-base font-semibold text-center text-white">
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => fetchProfile()}
          className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl"
        >
          <Text className="text-sm font-bold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  //  Profile
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
        {/* Header */}
        <View
          className="px-6 pt-10 pb-8 rounded-b-3xl bg-primary-100"
          // style={{ backgroundColor: "#4c0519" }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-sm font-medium text-white/60">
                Blood Donor Finder
              </Text>
              <Text className="text-2xl font-bold tracking-tight text-white">
                My Donor Profile
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/blood-donor/update?edit=true")}
              className="px-4 py-2 border rounded-xl border-white/20"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
              activeOpacity={0.8}
            >
              <Text className="text-sm font-semibold text-white">Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View className="items-center" style={{ gap: 10 }}>
            <View
              className="items-center justify-center bg-white border-4 rounded-full"
              style={{
                width: 70,
                height: 70,
                // backgroundColor: bloodColor + "22",
                borderColor: bloodColor,
              }}
            >
              <Fontisto name="blood-drop" size={22} color="#ED3632" />
            </View>

            {/* Blood group pill */}
            <View
              className="px-5 py-1.5 rounded-full"
              style={{ backgroundColor: bloodColor }}
            >
              <Text className="text-lg font-extrabold tracking-wider text-white">
                {profile.blood_group}
              </Text>
            </View>

            {/* Status badges */}
            <View className="flex-row" style={{ gap: 8, marginTop: 4 }}>
              {/* Available */}
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: profile.available ? "#14532d" : "#1c1917",
                  borderWidth: 1,
                  borderColor: profile.available ? "#166534" : "#44403c",
                  gap: 6,
                }}
              >
                <View
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: profile.available ? "#4ade80" : "#78716c",
                  }}
                />
                <Text
                  className="text-xs font-bold"
                  style={{ color: profile.available ? "#4ade80" : "#78716c" }}
                >
                  {profile.available ? "Available" : "Unavailable"}
                </Text>
              </View>

              {/* Verified */}
              {profile.verified && (
                <View
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{
                    backgroundColor: "#1e3a5f",
                    borderWidth: 1,
                    borderColor: "#1d4ed8",
                    gap: 4,
                  }}
                >
                  <Text className="text-xs font-bold text-blue-400">
                    Verified
                  </Text>
                </View>
              )}

              {/* Eligible */}
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{
                  backgroundColor: eligible ? "#14532d" : "#422006",
                  borderWidth: 1,
                  borderColor: eligible ? "#166534" : "#78350f",
                  gap: 4,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{ color: eligible ? "#4ade80" : "#fbbf24" }}
                >
                  {eligible ? "✓ Eligible" : "Wait"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View className="px-5 pt-5" style={{ gap: 20 }}>
          {/* Stat cards */}
          <View className="flex-row" style={{ gap: 12 }}>
            <StatCard
              icon=""
              label="Blood Group"
              value={profile.blood_group}
              color={bloodColor}
            />
            <StatCard
              icon={profile.available ? "" : ""}
              label="Status"
              value={profile.available ? "Active" : "Off"}
              color={profile.available ? "#10b981" : "#f87171"}
            />
            <StatCard
              icon={profile.verified ? "" : ""}
              label="Verified"
              value={profile.verified ? "Yes" : "No"}
              color={profile.verified ? "#60a5fa" : "#6b7280"}
            />
          </View>

          {/* Donation info */}
          <View>
            <Text className="mb-2 text-sm font-extrabold tracking-widest text-gray-900 uppercase dark:text-gray-400">
              Donation Info
            </Text>
            <View className="px-4 border border-gray-800 rounded-2xl">
              <InfoRow
                icon={<Fontisto name="blood-drop" size={15} color="#ED3632" />}
                label="Last Donated"
                value={formatDate(profile.last_donated_at)}
                valueColor={profile.last_donated_at ? "#10b981" : "#9ca3af"}
              />
              <InfoRow
                icon={
                  <FontAwesome6
                    name="hourglass-half"
                    size={15}
                    color="#ffbf00"
                  />
                }
                label="Time Since Donation"
                value={timeAgo(profile.last_donated_at)}
                valueColor={profile.last_donated_at ? "#10b981" : "#9ca3af"}
              />
              <InfoRow
                icon={<FontAwesome6 name="check" size={15} color="#10b981" />}
                label="Eligible to Donate"
                value={eligible ? "Yes — ready!" : "Not yet (90-day wait)"}
                valueColor={eligible ? "#10b981" : "#fbbf24"}
                last
              />
            </View>
          </View>

          {/* Location */}
          {/* <View>
            <Text className="mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">
              Location
            </Text>
            <View className="px-4 bg-gray-900 border border-gray-800 rounded-2xl">
              <InfoRow
                icon={
                  <FontAwesome6 name="location-dot" size={15} color="#ffffff" />
                }
                label="Area"
                value={profile.location ?? "Not set"}
                valueColor={profile.location ? "#f3f4f6" : "#4b5563"}
              />
              <InfoRow
                icon={
                  <MaterialCommunityIcons name="earth" size={15} color="#fff" />
                }
                label="Latitude"
                value={profile.latitude ?? "—"}
                valueColor={profile.latitude ? "#f3f4f6" : "#4b5563"}
              />
              <InfoRow
                icon={
                  <MaterialCommunityIcons
                    name="crosshairs-gps"
                    size={15}
                    color="#fff"
                  />
                }
                label="Longitude"
                value={profile.longitude ?? "—"}
                valueColor={profile.longitude ? "#f3f4f6" : "#4b5563"}
                last
              />
            </View>
          </View> */}

          {/* Account info */}
          <View>
            <Text className="mb-2 text-sm font-extrabold tracking-widest text-gray-900 uppercase dark:text-gray-400">
              Account
            </Text>
            <View className="px-4 border border-gray-800 rounded-2xl">
              {/* <InfoRow icon="🆔" label="Profile ID" value={`#${profile.id}`} /> */}

              <InfoRow
                icon={<MaterialIcons name="update" size={15} color="#4b5563" />}
                label="Last Updated"
                value={timeAgo(profile.updated_at)}
              />
              <InfoRow
                icon={
                  <FontAwesome6
                    name="calendar-days"
                    size={15}
                    color="#4b5563"
                  />
                }
                label="Registered"
                value={formatDate(profile.created_at)}
                last
              />

              {/* <InfoRow
                icon={<FontAwesome6 name="clock" size={15} color="#ffffff" />}
                label="Last Active"
                value={timeAgo(profile.last_active_at)}
                valueColor={profile.last_active_at ? "#f3f4f6" : "#4b5563"}
                last
              /> */}
            </View>
          </View>

          {/* Eligibility banner */}
          <View
            className="px-5 py-4 rounded-2xl"
            style={{
              backgroundColor: eligible ? "#052e16" : "#1c1008",
              borderWidth: 1,
              borderColor: eligible ? "#14532d" : "#451a03",
            }}
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <Text style={{ fontSize: 28 }}>{eligible ? "" : ""}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  className="text-sm font-bold"
                  style={{ color: eligible ? "#4ade80" : "#fbbf24" }}
                >
                  {eligible
                    ? "You're ready to donate!"
                    : "Donation cooldown active"}
                </Text>
                <Text className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                  {eligible
                    ? "Your profile is active. Thank you for being a hero!"
                    : `Last donated ${timeAgo(profile.last_donated_at)}. Wait 90 days between donations.`}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push("/blood-donor/update?edit=true")}
              className="flex-row items-center justify-center py-4 rounded-2xl bg-primary-100"
              style={{ gap: 8 }}
              activeOpacity={0.85}
            >
              <Text className="text-base font-bold text-white">
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleAvailability}
              className="flex-row items-center justify-center py-4 border border-gray-700 rounded-2xl"
              style={{ gap: 8 }}
              activeOpacity={0.85}
            >
              <Text className="text-base font-bold text-gray-900 dark:text-gray-200">
                {profile.available ? " Mark Unavailable" : "Mark Available"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
