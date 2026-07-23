// app/notifications/index.tsx
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/api/notification";
import { FontAwesome6 } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const timeAgo = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NOTIFICATION_ICONS: Record<string, string> = {
  donation_request_created: "droplet",
  donation_request_accepted: "circle-check",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      console.log("NOTIFICATIONS ERROR:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  //   const handlePress = async (item: AppNotification) => {
  //     if (!item.read_at) {
  //       setNotifications((prev) =>
  //         prev.map((n) =>
  //           n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
  //         ),
  //       );
  //       try {
  //         await markNotificationAsRead(item.id);
  //       } catch (err) {
  //         console.log("MARK READ ERROR:", err);
  //       }
  //     }

  //     if (item.data?.blood_request_id) {
  //       router.push({
  //         pathname: "/(tabs)/blood-request/matching-donor",
  //         params: { id: String(item.data.blood_request_id) },
  //       });
  //     }
  //   };

  const handlePress = async (item: AppNotification) => {
    if (!item.read_at) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      try {
        await markNotificationAsRead(item.id);
      } catch (err) {
        console.log("MARK READ ERROR:", err);
      }
    }

    if (item.notifiable_type === "BloodDonationRequest") {
      router.push({
        pathname: "/blood-donor/request",
        params: { id: String(item.notifiable_id) },
      });
    } else if (item.notifiable_type === "BloodRequest") {
      router.push({
        pathname: "/blood-request/matching-donor",
        params: { id: String(item.notifiable_id) },
      });
    }
  };

  const handleMarkAllRead = async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: now })));
    try {
      await markAllNotificationsAsRead();
    } catch (err) {
      console.log("MARK ALL READ ERROR:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 pt-5">
      <View className="flex-row items-center justify-between px-5 pt-10 pb-4">
        <Text className="text-xl font-bold text-black-300 dark:text-white">
          Notifications
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text className="text-sm font-semibold text-primary-200 ">
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-16" style={{ gap: 10 }}>
              <FontAwesome6 name="bell" size={20} color="#9CA3AF" />
              <Text className="text-sm text-gray-400">
                No notifications yet
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
            className="flex-row items-start p-4 mb-2 border border-gray-200 rounded-2xl"
            style={{
              gap: 12,
              backgroundColor: item.read_at ? "#ffffff" : "#FEF2F2",
            }}
          >
            <View
              className="items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                backgroundColor: item.read_at ? "#F3F4F6" : "#FEE2E2",
              }}
            >
              <FontAwesome6
                name={NOTIFICATION_ICONS[item.notifiable_type] ?? "bell"}
                size={14}
                color={item.read_at ? "#9CA3AF" : "#EF4444"}
              />
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text className="text-sm font-bold text-black-300">
                {item.title}
              </Text>
              <Text className="text-xs text-gray-600">{item.message}</Text>
              <Text className="mt-1 text-xs text-gray-400">
                {timeAgo(item.created_at)}
              </Text>
            </View>
            {!item.read_at && (
              <View
                className="rounded-full"
                style={{ width: 8, height: 8, backgroundColor: "#EF4444" }}
              />
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
