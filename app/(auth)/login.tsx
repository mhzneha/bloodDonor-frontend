import Logo from "@/components/Logo";
import { LoggedInUser } from "@/types/user";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosError } from "axios";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface LoginRequestBody {
  user: {
    email: string;
    password: string;
  };
}

// interface LoggedInUser {
//   id: number;
//   email: string;
//   name: string;
//   phone_number: string;
//   is_admin: boolean;
//   created_at: string;
//   updated_at: string;
//   jti: string;
// }

interface LoginSuccessResponse {
  message: string;
  user: LoggedInUser;
  token: string;
}

interface LoginErrorResponse {
  errors?: string[];
  error?: string;
}

const API_URL = "https://blood-donor-finder-be.onrender.com/users/sign_in";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleLogin = async (): Promise<void> => {
    setErrors([]);

    if (!email || !password) {
      setErrors(["Please fill in all fields"]);
      return;
    }

    const requestBody: LoginRequestBody = {
      user: {
        email: email.trim(),
        password,
      },
    };

    setLoading(true);
    try {
      const response = await axios.post<LoginSuccessResponse>(
        API_URL,
        requestBody,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      const { token, user } = response.data;

      //Save token and user to AsyncStorage

      const safeUser = {
        ...user,
        is_donor: user?.is_donor ?? false,
      };
      await AsyncStorage.setItem("auth_token", token);
      // await AsyncStorage.setItem("user", JSON.stringify(user));
      await AsyncStorage.setItem("user", JSON.stringify(safeUser));

      router.replace("/(tabs)");
    } catch (err) {
      const error = err as AxiosError<LoginErrorResponse>;

      if (error.response) {
        const data = error.response.data;
        if (Array.isArray(data?.errors)) {
          setErrors(data.errors);
        } else if (data?.error) {
          setErrors([data.error]);
        } else {
          setErrors(["Invalid email or password."]);
        }
      } else if (error.request) {
        setErrors([
          "Network error. Please check your connection and try again.",
        ]);
      } else {
        setErrors(["An unexpected error occurred. Please try again."]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex justify-center w-full h-full">
      <View className="p-4">
        <Logo />
        <Text className="mb-2 text-3xl font-bold text-center dark:text-white">
          Welcome Back!
        </Text>
        <Text className="my-1 text-base text-center text-textColor-100 dark:text-white">
          Sign in to your Account
        </Text>

        <View className="p-5 mt-5 bg-white rounded-lg dark:bg-gray-800">
          {errors.length > 0 && (
            <View className="p-3 mb-4 border border-red-300 bg-red-50 dark:bg-red-900/30 rounded-xl">
              {errors.map((err: string, index: number) => (
                <Text
                  key={index}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  • {err}
                </Text>
              ))}
            </View>
          )}

          <View className="mb-4">
            <Text className="mb-2 dark:text-white">Email</Text>
            <TextInput
              className="p-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(text: string) => setEmail(text)}
            />
          </View>

          {/* <View>
            <Text className="mb-2 dark:text-white">Password</Text>
            <TextInput
              className="p-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={(text: string) => setPassword(text)}
            />
          </View> */}

          <View>
            <Text className="mb-2 dark:text-white">Password</Text>

            <View className="relative">
              <TextInput
                className="p-4 pr-12 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text: string) => setPassword(text)}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4"
              >
                <FontAwesome6
                  name={showPassword ? "eye-slash" : "eye"}
                  size={18}
                  color="#666"
                />
              </Pressable>
            </View>
          </View>

          <View className="flex-row justify-end py-5">
            <Link
              href="/forgotPassword"
              className="text-textColor-100 dark:text-white"
            >
              Forgot Password?
            </Link>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className={`items-center w-full py-3 rounded-full shadow-md ${
              loading ? "bg-primary-100/60" : "bg-primary-100"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-xl font-extrabold text-white">Login</Text>
            )}
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center my-5">
          <Text className="dark:text-white">Don't Have an Account? </Text>

          <Pressable onPress={() => router.push("/register")}>
            <Text className="underline text-primary-100">Register</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
