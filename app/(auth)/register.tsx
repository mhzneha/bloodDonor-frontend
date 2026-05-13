import { FontAwesome6 } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const scheme = useColorScheme();

  const handleRegister = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Registration Successful!");
    router.push("/login");
  };

  return (
    <SafeAreaView className="bg-gray-100 dark:bg-gray-900" edges={["bottom"]}>
      <View className="flex-row items-center px-4 py-6">
        <TouchableOpacity>
          <FontAwesome6
            name="angle-left"
            size={22}
            color={scheme === "dark" ? "#ffffff" : "#000000"}
          />
        </TouchableOpacity>
        <Text className="z-10 ml-3 text-2xl font-bold text-black dark:text-white">
          Create Your Account
        </Text>
      </View>

      <KeyboardAvoidingView
        className=""
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="bg-gray-100 dark:bg-gray-900 rounded-t-3xl"
          contentContainerStyle={{ flexGrow: 1, padding: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Form card */}
          <View className="p-5 bg-white shadow-md dark:bg-gray-800 rounded-2xl">
            <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Full Name
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700"
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
            <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">Email</Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700"
                placeholder="john@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Phone Number
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700"
                placeholder="+977-9841000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>
            <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Password
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
            <View className="mb-2">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Confirm Password
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700"
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>

            <Pressable
              onPress={handleRegister}
              className="items-center w-full py-3 mt-5 rounded-full bg-primary-100"
            >
              <Text className="text-xl font-extrabold text-white">
                Register
              </Text>
            </Pressable>
          </View>

          <Text className="my-5 text-center text-gray-600 dark:text-white">
            Already have an Account?{" "}
            <Link href="/login" className="underline text-primary-100">
              Login
            </Link>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
