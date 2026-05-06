import { router } from "expo-router";
import React from "react";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function login() {
  return (
    <SafeAreaView>
      <Text className="text-white">login</Text>
      <Button
        title="Register"
        onPress={() => {
          router.push("/register");
        }}
      />
    </SafeAreaView>
  );
}
