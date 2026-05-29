// // app/donor/requests.tsx
// import { usePusherChannel } from "@/hooks/usePusher";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { useFocusEffect, useRouter } from "expo-router";
// import React, { useCallback, useEffect, useState } from "react";
// import {
//     RefreshControl,
//     ScrollView,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import Toast from "react-native-toast-message";

// const BASE_URL = "https://blood-donor-finder-be.onrender.com/api/v1";

// interface DonationRequest {
//   id: number;
//   blood_request_id: number;
//   donor_profile_id: number;
//   status: "pending" | "accepted" | "declined";
//   message: string;
//   responded_at: string | null;
//   created_at: string;
//   blood_request: {
//     patient_name: string;
//     blood_group: string;
//     hospital_name: string;
//     urgency: "normal" | "urgent" | "critical";
//     units_required: number;
//     contact_number: string;
//   };
// }

// export default function DonorRequestsScreen() {
//   const router = useRouter();
//   const [requests, setRequests] = useState<DonationRequest[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [donorProfileId, setDonorProfileId] = useState<string | null>(null);

//   const fetchRequests = async (silent = false) => {
//     try {
//       if (!silent) setLoading(true);
//       const token = await AsyncStorage.getItem("auth_token");
//       if (!token) {
//         router.replace("/login");
//         return;
//       }

//       const { data } = await axios.get(`${BASE_URL}/blood_donation_requests`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });

//       setRequests(data.requests);
//     } catch (err: any) {
//       console.log("Fetch error:", err?.response?.data);
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   // Load donor profile id for Pusher channel
//   useEffect(() => {
//     AsyncStorage.getItem("donor_profile_id").then(setDonorProfileId);
//   }, []);

//   // Real-time: new request arrived
//   usePusherChannel(
//     `donor.${donorProfileId}`,
//     "donation_request.received",
//     (newRequest: DonationRequest) => {
//       setRequests((prev) => [newRequest, ...prev]);
//       Toast.show({
//         type: "info",
//         text1: "New Donation Request",
//         text2: `${newRequest.blood_request.patient_name} needs ${newRequest.blood_request.blood_group} at ${newRequest.blood_request.hospital_name}`,
//         visibilityTime: 5000,
//         position: "top",
//       });
//     },
//   );

//   useFocusEffect(
//     useCallback(() => {
//       fetchRequests();
//     }, []),
//   );

//   const respondToRequest = async (
//     requestId: number,
//     status: "accepted" | "declined",
//   ) => {
//     try {
//       const token = await AsyncStorage.getItem("auth_token");
//       if (!token) return;

//       await axios.put(
//         `${BASE_URL}/blood_donation_requests/${requestId}`,
//         { status },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         },
//       );

//       setRequests((prev) =>
//         prev.map((r) => (r.id === requestId ? { ...r, status } : r)),
//       );

//       Toast.show({
//         type: status === "accepted" ? "success" : "error",
//         text1: status === "accepted" ? "Request Accepted" : "Request Declined",
//         visibilityTime: 3000,
//         position: "bottom",
//       });

//       // If accepted, start live tracking
//       if (status === "accepted") {
//         router.push({
//           pathname: "/blood-donor/live-tracking",
//           params: { requestId: requestId.toString() },
//         });
//       }
//     } catch (err: any) {
//       Toast.show({
//         type: "error",
//         text1: "Error",
//         text2: err?.response?.data?.message || "Could not update request",
//         position: "bottom",
//       });
//     }
//   };

//   const URGENCY_COLOR: Record<string, string> = {
//     normal: "#22c55e",
//     urgent: "#f97316",
//     critical: "#ef4444",
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: "#fff" }}>
//       <ScrollView
//         contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={() => {
//               setRefreshing(true);
//               fetchRequests(true);
//             }}
//             colors={["#ef4444"]}
//           />
//         }
//       >
//         <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 16 }}>
//           Donation Requests
//         </Text>

//         {requests.length === 0 && !loading && (
//           <Text
//             style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}
//           >
//             No requests yet
//           </Text>
//         )}

