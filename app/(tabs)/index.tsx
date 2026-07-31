import DonorSearchFilter from "@/components/donor-search-filter";
import "../global.css";

import type { LoggedInUser } from "@/types/user";
import RequestCard from "@/components/request-card";
import { fetchNotifications } from "@/lib/api/notification";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type BloodRequest = {
  id: string;
  name: string;
  location: string;
  time: string;
  bloodGroup: string;
  unitsRequired: number;
  unitsCollected: number;
};

const CATEGORIES = [
  {
    id: "1",
    label: "Incoming\nrequest",
    icon: require("@/assets/icons/add-request.png"),
  },
  {
    id: "2",
    label: "My Request",
    icon: require("@/assets/icons/find-donor.png"),
  },
  {
    id: "3",
    label: "Find Donors",
    icon: require("@/assets/icons/donors-location.png"),
  },
  { id: "4", label: "Donror", icon: "" },
];

const AvatarPlaceholder = ({ className = "" }: { className?: string }) => (
  <View className={`rounded-full bg-gray-200 ${className}`} />
);

const BloodGroupBadge = ({ group }: { group: string }) => (
  <View className="items-center justify-center w-10 h-10 rounded-full bg-primary-200">
    <Text className="text-xs font-bold text-white">{group}</Text>
  </View>
);

