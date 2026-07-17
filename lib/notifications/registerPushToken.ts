// import { updatePushToken } from "@/lib/api/user";
// import Constants from "expo-constants";
// import * as Device from "expo-device";
// import * as Notifications from "expo-notifications";
// import { Platform } from "react-native";

// export async function registerForPushNotificationsAsync(): Promise<
//   string | null
// > {
//   if (!Device.isDevice) {
//     console.log("Push notifications require a physical device");
//     return null;
//   }

//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;

//   if (existingStatus !== "granted") {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   if (finalStatus !== "granted") {
//     console.log("Push notification permission denied");
//     return null;
//   }

//   if (Platform.OS === "android") {
//     await Notifications.setNotificationChannelAsync("default", {
//       name: "default",
//       importance: Notifications.AndroidImportance.HIGH,
//       vibrationPattern: [0, 250, 250, 250],
//       lightColor: "#EF4444",
//     });
//   }

//   const projectId =
//     Constants?.expoConfig?.extra?.eas?.projectId ??
//     Constants?.easConfig?.projectId;

//   if (!projectId) {
//     console.log("Missing EAS projectId — cannot generate push token");
//     return null;
//   }

//   const tokenResponse = await Notifications.getExpoPushTokenAsync({
//     projectId,
//   });
//   const pushToken = tokenResponse.data;

//   try {
//     await updatePushToken(pushToken);
//   } catch (err) {
//     console.log("Failed to save push token to backend:", err);
//   }

//   return pushToken;
// }

import { updatePushToken } from "@/lib/api/user";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Push notification permission denied");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EF4444",
    });
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.log("Missing EAS projectId — cannot generate push token");
    return null;
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({
    projectId,
  });
  const pushToken = tokenResponse.data;

  try {
    await updatePushToken(pushToken);
  } catch (err) {
    console.log("Failed to save push token to backend:", err);
  }

  return pushToken;
}
