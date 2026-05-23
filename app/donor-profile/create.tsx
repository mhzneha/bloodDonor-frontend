import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ── Constants ─────────────────────────────────────────────────────────────────
const API_URL = "http://localhost:3000/api/v1/donor_profile";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mt-5 mb-2 text-xs font-semibold tracking-widest text-gray-400 uppercase">
    {text}
  </Text>
);

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "phone-pad" | "decimal-pad";
  maxLength?: number;
  error?: string;
}) => (
  <View className="mb-3">
    <Text className="mb-1 text-sm font-medium text-gray-300">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#6b7280"
      keyboardType={keyboardType}
      maxLength={maxLength}
      className={`px-4 py-3 text-base text-white bg-gray-800 border rounded-xl ${
        error ? "border-red-500" : "border-gray-700"
      }`}
    />
    {error ? <Text className="mt-1 text-xs text-red-400">{error}</Text> : null}
  </View>
);

// ── Blood Group Dropdown ──────────────────────────────────────────────────────
const BloodGroupDropdown = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-gray-300">
        Blood Group *
      </Text>

      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between px-4 py-3 bg-gray-800 border rounded-xl ${
          error ? "border-red-500" : "border-gray-700"
        }`}
        activeOpacity={0.8}
      >
        <Text
          className={value ? "text-white text-base" : "text-gray-500 text-base"}
        >
          {value || "Select blood group"}
        </Text>
        <Text className="text-sm text-gray-400">▼</Text>
      </TouchableOpacity>

      {error ? (
        <Text className="mt-1 text-xs text-red-400">{error}</Text>
      ) : null}

      {/* Dropdown Modal */}
      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          className="items-center justify-center flex-1 bg-black/60"
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View className="w-64 overflow-hidden bg-gray-800 border border-gray-700 rounded-2xl">
            <Text className="px-5 py-4 text-sm font-semibold tracking-widest text-gray-400 uppercase border-b border-gray-700">
              Select Blood Group
            </Text>
            {BLOOD_GROUPS.map((bg) => (
              <TouchableOpacity
                key={bg}
                onPress={() => {
                  onChange(bg);
                  setOpen(false);
                }}
                className={`px-5 py-4 border-b border-gray-700/50 flex-row items-center justify-between ${
                  value === bg ? "bg-red-600/20" : ""
                }`}
              >
                <Text
                  className={`text-base font-bold ${
                    value === bg ? "text-red-400" : "text-white"
                  }`}
                >
                  {bg}
                </Text>
                {value === bg && (
                  <Text className="text-base text-red-400">✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CreateDonorProfile() {
  const router = useRouter();

  const [bloodGroup, setBloodGroup] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Field-level errors ────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // ── Validate & collect all errors ─────────────────────────────────────────
  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};

    if (!bloodGroup) errors.bloodGroup = "Please select a blood group.";

    if (!latitude.trim()) {
      errors.latitude = "Latitude is required.";
    } else if (isNaN(Number(latitude))) {
      errors.latitude = "Must be a valid number.";
    }

    if (!longitude.trim()) {
      errors.longitude = "Longitude is required.";
    } else if (isNaN(Number(longitude))) {
      errors.longitude = "Must be a valid number.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validateAll()) return; // show inline errors, stop here

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      console.log("TOKEN:", token);

      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const payload = {
        donor_profile: {
          blood_group: bloodGroup,
          latitude,
          longitude,
        },
      };

      console.log("SENDING:", payload);

      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log("SUCCESS RESPONSE:", response.data);

      // Reset form
      setBloodGroup("");
      setLatitude("");
      setLongitude("");
      setFieldErrors({});

      router.replace("/(tabs)");

      setTimeout(() => {
        Alert.alert("Success", "Donor Profile created successfully!");
      }, 300);
    } catch (err: any) {
      console.log("ERROR:", err?.response?.data);
      console.log("STATUS:", err?.response?.status);

      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Request failed";

      if (err?.response?.status === 401) {
        Alert.alert("Session expired", "Please login again");
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 py-8 bg-red-600 shadow-lg rounded-b-3xl">
          <View className="flex-row items-center gap-3">
            <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <Text className="text-lg font-bold text-white">🩸</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-white/70">
                Blood Donor Finder
              </Text>
              <Text className="text-2xl font-bold tracking-tight text-white">
                Create Donor Profile
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-sm leading-relaxed text-white/60">
            Fill in the details below to create your donor profile.
          </Text>
        </View>

        {/* Form */}
        <View className="px-5 pt-2">
          <SectionLabel text="Blood Group" />
          <BloodGroupDropdown
            value={bloodGroup}
            onChange={(v) => {
              setBloodGroup(v);
              clearFieldError("bloodGroup");
            }}
            error={fieldErrors.bloodGroup}
          />

          <SectionLabel text="Location" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field
                label="Latitude *"
                value={latitude}
                onChangeText={(v) => {
                  setLatitude(v);
                  if (v.trim()) clearFieldError("latitude");
                }}
                placeholder="e.g. 27.7172"
                keyboardType="decimal-pad"
                error={fieldErrors.latitude}
              />
            </View>
            <View className="flex-1">
              <Field
                label="Longitude *"
                value={longitude}
                onChangeText={(v) => {
                  setLongitude(v);
                  if (v.trim()) clearFieldError("longitude");
                }}
                placeholder="e.g. 85.3240"
                keyboardType="decimal-pad"
                error={fieldErrors.longitude}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-2xl py-4 items-center shadow-lg mt-2 ${
              loading ? "bg-red-400" : "bg-red-600"
            }`}
            activeOpacity={0.85}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fff" size="small" />
                <Text className="ml-2 text-base font-bold text-white">
                  Creating...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-bold tracking-wide text-white">
                🩸 Create Donor Profile
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
