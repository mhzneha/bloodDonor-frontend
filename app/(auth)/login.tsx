import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  // const handleLogin = () => {
  //   if (username == "admin" && password == "12345") {
  //     // alert("Login Successful");
  //     router.replace("/(tabs)");
  //   } else {
  //     alert("Incorrect Credential");
  //   }
  // };
  return (
    <SafeAreaView className="flex justify-center w-full h-full">
      <View className="p-4">
        <Text className="mb-5 text-2xl font-bold text-center dark:text-white">
          Logo
        </Text>
        <Text className="mb-2 text-3xl font-bold text-center dark:text-white ">
          Welcome Back!
        </Text>
        <Text className="my-1 text-base text-center text-textColor-100 dark:text-white">
          Sign in to your Account
        </Text>
        <View className="p-5 mt-5 bg-white rounded-lg dark:bg-gray-800">
          <View className="mb-4 ">
            <Text className="mb-2 dark:text-white">Username</Text>
            <TextInput
              className="p-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Email/ Phone"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
            />
          </View>
          <View className="">
            <Text className="mb-2 dark:text-white">Password</Text>
            <TextInput
              className="p-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View className="flex-row justify-end py-5">
            <Link
              href="/forgotPassword"
              className="text-textColor-100 dark:text-white"
            >
              Forgot Password?
            </Link>
            {/* <Text className="text-textColor-100 dark:text-white">
              Forgot Password?
            </Text> */}
          </View>
          <Pressable
            // onPress={handleLogin}
            onPress={() => {
              router.push("/(tabs)");
            }}
            className="items-center w-full py-3 rounded-full shadow-md bg-primary-100"
          >
            <Text className="text-xl font-extrabold text-white">Login</Text>
          </Pressable>
        </View>

        <View className="">
          <Text className="my-5 text-center dark:text-white ">
            Don't Have an Account?{" "}
            <Link href="/register" className="underline text-primary-100">
              Register
            </Link>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