//         {requests.map((req) => (
//           <View
//             key={req.id}
//             style={{
//               backgroundColor: "#f9fafb",
//               borderRadius: 16,
//               padding: 16,
//               marginBottom: 12,
//               borderWidth: 1,
//               borderColor: "#e5e7eb",
//             }}
//           >
//             {/* Header */}
//             <View
//               style={{
//                 flexDirection: "row",
//                 justifyContent: "space-between",
//                 marginBottom: 8,
//               }}
//             >
//               <Text style={{ fontSize: 16, fontWeight: "700" }}>
//                 {req.blood_request.patient_name}
//               </Text>
//               <Text
//                 style={{
//                   color: URGENCY_COLOR[req.blood_request.urgency],
//                   fontWeight: "700",
//                   fontSize: 12,
//                 }}
//               >
//                 ● {req.blood_request.urgency.toUpperCase()}
//               </Text>
//             </View>

//             <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 2 }}>
//               🏥 {req.blood_request.hospital_name}
//             </Text>
//             <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 2 }}>
//               🩸 {req.blood_request.blood_group} ·{" "}
//               {req.blood_request.units_required} units
//             </Text>
//             <Text style={{ color: "#6b7280", fontSize: 13, marginBottom: 12 }}>
//               📩 {req.message}
//             </Text>

//             {/* Status or action buttons */}
//             {req.status === "pending" ? (
//               <View style={{ flexDirection: "row", gap: 8 }}>
//                 <TouchableOpacity
//                   onPress={() => respondToRequest(req.id, "accepted")}
//                   style={{
//                     flex: 1,
//                     backgroundColor: "#16a34a",
//                     borderRadius: 10,
//                     paddingVertical: 10,
//                     alignItems: "center",
//                   }}
//                 >
//                   <Text style={{ color: "#fff", fontWeight: "700" }}>
//                     Accept
//                   </Text>
//                 </TouchableOpacity>
//                 <TouchableOpacity
//                   onPress={() => respondToRequest(req.id, "declined")}
//                   style={{
//                     flex: 1,
//                     backgroundColor: "#dc2626",
//                     borderRadius: 10,
//                     paddingVertical: 10,
//                     alignItems: "center",
//                   }}
//                 >
//                   <Text style={{ color: "#fff", fontWeight: "700" }}>
//                     Decline
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             ) : (
//               <View
//                 style={{
//                   paddingVertical: 8,
//                   borderRadius: 10,
//                   alignItems: "center",
//                   backgroundColor:
//                     req.status === "accepted" ? "#dcfce7" : "#fee2e2",
//                 }}
//               >
//                 <Text
//                   style={{
//                     fontWeight: "700",
//                     color: req.status === "accepted" ? "#16a34a" : "#dc2626",
//                   }}
//                 >
//                   {req.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
//                 </Text>
//               </View>
//             )}
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

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

  // =========================
  // FETCH REQUESTS
  // =========================
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

  // =========================
  // LOAD ON FOCUS
  // =========================
  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, []),
  );

  // =========================
  // RESPOND TO REQUEST
  // =========================
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

      // update UI instantly
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

  const URGENCY_COLOR: Record<string, string> = {
    normal: "#22c55e",
    urgent: "#f97316",
    critical: "#ef4444",
  };

  // =========================
  // UI
  // =========================
  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
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
        <Text style={{ fontSize: 22, fontWeight: "800", marginBottom: 16 }}>
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
              🏥 {req.blood_request.hospital_name}
            </Text>

            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              🩸 {req.blood_request.blood_group} ·{" "}
              {req.blood_request.units_required} units
            </Text>

            <Text
              style={{
                color: "#6b7280",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              📩 {req.message}
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
            ) : (
              <View
                style={{
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor:
                    req.status === "accepted" ? "#dcfce7" : "#fee2e2",
                }}
              >
                <Text
                  style={{
                    fontWeight: "700",
                    color: req.status === "accepted" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {req.status === "accepted" ? "✓ Accepted" : "✕ Declined"}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
