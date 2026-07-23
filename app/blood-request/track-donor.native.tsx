// import { useLocalSearchParams } from "expo-router";
// import React, { useState } from "react";
// import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

// export default function TrackDonorScreen() {
//   const { requestId } = useLocalSearchParams<{ requestId?: string }>();

//   const [coords] = useState({
//     lat: 27.7172,
//     lng: 85.324,
//   });

//   return (
//     <MapView
//       provider={PROVIDER_GOOGLE}
//       style={{ flex: 1 }}
//       initialRegion={{
//         latitude: coords.lat,
//         longitude: coords.lng,
//         latitudeDelta: 0.01,
//         longitudeDelta: 0.01,
//       }}
//     >
//       <Marker
//         coordinate={{
//           latitude: coords.lat,
//           longitude: coords.lng,
//         }}
//         title="Donor Location"
//       />
//     </MapView>
//   );
// }
