import CustomHeader from "@/components/CustomHeader";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

//  Types
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

// Tracks the donation request Claude/the app has sent out to a given donor
interface SentRequestState {
  requestId: number;
  status: "pending" | "accepted" | "declined";
}

//  Constants
const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

// How often to poll for status changes (donor accepting/declining) on any
// requests that are still pending.
const POLL_INTERVAL_MS = 8000;

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

const getDonorName = (donor: Donor): string => donor.donor_name;

const getDonorPhone = (donor: Donor): string | null => donor.donor_phone_number;

//Skeleton
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

// Donor Card
const DonorCard = ({
  donor,
  requestStatus,
  onSendRequest,
  onTrackDonor,
}: {
  donor: Donor;
  requestBloodGroup: string;
  requestStatus?: SentRequestState;
  onSendRequest: () => void;
  onTrackDonor: () => void;
}) => {
  const bloodColor = BLOOD_GROUP_COLORS[donor.blood_group] ?? "#ef4444";
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
          </View>
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
      <View
        className="flex-row items-center justify-between px-3 py-2 mb-3 rounded-xl"
        style={{ gap: 14 }}
      >
        {/* Distance */}
        <View style={{ gap: 2 }}>
          <Text className="text-xs text-gray-700">Distance</Text>
          <Text className="text-xs font-semibold text-gray-500">
            {donor.distance_km != null
              ? `${Number(donor.distance_km).toFixed(1)} km`
              : "—"}
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

        {requestStatus?.status === "accepted" ? (
          <TouchableOpacity
            onPress={onTrackDonor}
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{ gap: 6, backgroundColor: "#16a34a" }}
            activeOpacity={0.85}
          >
            <FontAwesome6 name="location-crosshairs" size={15} color="#fff" />
            <Text className="text-sm font-bold text-white">Track Donor</Text>
          </TouchableOpacity>
        ) : requestStatus?.status === "pending" ? (
          <View
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{ backgroundColor: "#9ca3af" }}
          >
            <Text className="text-sm font-bold text-white">Waiting</Text>
          </View>
        ) : requestStatus?.status === "declined" ? (
          <TouchableOpacity
            onPress={onSendRequest}
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5"
            style={{ gap: 6, backgroundColor: "#dc2626" }}
            activeOpacity={0.85}
          >
            <FontAwesome6 name="rotate-right" size={14} color="#fff" />
            <Text className="text-sm font-bold text-white">
              Declined · Resend
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onSendRequest}
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 bg-primary-200"
            style={{ gap: 6 }}
            activeOpacity={0.85}
          >
            <FontAwesome name="send-o" size={15} color="#ffffff" />
            <Text className="text-sm font-bold text-white">Send Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

