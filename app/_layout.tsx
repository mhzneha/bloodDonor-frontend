import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import "./global.css";

import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="my-request"
          options={{
            title: "My Request",
            headerBackTitle: "Back",
          }}
        />
        <Stack.Screen
          name="blood-request"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="blood-donor"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}

// import { Stack } from "expo-router";
// import { useEffect, useState } from "react";
// import { ActivityIndicator, View } from "react-native";

// export default function RootLayout() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     setTimeout(() => {
//       setIsLoggedIn(false);
//       setLoading(false);
//     }, 1000);
//   }, []);

//   if (loading) {
//     return (
//       <View className="items-center justify-center flex-1">
//         <ActivityIndicator />
//       </View>
//     );
//   }

//   return (
//     <Stack screenOptions={{ headerShown: false }}>
//       {!isLoggedIn ? (
//         <Stack.Screen name="(auth)" />
//       ) : (
//         <Stack.Screen name="(tabs)" />
//       )}
//     </Stack>
//   );
// }
