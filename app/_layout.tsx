// import {
//   DarkTheme,
//   DefaultTheme,
//   ThemeProvider,
// } from "@react-navigation/native";
// import * as Notifications from "expo-notifications";
// import { router, Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import "react-native-reanimated";
// import Toast from "react-native-toast-message";
// import "./global.css";

// import { useColorScheme } from "@/hooks/use-color-scheme";
// import { registerForPushNotificationsAsync } from "@/lib/notifications/registerPushToken";
// import { useEffect, useRef } from "react";

// // export const unstable_settings = {
// //   anchor: "(tabs)",
// // };

// Notifications.setNotificationHandler({
//   handleNotification: async () => ({
//     shouldShowAlert: true,
//     shouldShowBanner: true,
//     shouldShowList: true,
//     shouldPlaySound: true,
//     shouldSetBadge: true,
//   }),
// });

// export default function RootLayout() {
//   const colorScheme = useColorScheme();

//   const notificationListener = useRef<Notifications.Subscription | undefined>(
//     undefined,
//   );
//   const responseListener = useRef<Notifications.Subscription | undefined>(
//     undefined,
//   );

//   useEffect(() => {
//     registerForPushNotificationsAsync();

//     // notification arrives while app is open
//     notificationListener.current =
//       Notifications.addNotificationReceivedListener((notification) => {
//         console.log("Notification received in foreground:", notification);
//       });

//     // user taps the notification (foreground, background, or killed via getLastNotificationResponse)
//     responseListener.current =
//       Notifications.addNotificationResponseReceivedListener((response) => {
//         const data = response.notification.request.content.data;

//         if (data?.notifiable_type === "BloodDonationRequest") {
//           router.push({
//             pathname: "/blood-donor/request",
//             params: { id: String(data.notifiable_id) },
//           });
//         } else if (data?.notifiable_type === "BloodRequest") {
//           router.push({
//             pathname: "/(tabs)/blood-request/matching-donor",
//             params: { id: String(data.notifiable_id) },
//           });
//         } else {
//           router.push("/notifications");
//         }
//       });

//     return () => {
//       notificationListener.current?.remove();
//       responseListener.current?.remove();
//     };
//   }, []);

//   return (
//     <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//       <Stack>
//         <Stack.Screen name="(auth)" options={{ headerShown: false }} />
//         <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//         <Stack.Screen
//           name="modal"
//           options={{ presentation: "modal", title: "Modal" }}
//         />
//         <Stack.Screen
//           name="blood-request/my-request"
//           options={{
//             title: "My Request",
//             headerBackTitle: "Back",
//           }}
//         />
//       </Stack>
//       <StatusBar style="auto" />
//       <Toast />
//     </ThemeProvider>
//   );
// }

// // import { Stack } from "expo-router";
// // import { useEffect, useState } from "react";
// // import { ActivityIndicator, View } from "react-native";

// // export default function RootLayout() {
// //   const [isLoggedIn, setIsLoggedIn] = useState(false);
// //   const [loading, setLoading] = useState(true);

// //   useEffect(() => {
// //     setTimeout(() => {
// //       setIsLoggedIn(false);
// //       setLoading(false);
// //     }, 1000);
// //   }, []);

// //   if (loading) {
// //     return (
// //       <View className="items-center justify-center flex-1">
// //         <ActivityIndicator />
// //       </View>
// //     );
// //   }

// //   return (
// //     <Stack screenOptions={{ headerShown: false }}>
// //       {!isLoggedIn ? (
// //         <Stack.Screen name="(auth)" />
// //       ) : (
// //         <Stack.Screen name="(tabs)" />
// //       )}
// //     </Stack>
// //   );
// // }

import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { router, Stack, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import Toast from "react-native-toast-message";
import "./global.css";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { registerForPushNotificationsAsync } from "@/lib/notifications/registerPushToken";
import { ActivityIndicator, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();

  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );

  // redirect based on auth state
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  // push notifications only once we have a logged-in user
  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;

        if (data?.notifiable_type === "BloodDonationRequest") {
          router.push({
            pathname: "/blood-donor/request",
            params: { id: String(data.notifiable_id) },
          });
        } else if (data?.notifiable_type === "BloodRequest") {
          router.push({
            pathname: "/(tabs)/blood-request/matching-donor",
            params: { id: String(data.notifiable_id) },
          });
        } else {
          router.push("/notifications");
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="#ED3632" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
        <Stack.Screen
          name="blood-request/my-request"
          options={{
            title: "My Request",
            headerBackTitle: "Back",
          }}
        />
      </Stack>
      <StatusBar style="auto" />
      <Toast />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
