import "../global.css";

import { FontAwesome6 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
};

const CATEGORIES = [
  { id: "1", label: "Donate Blood", icon: "🩸" },
  { id: "2", label: "Donate\nBlood", icon: "💉" },
  { id: "3", label: "Hospital", icon: "🏥" },
  { id: "4", label: "Donror", icon: "👤" },
];

const BLOOD_REQUESTS: BloodRequest[] = [
  {
    id: "1",
    name: "Aayan Shrestha",
    location: "Gwarko, Lalitpur (2 min away)",
    time: "5 min ago",
    bloodGroup: "A+",
  },
  {
    id: "2",
    name: "Priya Maharjan",
    location: "Pulchowk, Lalitpur (5 min away)",
    time: "12 min ago",
    bloodGroup: "O-",
  },
  {
    id: "3",
    name: "Rajan Thapa",
    location: "Baneshwor, Kathmandu (10 min away)",
    time: "20 min ago",
    bloodGroup: "B+",
  },
];

const AvatarPlaceholder = ({ className = "" }: { className?: string }) => (
  <View className={`rounded-full bg-gray-200 ${className}`} />
);

const BloodGroupBadge = ({ group }: { group: string }) => (
  <View className="items-center justify-center w-10 h-10 rounded-full bg-primary-200">
    <Text className="text-xs font-bold text-white">{group}</Text>
  </View>
);

const RequestCard = ({ item }: { item: BloodRequest }) => (
  <View className="p-4 mb-5 bg-white shadow-sm rounded-2xl shadow-black/10 elevation-2">
    {/* Top row */}
    <View className="flex-row items-center mb-3">
      <AvatarPlaceholder className="mr-3 w-14 h-14" />

      <View className="flex-1">
        <Text className="font-bold text-base text-gray-900 mb-0.5">
          {item.name}
        </Text>
        <View className="flex-row items-center mb-0.5">
          <Text className="mr-1 text-xs text-red-500">📍</Text>
          <Text className="flex-shrink text-xs text-gray-500">
            {item.location}
          </Text>
        </View>
        <Text className="text-xs text-gray-400">{item.time}</Text>
      </View>

      <BloodGroupBadge group={item.bloodGroup} />
    </View>

    {/* Action buttons */}
    <View className="flex-row items-center gap-2 mt-2">
      <TouchableOpacity
        className="flex-1 border border-primary-200 rounded-xl py-2.5 items-center"
        activeOpacity={0.7}
      >
        <Text className="text-sm font-semibold text-primary-200">
          View Details
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-1 bg-primary-200 rounded-xl py-2.5 items-center"
        activeOpacity={0.7}
      >
        <Text className="text-sm font-semibold text-white">Donate Blood</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="items-center justify-center border border-gray-200 w-11 h-11 rounded-xl"
        activeOpacity={0.7}
      >
        <FontAwesome6 name="phone-volume" size={20} color="#1F1F1F" />
      </TouchableOpacity>
    </View>
  </View>
);

//main
export default function BloodDonorScreen() {
  const [search, setSearch] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black-300">
      <StatusBar barStyle="light-content" backgroundColor="#dc2626" />

      {/* ── Header ── */}
      <View className="px-5 py-5 pb-6 bg-primary-200 rounded-br-3xl rounded-bl-3xl">
        {/* Top row */}
        <View className="flex-row items-center justify-between pt-1 mb-4">
          <TouchableOpacity>
            <FontAwesome6 name="align-left" size={22} color="#ffffff" />
          </TouchableOpacity>

          <Text className="text-xl font-bold tracking-wide text-white">
            Blood Donor
          </Text>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => router.push("/profile")}>
              <AvatarPlaceholder className="w-9 h-9 bg-white/30" />
            </TouchableOpacity>
            <TouchableOpacity className="p-1">
              <FontAwesome6 name="bell" size={24} color="#ffffff" solid />
            </TouchableOpacity>
          </View>
        </View>
        {/* Search bar */}
        <View className="flex-row items-center gap-3 my-2">
          <View className="flex-row items-center flex-1 px-3 py-2 bg-white shadow rounded-2xl shadow-black/10 elevation-3">
            <FontAwesome6 name="magnifying-glass" size={20} />
            <TextInput
              placeholder="Search For Donors"
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              className="flex-1 ml-2 text-sm text-gray-900"
            />
          </View>
          <TouchableOpacity className="">
            <Image
              source={require("../../assets/icons/filter.png")}
              className="w-7 h-7"
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
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
                "rgba(220,38,38,0.65)", // top red
                "rgba(220,38,38,0.2)", // middle light red
                "transparent", // bottom transparent
              ]}
              className="p-6 rounded-3xl"
            >
              <View className="p-3">
                <Text className="text-2xl text-white">
                  Become a Blood Donor
                </Text>
                <Text className="text-white">
                  Join our donor community and help save lives during
                  emergencies.
                </Text>
                <Pressable
                  onPress={() => {}}
                  className="text-white rounded-bg bg-primary-100 w-fit"
                >
                  <Text>Become Donor</Text>
                </Pressable>
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
            >
              <View className="items-center justify-center w-16 h-16 bg-white rounded-full">
                <Text className="text-3xl">{cat.icon}</Text>
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
            <TouchableOpacity>
              <Text className="text-sm font-semibold text-primary-200">
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cards */}
          {BLOOD_REQUESTS.map((item) => (
            <RequestCard key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