//  Main Screen
export default function MatchingDonorsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<MatchingDonorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // donor_id -> { requestId, status }
  const [sentRequests, setSentRequests] = useState<
    Record<number, SentRequestState>
  >({});

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirrors sentRequests but always current inside the interval closure
  const sentRequestsRef = useRef<Record<number, SentRequestState>>({});
  useEffect(() => {
    sentRequestsRef.current = sentRequests;
  }, [sentRequests]);

  const sentRequestsStorageKey = `sent_donation_requests_${id}`;

  // Guards against the persist effect (below) firing with the initial
  // empty state and overwriting whatever was saved from a previous visit,
  // before the rehydrate effect has had a chance to read it back in.
  const hasHydratedRef = useRef(false);

  // Persist sentRequests to AsyncStorage any time it changes, so it
  // survives navigating away from this screen and coming back. Skipped
  // until rehydration has completed at least once.
  useEffect(() => {
    if (!id || !hasHydratedRef.current) return;
    AsyncStorage.setItem(
      sentRequestsStorageKey,
      JSON.stringify(sentRequests),
    ).catch((e) => console.log("Failed to persist sent requests:", e));
  }, [sentRequests, id]);

  // Re-check the real status of a set of requests against the server —
  // used both for periodic polling and for the one-off refresh right after
  // rehydrating from storage (status may have changed while we were away).
  const refreshRequestStatuses = useCallback(
    async (entries: [string, SentRequestState][], onlyPending: boolean) => {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      const targets = onlyPending
        ? entries.filter(([, r]) => r.status === "pending")
        : entries;
      if (targets.length === 0) return;

      await Promise.all(
        targets.map(async ([donorIdStr, r]) => {
          try {
            const { data: res } = await axios.get(
              `${BASE_URL}/blood_donation_requests/${r.requestId}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );

            // Same shape assumption as elsewhere: adjust if your API nests
            // this under `donation_request`.
            const latestStatus: SentRequestState["status"] =
              res?.donation_request?.status ?? res?.status ?? r.status;

            if (latestStatus !== r.status) {
              const donorId = Number(donorIdStr);
              setSentRequests((prev) => ({
                ...prev,
                [donorId]: { requestId: r.requestId, status: latestStatus },
              }));
            }
          } catch (e) {
            console.log("Status refresh error for request", r.requestId, e);
          }
        }),
      );
    },
    [],
  );

  // Rehydrate sentRequests from AsyncStorage on mount / when the blood
  // request id changes, then immediately refresh each entry's real status.
  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(sentRequestsStorageKey);
        if (!raw) return;

        const parsed: Record<number, SentRequestState> = JSON.parse(raw);
        setSentRequests(parsed);

        const entries = Object.entries(parsed) as [string, SentRequestState][];
        refreshRequestStatuses(entries, false);
      } catch (e) {
        console.log("Failed to load sent requests:", e);
      } finally {
        // Only allow the persist effect to start writing once this initial
        // read has finished — whether or not there was anything saved.
        hasHydratedRef.current = true;
      }
    })();
  }, [id]);

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

  const sendDonationRequest = async (donorId: number, donorName: string) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const { data: created } = await axios.post(
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

      // NOTE: assumes the API returns the created donation request with
      // `id` and `status` fields directly on the response body. If your
      // backend nests it (e.g. { donation_request: {...} }), adjust the
      // two lines below to match.
      const requestId: number = created?.id ?? created?.donation_request?.id;
      const status: SentRequestState["status"] =
        created?.status ?? created?.donation_request?.status ?? "pending";

      if (requestId) {
        setSentRequests((prev) => ({
          ...prev,
          [donorId]: { requestId, status },
        }));
      }

      Toast.show({
        type: "success",
        text1: "Request Sent",
        text2: `${donorName} has been notified.`,
        visibilityTime: 3000,
        position: "bottom",
      });
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

  const goToTrackDonor = (requestId: number) => {
    router.push({
      pathname: "/blood-request/request-tracking",
      params: { requestId: requestId.toString() },
    });
  };

  // Poll any pending sent requests for a status change (donor accepted/declined)
  const pollPendingRequests = useCallback(async () => {
    const token = await AsyncStorage.getItem("auth_token");
    if (!token) return;

    const pendingEntries = Object.entries(sentRequestsRef.current).filter(
      ([, r]) => r.status === "pending",
    );
    if (pendingEntries.length === 0) return;

    await Promise.all(
      pendingEntries.map(async ([donorIdStr, r]) => {
        try {
          const { data: res } = await axios.get(
            `${BASE_URL}/blood_donation_requests/${r.requestId}`,
            { headers: { Authorization: `Bearer ${token}` } },
          );

          // Same shape assumption as above: adjust if your API nests this
          // under `donation_request`.
          const latestStatus: SentRequestState["status"] =
            res?.donation_request?.status ?? res?.status ?? r.status;

          if (latestStatus !== r.status) {
            const donorId = Number(donorIdStr);
            setSentRequests((prev) => ({
              ...prev,
              [donorId]: { requestId: r.requestId, status: latestStatus },
            }));

            if (latestStatus === "accepted") {
              Toast.show({
                type: "success",
                text1: "Donor Accepted",
                text2: "You can now track their location.",
                position: "bottom",
              });
            } else if (latestStatus === "declined") {
              Toast.show({
                type: "error",
                text1: "Donor Declined",
                position: "bottom",
              });
            }
          }
        } catch (e) {
          console.log("Poll error for request", r.requestId, e);
        }
      }),
    );
  }, []);

  // Start/stop polling while this screen is focused
  useFocusEffect(
    useCallback(() => {
      pollIntervalRef.current = setInterval(
        pollPendingRequests,
        POLL_INTERVAL_MS,
      );
      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      };
    }, [pollPendingRequests]),
  );

  return (
    <View className="flex-1 ">
      <Stack.Screen options={{ headerShown: false }} />
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
        <CustomHeader title="Matching Donors" />

        <View className="px-6 pt-10 pb-6 bg-red-200 rounded-b-3xl">
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
          {/*  Loading skeletons  */}
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

          {/*  No donors empty state  */}
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

          {/*  Available donors  */}
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
                  requestStatus={sentRequests[donor.donor_id]}
                  onSendRequest={() =>
                    sendDonationRequest(donor.donor_id, donor.donor_name)
                  }
                  onTrackDonor={() => {
                    const r = sentRequests[donor.donor_id];
                    if (r) goToTrackDonor(r.requestId);
                  }}
                />
              ))}
            </View>
          )}

          {/*  Unavailable donors  */}
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
                    requestStatus={sentRequests[donor.donor_id]}
                    onSendRequest={() =>
                      sendDonationRequest(donor.donor_id, donor.donor_name)
                    }
                    onTrackDonor={() => {
                      const r = sentRequests[donor.donor_id];
                      if (r) goToTrackDonor(r.requestId);
                    }}
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
