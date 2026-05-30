import { FontAwesome6 } from "@expo/vector-icons";
import axios, { AxiosError } from "axios";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

interface RegisterRequestBody {
  user: {
    name: string;
    email: string;
    password: string;
    phone_number: string;
  };
}

interface RegisteredUser {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  jti: string;
}

interface RegisterSuccessResponse {
  message: string;
  user: RegisteredUser;
}

interface RegisterErrorResponse {
  errors: string[];
}

const API_URL = "https://blood-donor-finder-be.onrender.com/users";

export default function Register() {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const scheme = useColorScheme();

  const isValidNepaliPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, ""); // remove spaces, dashes

    const pattern = /^(98|97|96)\d{8}$/;

    return pattern.test(cleaned);
  };

  const handleRegister = async (): Promise<void> => {
    setErrors([]);

    const isStrongPassword = (password: string) => {
      const minLength = /.{8,}/;
      const upperCase = /[A-Z]/;
      const number = /[0-9]/;
      const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

      return (
        minLength.test(password) &&
        upperCase.test(password) &&
        number.test(password) &&
        specialChar.test(password)
      );
    };

    if (!fullName || !email || !password || !confirmPassword) {
      setErrors(["Please fill in all required fields"]);
      return;
    }

    if (!email.includes("@")) {
      setErrors(["Please enter a valid email"]);
      return;
    }

    if (!isValidNepaliPhone(phone)) {
      setErrors([
        "Please enter a valid Nepali phone number (10 digits starting with 98, 97, or 96)",
      ]);
      return;
    }

    if (!isStrongPassword(password)) {
      setErrors([
        "Password must be at least 8 characters long and include 1 uppercase letter, 1 number, and 1 special character",
      ]);
      return;
    }

    if (password !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      return;
    }

    const requestBody: RegisterRequestBody = {
      user: {
        name: fullName,
        email: email,
        password: password,
        phone_number: phone.replace(/\D/g, ""),
      },
    };

    setLoading(true);
    try {
      const response = await axios.post<RegisterSuccessResponse>(
        API_URL,
        requestBody,
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      alert(`Welcome, ${response.data.user.name}! Registration successful.`);
      router.push("/login");
    } catch (err) {
      const error = err as AxiosError<RegisterErrorResponse>;

      if (error.response) {
        const serverErrors = error.response.data?.errors;
        setErrors(
          Array.isArray(serverErrors)
            ? serverErrors
            : ["Something went wrong. Please try again."],
        );
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
    <SafeAreaView className="bg-gray-100 dark:bg-gray-900">
      {/* ✅ Header sits outside KeyboardAvoidingView so it never gets pushed */}
      <View className="flex-row items-center px-4 py-1">
        <TouchableOpacity onPress={() => router.back()}>
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

      {/* ✅ flex-1 so it takes remaining space after the header */}
      <KeyboardAvoidingView
        // style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* ✅ showsVerticalScrollIndicator for visibility while debugging */}
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Form card */}
          <View className="p-5 bg-white shadow-md dark:bg-gray-800 rounded-2xl">
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
              <Text className="mb-2 text-gray-700 dark:text-white">
                Full Name
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="John Doe"
                placeholderTextColor="#9CA3AF"
                value={fullName}
                onChangeText={(text: string) => setFullName(text)}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">Email</Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="john@example.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text: string) => setEmail(text)}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Phone Number
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="+977-9841000000"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(text: string) => setPhone(text)}
              />
            </View>

            {/* <View className="mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Password
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={password}
                onChangeText={(text: string) => setPassword(text)}
              />
            </View> */}

            <View className="relative mb-4">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Password
              </Text>

              <TextInput
                className="p-4 pr-12 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text: string) => setPassword(text)}
              />

              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-11"
              >
                <FontAwesome6
                  name={showPassword ? "eye-slash" : "eye"}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* <View className="mb-2">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Confirm Password
              </Text>
              <TextInput
                className="p-4 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text: string) => setConfirmPassword(text)}
              />
            </View> */}

            <View className="relative mb-2">
              <Text className="mb-2 text-gray-700 dark:text-white">
                Confirm Password
              </Text>

              <TextInput
                className="p-4 pr-12 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                placeholder="Confirm Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={(text: string) => setConfirmPassword(text)}
              />

              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-11"
              >
                <FontAwesome6
                  name={showConfirmPassword ? "eye-slash" : "eye"}
                  size={18}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={loading}
              className={`items-center w-full py-3 mt-5 rounded-full ${
                loading ? "bg-primary-100/60" : "bg-primary-100"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-xl font-extrabold text-white">
                  Register
                </Text>
              )}
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
