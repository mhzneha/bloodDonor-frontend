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

interface LoggedInUser {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  jti: string;
}

interface LoginSuccessResponse {
  message: string;
  user: LoggedInUser;
  token: string;
}

interface LoginErrorResponse {
  errors?: string[];
  error?: string;
}

const API_URL =
  "https://proposal-overlying-magazine.ngrok-free.dev/users/sign_in";

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const router = useRouter();

  const handleLogin = async (): Promise<void> => {
    setErrors([]);

    // Local validation
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

      // ✅ Store token here (AsyncStorage / SecureStore recommended)
      // await AsyncStorage.setItem("token", response.data.token);
      // await AsyncStorage.setItem("user", JSON.stringify(response.data.user));

      console.log("Token:", response.data.token);
      console.log("User:", response.data.user);

      router.replace("/(tabs)");
    } catch (err) {
      const error = err as AxiosError<LoginErrorResponse>;

      if (error.response) {
        const data = error.response.data;
        // Handle both { errors: string[] } and { error: string } shapes
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
        <Text className="mb-5 text-2xl font-bold text-center dark:text-white">
          Logo
        </Text>
        <Text className="mb-2 text-3xl font-bold text-center dark:text-white">
          Welcome Back!
        </Text>
        <Text className="my-1 text-base text-center text-textColor-100 dark:text-white">
          Sign in to your Account
        </Text>

        <View className="p-5 mt-5 bg-white rounded-lg dark:bg-gray-800">
          {/* Error messages */}
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

          <View>
            <Text className="mb-2 dark:text-white">Password</Text>
            <TextInput
              className="p-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              value={password}
              onChangeText={(text: string) => setPassword(text)}
            />
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

        <View>
          <Text className="my-5 text-center dark:text-white">
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
