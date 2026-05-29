// // app/request/track-donor.tsx
// import { usePusherChannel } from "@/hooks/usePusher";
// import { useLocalSearchParams } from "expo-router";
// import React, { useState } from "react";
// import { Text, View } from "react-native";
// import MapView, { Marker, PROVIDER_GOOGLE } from "

// export default function TrackDonorScreen() {
//   const { requestId } = useLocalSearchParams<{ requestId: string }>();
//   const [donorCoords, setDonorCoords] = useState<{
//     lat: number;
//     lng: number;
//   } | null>(null);

//   usePusherChannel(
//     `request.${requestId}`,
//     "donation_request.location_updated",
//     (data: { donor_latitude: string; donor_longitude: string }) => {
//       setDonorCoords({
//         lat: parseFloat(data.donor_latitude),
//         lng: parseFloat(data.donor_longitude),
//       });
//     },
//   );

//   if (!donorCoords) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text style={{ fontSize: 48 }}>⏳</Text>
//         <Text style={{ marginTop: 12, color: "#6b7280" }}>
//           Waiting for donor to start tracking…
//         </Text>
//       </View>
//     );
//   }

//   return (
//     <MapView
//       provider={PROVIDER_GOOGLE}
//       style={{ flex: 1 }}
//       region={{
//         latitude: donorCoords.lat,
//         longitude: donorCoords.lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       }}
//     >
//       <Marker
//         coordinate={{ latitude: donorCoords.lat, longitude: donorCoords.lng }}
//         title="Donor"
//         description="Donor's current location"
//       />
//     </MapView>
//   );
// }

// app/request/track-donor.tsx
// import { usePusherChannel } from "@/hooks/usePusher";
// import { useLocalSearchParams } from "expo-router";
// import React, { useState } from "react";
// import { Platform, Text, View } from "react-native";
// import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

// export default function TrackDonorScreen() {
//   const { requestId } = useLocalSearchParams<{ requestId?: string }>();

//   const [donorCoords, setDonorCoords] = useState<{
//     lat: number;
//     lng: number;
//   } | null>(null);

//   // ❗ Prevent crash if param missing
//   const channel = requestId ? `request.${requestId}` : null;

//   usePusherChannel(
//     channel ?? "",
//     "donation_request.location_updated",
//     (data: { donor_latitude: string; donor_longitude: string }) => {
//       setDonorCoords({
//         lat: parseFloat(data.donor_latitude),
//         lng: parseFloat(data.donor_longitude),
//       });
//     },
//   );

//   // ❌ WEB SAFE FALLBACK (IMPORTANT FIX)
//   if (Platform.OS === "web") {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text style={{ fontSize: 18, fontWeight: "600" }}>
//           Live tracking is only available on mobile devices 📱
//         </Text>
//       </View>
//     );
//   }

//   // ⏳ Waiting state
//   if (!donorCoords) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text style={{ fontSize: 48 }}>⏳</Text>
//         <Text style={{ marginTop: 12, color: "#6b7280" }}>
//           Waiting for donor location updates...
//         </Text>
//       </View>
//     );
//   }

//   // 🗺️ MAP VIEW (MOBILE ONLY)
//   return (
//     <MapView
//       provider={PROVIDER_GOOGLE}
//       style={{ flex: 1 }}
//       region={{
//         latitude: donorCoords.lat,
//         longitude: donorCoords.lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       }}
//     >
//       <Marker
//         coordinate={{
//           latitude: donorCoords.lat,
//           longitude: donorCoords.lng,
//         }}
//         title="Donor"
//         description="Live location"
//       />
//     </MapView>
//   );
// }

// import { usePusherChannel } from "@/hooks/usePusher";
// import { useLocalSearchParams } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { Platform, Text, View } from "react-native";

// export default function TrackDonorScreen() {
//   const { requestId } = useLocalSearchParams<{ requestId?: string }>();

//   const [MapComponents, setMapComponents] = useState<any>(null);
//   const [donorCoords, setDonorCoords] = useState<{
//     lat: number;
//     lng: number;
//   } | null>(null);

