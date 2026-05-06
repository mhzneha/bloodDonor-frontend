import { router } from "expo-router";
import React from "react";
import { Button, Text, View } from "react-native";

export default function register() {
  return (
    <View>
      <Text className="text-white">register</Text>
      <Button
        title="Login"
        onPress={() => {
          router.push("/login");
        }}
      />
    </View>
  );
}
