import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export type BloodRequest = {
  id: string;
  name: string;
  location: string;
  time: string;
  bloodGroup: string;
};

const AvatarPlaceholder = ({ className = "" }: { className?: string }) => (
  <View className={`rounded-full bg-gray-200 ${className}`} />
);

const BloodGroupBadge = ({ group }: { group: string }) => (
  <View className="items-center justify-center w-10 h-10 bg-red-500 rounded-full">
    <Text className="text-xs font-bold text-white">{group}</Text>
  </View>
);

export default function RequestCard({ item }: { item: BloodRequest }) {
  return (
    <View className="p-4 mb-5 bg-white shadow-sm rounded-2xl elevation-2">
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

      {/* Buttons */}
      <View className="flex-row items-center gap-2 mt-2">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/blood-request/[id]",
              params: { id: item.id },
            })
          }
          className="flex-1 bg-red-500 rounded-xl py-2.5 px-1 items-center"
        >
          <Text className="text-sm font-semibold text-white">View Details</Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-1 border border-red-400 rounded-xl py-2.5 items-center">
          <Text className="text-sm font-semibold text-red-500">
            Donate Blood
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="items-center justify-center border border-gray-200 w-11 h-11 rounded-xl">
          <FontAwesome6 name="phone-volume" size={18} color="#1F1F1F" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