//   // ✅ Load map ONLY on native
//   useEffect(() => {
//     if (Platform.OS !== "web") {
//       import("react-native-maps").then((mod) => {
//         setMapComponents(mod);
//       });
//     }
//   }, []);

//   usePusherChannel(
//     requestId ? `request.${requestId}` : "",
//     "donation_request.location_updated",
//     (data: { donor_latitude: string; donor_longitude: string }) => {
//       setDonorCoords({
//         lat: parseFloat(data.donor_latitude),
//         lng: parseFloat(data.donor_longitude),
//       });
//     },
//   );

//   // 🌐 WEB SAFE UI
//   if (Platform.OS === "web") {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text style={{ fontSize: 16 }}>
//           Live tracking is not supported on web
//         </Text>
//       </View>
//     );
//   }

//   // ⏳ waiting
//   if (!donorCoords || !MapComponents) {
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <Text>Loading map...</Text>
//       </View>
//     );
//   }

//   const MapView = MapComponents.default;
//   const Marker = MapComponents.Marker;
//   const PROVIDER_GOOGLE = MapComponents.PROVIDER_GOOGLE;

//   return (
//     <MapView
//       provider={PROVIDER_GOOGLE}
//       style={{ flex: 1 }}
//       region={{
//         latitude: donorCoords.lat,
//         longitude: donorCoords.lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       }}
//     >
//       <Marker
//         coordinate={{
//           latitude: donorCoords.lat,
//           longitude: donorCoords.lng,
//         }}
//         title="Donor"
//       />
//     </MapView>
//   );
// }

// app/blood-request/track-donor.tsx

// import { usePusherChannel } from "@/hooks/usePusher";
// import { useLocalSearchParams } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { Platform, Text, View } from "react-native";

// export default function TrackDonorScreen() {
//   const { requestId } = useLocalSearchParams<{ requestId?: string }>();

//   const [donorCoords, setDonorCoords] = useState<{
//     lat: number;
//     lng: number;
//   } | null>(null);

//   const [MapComponents, setMapComponents] = useState<any>(null);

//   // ✅ Dynamically load react-native-maps ONLY on mobile
//   useEffect(() => {
//     if (Platform.OS !== "web") {
//       const maps = require("react-native-maps");

//       setMapComponents({
//         MapView: maps.default,
//         Marker: maps.Marker,
//         PROVIDER_GOOGLE: maps.PROVIDER_GOOGLE,
//       });
//     }
//   }, []);

//   // ✅ Pusher listener
//   usePusherChannel(
//     requestId ? `request.${requestId}` : "",
//     "donation_request.location_updated",
//     (data: { donor_latitude: string; donor_longitude: string }) => {
//       setDonorCoords({
//         lat: parseFloat(data.donor_latitude),
//         lng: parseFloat(data.donor_longitude),
//       });
//     },
//   );

//   // ✅ WEB FALLBACK
//   if (Platform.OS === "web") {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           padding: 20,
//         }}
//       >
//         <Text
//           style={{
//             fontSize: 20,
//             fontWeight: "bold",
//             marginBottom: 10,
//           }}
//         >
//           Live Tracking
//         </Text>

//         <Text
//           style={{
//             textAlign: "center",
//             color: "#666",
//           }}
//         >
//           Live donor tracking is only available on Android/iOS devices.
//         </Text>
//       </View>
//     );
//   }

//   // ✅ Loading map module
//   if (!MapComponents) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <Text>Loading map...</Text>
//       </View>
//     );
//   }

//   // ✅ Waiting for coordinates
//   if (!donorCoords) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <Text style={{ fontSize: 48 }}>⏳</Text>

//         <Text
//           style={{
//             marginTop: 12,
//             color: "#6b7280",
//           }}
//         >
//           Waiting for donor location updates...
//         </Text>
//       </View>
//     );
//   }

//   const { MapView, Marker, PROVIDER_GOOGLE } = MapComponents;