//main
export default function BloodDonorScreen() {
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  // const isDonor = !!user?.is_donor;
  const isDonor = user?.is_donor === true;
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      const res = await axios.get(
        "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = res.data.blood_requests;

      let filtered = [];

      const critical = data.filter((i: any) => i.urgency === "critical");
      const urgent = data.filter((i: any) => i.urgency === "urgent");
      const normal = data.filter((i: any) => i.urgency === "normal");

      if (critical.length > 0) {
        filtered = critical;
      } else if (urgent.length > 0) {
        filtered = urgent;
      } else {
        filtered = normal;
      }

      const formatted = filtered.slice(0, 3).map((item: any) => ({
        id: String(item.id),
        name: item.patient_name,
        location: item.hospital_name,
        time: new Date(item.created_at).toLocaleString(),
        bloodGroup: item.blood_group,
        phone_number: item.contact_number,
        unitsRequired: item.units_required,
        unitsCollected: item.units_collected,
      }));

      setRequests(formatted);
    } catch (err) {
      console.log("ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchRequests();
  // }, []);
  // useEffect(() => {
  //   const loadUser = async () => {
  //     try {
  //       const storedUser = await AsyncStorage.getItem("user");
  //       if (storedUser) {
  //         const parsedUser = JSON.parse(storedUser);
  //         setUser(parsedUser);
  //       }
  //     } catch (e) {
  //       console.log("User load error:", e);
  //     }
  //   };

  //   loadUser();
  //   fetchRequests();
  // }, []);

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (e) {
          console.log("User load error:", e);
        }
      };

      loadUser();
      fetchRequests();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch (e) {
          console.log("User load error:", e);
        }
      };

      const loadUnreadCount = async () => {
        try {
          const notifications = await fetchNotifications();
          const unread = notifications.filter((n) => n.read_at === null).length;
          setUnreadCount(unread);
        } catch (e) {
          console.log("Notification load error:", e);
        }
      };

      loadUser();
      fetchRequests();
      loadUnreadCount();
    }, []),
  );

  const handleCategoryPress = async (id: string) => {
    // const user = await AsyncStorage.getItem("user");
    // const parsedUser = user ? JSON.parse(user) : null;

    // const isDonor = parsedUser?.role === "donor";

    if (id === "1") {
      // if (isDonor) {
      router.push("/blood-donor/request");
      // } else {
      // alert("Only registered donors can view incoming requests.");
      // }
    }

    if (id === "2") {
      router.push("/blood-request/my-request");
    }

    if (id === "3") {
      router.push("/blood-donor/donor-map");
    }

    if (id === "4") {
      router.push("/profile");
    }
  };

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black-300">
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />

      {/* ── Header ── */}
      <View className="px-5 py-5 pb-6 bg-primary-200 rounded-br-3xl rounded-bl-3xl" style={{ zIndex: 20, elevation: 20 }}>
      
        {/* Top row */}
        <View className="flex-row items-center justify-between pt-1 mb-4">
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <AvatarPlaceholder className="w-9 h-9 bg-white/30" />
          </TouchableOpacity>

          <Text className="text-xl font-bold tracking-wide text-white">
            Blood Donor
          </Text>

          {/* <View className="flex-row items-center gap-3">
            <TouchableOpacity className="p-1">
              <FontAwesome6 name="bell" size={24} color="#ffffff" solid />
            </TouchableOpacity>
          </View> */}

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              className="p-1"
              onPress={() => router.push("/notifications")}
            >
              <View className="relative">
                <FontAwesome6 name="bell" size={24} color="#ffffff" solid />
                {unreadCount > 0 && (
                  <View className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-green-500 rounded-full" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Search bar */}
        <DonorSearchFilter onDropdownVisibilityChange={setDropdownOpen} />
      </View>

      <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dropdownOpen}
          contentContainerStyle={{ paddingBottom: 32 }}
        >
        {/* Become donor card */}
        <View className="">
          <ImageBackground
            source={require("../../assets/images/bg-donor.jpg")}
            resizeMode="contain"
            imageStyle={{
              borderRadius: 15,
            }}
            className="mx-4 mt-5 overflow-hidden h-100 rounded-2xl"
          >
            <LinearGradient
              colors={[
                "rgba(220,38,38,0.75)",
                "rgba(220,38,38,0.5)",
                "rgba(220,38,38,0.2)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              className="p-2 rounded-3xl"
            >
              <View className="p-3">
                <Text className="text-2xl font-semibold text-white">
                  Become a Blood Donor
                </Text>
                <Text className="text-white">
                  Join our donor community and help save lives during
                  emergencies.
                </Text>
                <View className="flex-row gap-3 mt-3">
                  {/* Keep Request Blood always visible */}
                  <Pressable
                    onPress={() => router.push("/blood-request/create")}
                    className="px-3 py-1 bg-white rounded-xl"
                  >
                    <Text className="text-base font-semibold text-primary-100">
                      Request Blood
                    </Text>
                  </Pressable>
                  {user?.is_donor === true ? (
                    <Pressable
                      onPress={() => router.push("/blood-donor/detail")}
                      className="px-3 py-1 bg-white rounded-xl"
                    >
                      <Text className="text-base font-semibold text-primary-100">
                        View Donor Profile
                      </Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => router.push("/blood-donor/create")}
                      className="px-3 py-1 bg-white rounded-xl"
                    >
                      <Text className="text-base font-semibold text-primary-100">
                        Become Donor
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>
        {/* ── Categories ── */}
        <View className="flex-row px-5 pt-6 pb-2">
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              className="items-center flex-1 gap-2"
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(cat.id)}
            >
              <View className="items-center justify-center w-16 h-16 bg-white rounded-full">
                {/* <Text className="text-3xl">{cat.icon}</Text> */}
                <Image source={cat.icon} className="!w-10 !h-10" />
              </View>
              {cat.label ? (
                <Text
                  className="text-xs font-medium leading-tight text-center text-textColor-100 dark:text-white"
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {cat.label}
                </Text>
              ) : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Blood Requests ── */}
        <View className="px-5 mt-5">
          {/* Section header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[17px] font-bold text-gray-900 dark:text-white">
              Blood Request
            </Text>
            <Pressable
              onPress={() => {
                router.push("/blood-request/");
              }}
            >
              <Text className="text-sm font-semibold text-primary-200">
                See All
              </Text>
            </Pressable>
          </View>

          {/* Cards */}
          {requests.map((item) => (
            <RequestCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
