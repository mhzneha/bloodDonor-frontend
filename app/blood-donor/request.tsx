import CustomHeader from "@/components/CustomHeader";
import { FontAwesome6, Fontisto } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

interface DonationRequest {
  id: number;
  blood_request_id: number;
  donor_profile_id: number;
  status: "pending" | "accepted" | "declined";
  message: string;
  responded_at: string | null;
  created_at: string;
  blood_request: {
    patient_name: string;
    blood_group: string;
    hospital_name: string;
    urgency: "normal" | "urgent" | "critical";
    units_required: number;
    contact_number: string;
  };
}

export default function DonorRequestsScreen() {
  const router = useRouter();

  const [requests, setRequests] = useState<DonationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [donationDecisions, setDonationDecisions] = useState<
    Record<number, "yes" | "no">
  >({});
  const [finalizedStatus, setFinalizedStatus] = useState<
    Record<number, "completed" | "incomplete">
  >({});

  const finalizeDonation = async (
    requestId: number,
    status: "completed" | "incomplete",
  ) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      await axios.patch(
        `${BASE_URL}/blood_donation_requests/${requestId}/complete`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      await AsyncStorage.removeItem(`donation_decision_${requestId}`);
      await AsyncStorage.setItem(`donation_status_${requestId}`, status);

      setDonationDecisions((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      setFinalizedStatus((prev) => ({ ...prev, [requestId]: status }));

      Toast.show({
        type: "success",
        text1:
          status === "completed"
            ? "Donation was completed"
            : "Donation was incomplete",
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: err?.response?.data?.message || "Something went wrong",
      });
    }
  };

  const loadDonationState = async (reqs: DonationRequest[]) => {
    try {
      const entries = await Promise.all(
        reqs.map(async (r) => {
          const [decision, status] = await Promise.all([
            AsyncStorage.getItem(`donation_decision_${r.id}`),
            AsyncStorage.getItem(`donation_status_${r.id}`),
          ]);
          return { id: r.id, decision, status };
        }),
      );

      const decisionMap: Record<number, "yes" | "no"> = {};
      const statusMap: Record<number, "completed" | "incomplete"> = {};

      entries.forEach(({ id, decision, status }) => {
        if (decision === "yes" || decision === "no") decisionMap[id] = decision;
        if (status === "completed" || status === "incomplete")
          statusMap[id] = status;
      });

      setDonationDecisions(decisionMap);
      setFinalizedStatus(statusMap);

      // A "yes" decision means the donor already confirmed completion in the
      // tracking screen's prompt — finalize it right away instead of making
      // them tap a separate "Completed" button on this list.
      Object.entries(decisionMap)
        .filter(([, decision]) => decision === "yes")
        .forEach(([id]) => finalizeDonation(Number(id), "completed"));
    } catch (e) {
      console.log("Failed to load donation state:", e);
    }
  };

  // FETCH REQUESTS
  const fetchRequests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const { data } = await axios.get(`${BASE_URL}/blood_donation_requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(data.requests);
      loadDonationState(data.requests);
    } catch (err: any) {
      console.log("Fetch error:", err?.response?.data || err.message);
      Toast.show({
        type: "error",
        text1: "Error loading requests",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // LOAD ON FOCUS
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, []),
  );

  // RESPOND TO REQUEST
  const respondToRequest = async (
    requestId: number,
    status: "accepted" | "declined",
  ) => {
    try {
      const token = await AsyncStorage.getItem("auth_token");
      if (!token) return;

      await axios.patch(
        `${BASE_URL}/blood_donation_requests/${requestId}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // update UI
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
      );

      Toast.show({
        type: status === "accepted" ? "success" : "error",
        text1: status === "accepted" ? "Request Accepted" : "Request Declined",
      });

      // navigate if accepted
      if (status === "accepted") {
        router.push({
          pathname: "/blood-donor/live-tracking",
          params: { requestId: requestId.toString() },
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Update failed",
        text2: err?.response?.data?.message || "Something went wrong",
      });
    }
  };

  const goToTracking = (requestId: number) => {
    router.push({
      pathname: "/blood-donor/live-tracking",
      params: { requestId: requestId.toString() },
    });
  };

  const URGENCY_COLOR: Record<string, string> = {
    normal: "#22c55e",
    urgent: "#f97316",
    critical: "#ef4444",
  };

  // UI
  return (
    <View style={{ flex: 1 }}>
      <CustomHeader title="Incoming Request" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRequests(true);
            }}
            colors={["#ef4444"]}
          />
        }
      >
        <Text
          className="text-black-300 dark:text-gray-200"
          style={{ fontSize: 22, fontWeight: "800", marginBottom: 16 }}
        >
          Donation Requests
        </Text>

        {/* Loading */}
        {loading && (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Loading...</Text>
        )}

        {/* Empty */}
        {requests.length === 0 && !loading && (
          <Text
            style={{
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No requests yet
          </Text>
        )}

        {/* List */}
        {requests.map((req) => (
          <View
            key={req.id}
            style={{
              backgroundColor: "#f9fafb",
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700" }}>
                {req.blood_request.patient_name}
              </Text>

              <Text
                style={{
                  color: URGENCY_COLOR[req.blood_request.urgency],
                  fontWeight: "700",
                  fontSize: 12,
                }}
              >
                ● {req.blood_request.urgency.toUpperCase()}
              </Text>
            </View>

            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              <FontAwesome6 name="building" size={15} color="#a1a1aa" />{" "}
              {req.blood_request.hospital_name}
            </Text>

            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              <Fontisto name="blood-drop" size={15} color="#ED3632" />{" "}
              {req.blood_request.blood_group} ·{" "}
              {req.blood_request.units_required} units
            </Text>

            <Text
              style={{
                color: "#6b7280",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              <FontAwesome6 name="envelope" size={15} color="#a1a1aa" />{" "}
              {req.message}
            </Text>

            {/* Actions */}
            {req.status === "pending" ? (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => respondToRequest(req.id, "accepted")}
                  style={{
                    flex: 1,
                    backgroundColor: "#16a34a",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Accept
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => respondToRequest(req.id, "declined")}
                  style={{
                    flex: 1,
                    backgroundColor: "#dc2626",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Decline
                  </Text>
                </TouchableOpacity>
              </View>
            ) : req.status === "declined" ? (
              // Only an explicit "declined" status should render as declined.
              // Any other non-pending status (accepted, or whatever the
              // backend sets after completion, e.g. "completed") falls
              // through to the accepted-flow block below instead.
              <View
                style={{
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: "#fee2e2",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#dc2626" }}>
                  ✕ Declined
                </Text>
              </View>
            ) : finalizedStatus[req.id] ? (
              // Donation already finalized — show the outcome directly,
              // no separate "Accepted" badge needed above it
              <View
                style={{
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    finalizedStatus[req.id] === "completed"
                      ? "#dcfce7"
                      : "#fee2e2",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color:
                      finalizedStatus[req.id] === "completed"
                        ? "#16a34a"
                        : "#dc2626",
                  }}
                >
                  {finalizedStatus[req.id] === "completed"
                    ? "✓ Donation Completed"
                    : "✕ Donation Incomplete"}
                </Text>
              </View>
            ) : (
              <View
                style={{
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: "#dcfce7",
                }}
              >
                <Text style={{ fontWeight: "700", color: "#16a34a" }}>
                  ✓ Accepted
                </Text>
              </View>
            )}

            {req.status !== "pending" &&
              req.status !== "declined" &&
              !finalizedStatus[req.id] && (
                <View style={{ marginTop: 8 }}>
                  {donationDecisions[req.id] === "yes" ? (
                    // Already finalizing in the background (see
                    // loadDonationState's auto-finalize) — briefly shown while
                    // that PATCH request is in flight.
                    <View
                      style={{
                        paddingVertical: 8,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: "#dcfce7",
                      }}
                    >
                      <Text style={{ fontWeight: "700", color: "#16a34a" }}>
                        Finalizing donation...
                      </Text>
                    </View>
                  ) : donationDecisions[req.id] === "no" ? (
                    // User said "no" — let them finalize, or jump back into
                    // tracking if they're not actually done yet.
                    <View style={{ gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => goToTracking(req.id)}
                        style={{
                          backgroundColor: "#2563eb",
                          borderRadius: 10,
                          paddingVertical: 10,
                          alignItems: "center",
                          flexDirection: "row",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <FontAwesome6
                          name="location-crosshairs"
                          size={14}
                          color="#fff"
                        />
                        <Text style={{ color: "#fff", fontWeight: "700" }}>
                          Start Tracking
                        </Text>
                      </TouchableOpacity>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => finalizeDonation(req.id, "completed")}
                          style={{
                            flex: 1,
                            backgroundColor: "#16a34a",
                            borderRadius: 10,
                            paddingVertical: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            Complete
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => finalizeDonation(req.id, "incomplete")}
                          style={{
                            flex: 1,
                            backgroundColor: "#dc2626",
                            borderRadius: 10,
                            paddingVertical: 10,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ color: "#fff", fontWeight: "700" }}>
                            Incomplete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    // Accepted, but no completion decision saved yet — the user
                    // likely left the live-tracking screen (e.g. swiped back)
                    // before the "Did you complete the donation?" prompt ran.
                    // Give them a way back into tracking instead of a dead end.
                    <TouchableOpacity
                      onPress={() => goToTracking(req.id)}
                      style={{
                        backgroundColor: "#dc2626",
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <FontAwesome6
                        name="location-crosshairs"
                        size={14}
                        color="#fff"
                      />
                      <Text style={{ color: "#fff", fontWeight: "700" }}>
                        Start Tracking
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