//   // ✅ Mobile map
//   return (
//     <MapView
//       provider={PROVIDER_GOOGLE}
//       style={{ flex: 1 }}
//       region={{
//         latitude: donorCoords.lat,
//         longitude: donorCoords.lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       }}
//     >
//       <Marker
//         coordinate={{
//           latitude: donorCoords.lat,
//           longitude: donorCoords.lng,
//         }}
//         title="Donor"
//         description="Live donor location"
//       />
//     </MapView>
//   );
// }

// import { usePusherChannel } from "@/hooks/usePusher";
// import { useLocalSearchParams } from "expo-router";
// import React, { useEffect, useState } from "react";
// import { Platform, Text, View } from "react-native";

// export default function TrackDonorScreen() {
//   const { requestId } = useLocalSearchParams<{ requestId?: string }>();

//   const [donorCoords, setDonorCoords] = useState<{
//     lat: number;
//     lng: number;
//   } | null>(null);

//   const [MapComponents, setMapComponents] = useState<any>(null);

//   // =========================
//   // VALIDATE REQUEST ID
//   // =========================
//   const validRequestId =
//     typeof requestId === "string" && requestId.length > 0 ? requestId : null;

//   // =========================
//   // LOAD MAP (ANDROID ONLY)
//   // =========================
//   useEffect(() => {
//     if (Platform.OS === "web") return;

//     try {
//       const maps = require("react-native-maps");

//       setMapComponents({
//         MapView: maps.default,
//         Marker: maps.Marker,
//         PROVIDER_GOOGLE: maps.PROVIDER_GOOGLE,
//       });
//     } catch (err) {
//       console.log("Map load error:", err);
//     }
//   }, []);

//   // =========================
//   // PUSHER LISTENER (SAFE)
//   // =========================
//   usePusherChannel(
//     validRequestId ? `request.${validRequestId}` : "",
//     "donation_request.location_updated",
//     (data: any) => {
//       if (!data?.donor_latitude || !data?.donor_longitude) return;

//       setDonorCoords({
//         lat: parseFloat(data.donor_latitude),
//         lng: parseFloat(data.donor_longitude),
//       });
//     },
//   );

//   // =========================
//   // WEB VIEW
//   // =========================
//   if (Platform.OS === "web") {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//           padding: 20,
//         }}
//       >
//         <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
//           Live Tracking
//         </Text>

//         <Text style={{ textAlign: "center", color: "#666" }}>
//           Live donor tracking is only available on Android/iOS devices.
//         </Text>
//       </View>
//     );
//   }

//   // =========================
//   // INVALID REQUEST ID SAFETY
//   // =========================
//   if (!validRequestId) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <Text style={{ color: "red", fontSize: 16 }}>Invalid request ID</Text>
//       </View>
//     );
//   }

//   // =========================
//   // LOADING MAP
//   // =========================
//   if (!MapComponents) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <Text>Loading map...</Text>
//       </View>
//     );
//   }

//   const { MapView, Marker, PROVIDER_GOOGLE } = MapComponents;

//   // =========================
//   // WAITING FOR LOCATION
//   // =========================
//   if (!donorCoords) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: "center",
//           alignItems: "center",
//         }}
//       >
//         <Text style={{ fontSize: 48 }}>⏳</Text>

//         <Text style={{ marginTop: 12, color: "#6b7280" }}>
//           Waiting for donor location updates...
//         </Text>
//       </View>
//     );
//   }

//   // =========================
//   // MAP VIEW
//   // =========================
//   return (
//     <MapView
//       provider={PROVIDER_GOOGLE}
//       style={{ flex: 1 }}
//       region={{
//         latitude: donorCoords.lat,
//         longitude: donorCoords.lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       }}
//     >
//       <Marker
//         coordinate={{
//           latitude: donorCoords.lat,
//           longitude: donorCoords.lng,
//         }}
//         title="Donor"
//         description="Live donor location"
//       />
//     </MapView>
//   );
// }
