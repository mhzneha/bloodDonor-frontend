// import { Stack } from "expo-router";

// export default function Layout() {
//   return (
//     <Stack
//       screenOptions={{
//         headerShown: false,
//         headerTitleAlign: "left",
//         headerTitleStyle: {
//           fontSize: 20,
//           fontWeight: "700",
//         },
//         headerShadowVisible: false,
//         headerBackTitle: "",
//       }}
//     >
//       <Stack.Screen
//         name="create"
//         options={{
//           title: "Create Request",
//           headerBackTitle: "",
//           headerShown: false,
//         }}
//       />

//       <Stack.Screen
//         name="[id]"
//         options={{
//           title: "Details",
//           headerBackTitle: "",
//           headerShown: false,
//         }}
//       />

//       <Stack.Screen
//         name="matching-donor"
//         options={{
//           title: "Matching Donor",
//           headerBackTitle: "",
//           headerShown: false,
//         }}
//       />

//       <Stack.Screen
//         name="my-request"
//         options={{
//           title: "My Request",
//           headerBackTitle: "",
//         }}
//       />
//     </Stack>
//   );
// }

import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
