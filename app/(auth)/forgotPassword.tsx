import { router } from "expo-router";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSendOtp = () => {
    if (!email) {
      alert("Please enter your email");
      return;
    }
    alert(`OTP sent to ${email}`);
    setStep("otp");
  };

  const handleVerifyOtp = () => {
    if (otp.length < 4) {
      alert("Enter the OTP");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      alert("Fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    alert("Password reset successful!");
    router.push("/login");
  };

  const stepTitles = {
    email: {
      title: "Forgot Password",
      sub: "Enter your email to receive an OTP",
    },
    otp: { title: "Verify OTP", sub: "Enter the code sent to your email" },
    reset: { title: "Reset Password", sub: "Set your new password below" },
  };

  return (
    <SafeAreaView className="flex justify-center w-full h-full bg-grayBg-100 dark:bg-gray-900">
      <KeyboardAvoidingView
        className=""
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Red curved header */}
          {/* <ImageBackground
            source={
              {
                  uri: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
              }
            }
            style={{
              width: "100%",
              height: 220,
              justifyContent: "center",
              alignItems: "center",
            }}
            imageStyle={{ opacity: 0.35, backgroundColor: "#dc2626" }}
          > */}
          <View
            style={{
              // ...StyleSheet.absoluteFillObject,
              // backgroundColor: "#dc2626",
              opacity: 0.88,
              borderBottomLeftRadius: 60,
              borderBottomRightRadius: 60,
            }}
          />
          <Text className="z-10 mb-5 text-2xl font-bold text-center text-red-500 dark:text-white">
            Logo
          </Text>
          <Text className="z-10 mt-1 mb-2 text-3xl font-bold text-center dark:text-white">
            {stepTitles[step].title}
          </Text>
          <Text className="z-10 my-1 mt-1 text-center opacity-90 dark:text-white ">
            {stepTitles[step].sub}
          </Text>
          {/* </ImageBackground> */}

          {/* Step indicators */}
          <View className="flex-row justify-center gap-2 mt-6 mb-2">
            {(["email", "otp", "reset"] as const).map((s, i) => (
              <View
                key={s}
                className={`h-2 rounded-full ${step === s ? "w-8 bg-primary-200" : "w-2 bg-gray-300"}`}
              />
            ))}
          </View>

          {/* Form card */}
          <View className="p-5 mx-4 mt-5 bg-white dark:bg-gray-800 rounded-2xl">
            {step === "email" && (
              <>
                <Text className="mb-2 text-gray-700 dark:text-white">
                  Email Address
                </Text>
                <TextInput
                  className="p-4 mb-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="john@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                <Pressable
                  onPress={handleSendOtp}
                  className="items-center py-3 rounded-full bg-primary-100"
                >
                  <Text className="text-xl font-extrabold text-white">
                    Send OTP
                  </Text>
                </Pressable>
              </>
            )}

            {step === "otp" && (
              <>
                <Text className="mb-2 text-gray-700 dark:text-white">
                  Enter OTP
                </Text>
                <TextInput
                  className="p-4 mb-2 text-2xl tracking-widest text-center text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="- - - -"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
                <Pressable onPress={() => alert("OTP resent!")}>
                  <Text className="mb-5 text-right text-primary-200">
                    Resend OTP
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleVerifyOtp}
                  className="items-center py-3 rounded-full bg-primary-100"
                >
                  <Text className="text-xl font-extrabold text-white">
                    Verify OTP
                  </Text>
                </Pressable>
              </>
            )}

            {step === "reset" && (
              <>
                <Text className="mb-2 text-gray-700 dark:text-white">
                  New Password
                </Text>
                <TextInput
                  className="p-4 mb-4 text-black bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="New Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <Text className="mb-2 text-gray-700 dark:text-white">
                  Confirm Password
                </Text>
                <TextInput
                  className="p-4 mb-6 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white"
                  placeholder="Confirm Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <Pressable
                  onPress={handleResetPassword}
                  className="items-center py-3 rounded-full bg-primary-100"
                >
                  <Text className="text-xl font-extrabold text-white">
                    Reset Password
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <Pressable
            onPress={() => router.push("/login")}
            className="mt-5 mb-6"
          >
            <Text className="my-5 text-center dark:text-white ">
              Back to <Text className="underline text-primary-100">Login</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
