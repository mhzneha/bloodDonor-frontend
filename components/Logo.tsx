import React from "react";
import { Text, View } from "react-native";

export default function Logo() {
  return (
    <View className="items-center justify-center mb-6">
      <View className="items-center justify-center w-8 h-8 bg-primary-200 rounded-lg shadow-lg">
        <Text className="text-lg font-bold tracking-widest text-white">BD</Text>
      </View>

      <Text className="mt-3 text-xl font-bold text-red-600">Blood Donor</Text>
    </View>
  );
}
