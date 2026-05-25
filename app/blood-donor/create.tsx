import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DonorProfilePayload {
  blood_group: string;
  available: boolean;
  location: string;
  latitude: string;
  longitude: string;
  last_donated_at: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/donor_profile";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mt-5 mb-2 text-xs font-semibold tracking-widest text-gray-900 uppercase">
    {text}
  </Text>
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
      <Text className="mb-1 text-sm font-medium text-black-200">
        Blood Group *
      </Text>

      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between px-4 py-3  border rounded-xl ${
          error ? "border-red-500" : "border-gray-700"
        }`}
        activeOpacity={0.8}
      >
        <Text
          className={
            value ? "text-black-200 text-base" : "text-gray-500 text-base"
          }
        >
          {value || "Select your blood group"}
        </Text>
        <Text className="text-sm text-gray-400">▼</Text>
      </TouchableOpacity>

      {error ? (
        <Text className="mt-1 text-xs text-red-400">{error}</Text>
      ) : null}

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

// ── Date Picker (simple manual input via modal) ───────────────────────────────
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DatePickerField = ({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  error?: string;
}) => {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [selYear, setSelYear] = useState(today.getFullYear());
  const [selMonth, setSelMonth] = useState(today.getMonth()); // 0-indexed
  const [selDay, setSelDay] = useState(today.getDate());

  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const confirm = () => {
    const mm = String(selMonth + 1).padStart(2, "0");
    const dd = String(selDay).padStart(2, "0");
    onChange(`${selYear}-${mm}-${dd}`);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <View className="mb-3">
      <Text className="mb-1 text-sm font-medium text-black-200">{label}</Text>

      <TouchableOpacity
        onPress={() => setOpen(true)}
        className={`flex-row items-center justify-between px-4 py-3 !text-black-200  border rounded-xl ${
          error ? "border-red-500" : "border-gray-700"
        }`}
        activeOpacity={0.8}
      >
        <Text
          className={
            displayValue
              ? "!text-black-200 text-base"
              : "text-gray-500 text-base"
          }
        >
          {displayValue || "Select date (optional)"}
        </Text>
        <FontAwesome6 name="calendar-days" size={24} color="#666876" solid />
      </TouchableOpacity>

      {value && (
        <TouchableOpacity
          onPress={() => onChange(null)}
          className="self-start mt-1"
        >
          <Text className="text-xs text-gray-500">✕ Clear date</Text>
        </TouchableOpacity>
      )}

      {error ? (
        <Text className="mt-1 text-xs text-red-400">{error}</Text>
      ) : null}

      <Modal visible={open} transparent animationType="slide">
        <View className="justify-end flex-1 bg-black/60">
          <View className="bg-gray-900 border-t border-gray-700 rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-800">
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text className="text-base text-gray-400">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-base font-bold text-black-200">
                Last Donated
              </Text>
              <TouchableOpacity onPress={confirm}>
                <Text className="text-base font-bold text-red-400">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Scroll pickers */}
            <View className="flex-row px-4 py-2" style={{ height: 200 }}>
              {/* Month */}
              <ScrollView
                style={{ flex: 3 }}
                showsVerticalScrollIndicator={false}
              >
                {MONTHS.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setSelMonth(i)}
                    className={`py-3 px-3 rounded-xl mb-1 ${selMonth === i ? "bg-red-600/30" : ""}`}
                  >
                    <Text
                      className={`text-center text-base ${selMonth === i ? "text-red-400 font-bold" : "text-gray-300"}`}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Day */}
              <ScrollView
                style={{ flex: 2 }}
                showsVerticalScrollIndicator={false}
              >
                {days.map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setSelDay(d)}
                    className={`py-3 rounded-xl mb-1 ${selDay === d ? "bg-red-600/30" : ""}`}
                  >
                    <Text
                      className={`text-center text-base ${selDay === d ? "text-red-400 font-bold" : "text-gray-300"}`}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Year */}
              <ScrollView
                style={{ flex: 2 }}
                showsVerticalScrollIndicator={false}
              >
                {years.map((y) => (
                  <TouchableOpacity
                    key={y}
                    onPress={() => setSelYear(y)}
                    className={`py-3 rounded-xl mb-1 ${selYear === y ? "bg-red-600/30" : ""}`}
                  >
                    <Text
                      className={`text-center text-base ${selYear === y ? "text-red-400 font-bold" : "text-gray-300"}`}
                    >
                      {y}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ height: Platform.OS === "ios" ? 28 : 16 }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function BecomeDonor() {
  const router = useRouter();

  const [bloodGroup, setBloodGroup] = useState("");
  const [available, setAvailable] = useState(true);
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [lastDonatedAt, setLastDonatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // ── Auto-detect location ──────────────────────────────────────────────────
  const detectLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      setLatitude(lat);
      setLongitude(lng);
      clearFieldError("latitude");
      clearFieldError("longitude");

      // Reverse geocode for human-readable location
      const geo = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (geo.length > 0) {
        const g = geo[0];
        const parts = [g.district || g.subregion, g.city, g.country].filter(
          Boolean,
        );
        setLocation(parts.join(", "));
        clearFieldError("location");
      }
    } catch {
      Alert.alert("Error", "Could not get your location.");
    } finally {
      setLocLoading(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};

    if (!bloodGroup) errors.bloodGroup = "Please select your blood group.";

    if (!location.trim()) errors.location = "Location name is required.";

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
    if (!validateAll()) return;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const payload = {
        donor_profile: {
          blood_group: bloodGroup,
          available,
          location: location.trim(),
          latitude,
          longitude,
          last_donated_at: lastDonatedAt,
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

      console.log("SUCCESS:", response.data);

      router.replace("/(tabs)");

      setTimeout(() => {
        Alert.alert(
          "Welcome, Donor! 🩸",
          "Your donor profile has been created. You may now receive donation requests.",
        );
      }, 300);
    } catch (err: any) {
      console.log("ERROR:", err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Could not create donor profile.";

      if (err?.response?.status === 401) {
        Alert.alert("Session expired", "Please login again.");
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
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 py-8 shadow-lg bg-primary-100 rounded-b-3xl">
          <View className="flex-row items-center gap-3">
            {/* <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <Text className="text-lg">❤️</Text>
            </View> */}
            <View>
              {/* <Text className="text-sm font-medium text-white/70">
                Blood Donor Finder
              </Text> */}
              <Text className="text-2xl font-bold tracking-tight text-white">
                Become a Donor
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-sm leading-relaxed text-white/60">
            Register as a donor and help save lives. You'll be notified when
            someone nearby needs your blood group.
          </Text>
        </View>

        {/* Form */}
        <View className="px-5 pt-2">
          {/* Blood Group */}
          <SectionLabel text="Blood Group" />
          <BloodGroupDropdown
            value={bloodGroup}
            onChange={(v) => {
              setBloodGroup(v);
              clearFieldError("bloodGroup");
            }}
            error={fieldErrors.bloodGroup}
          />

          {/* Availability toggle */}
          <SectionLabel text="Availability" />
          <View className="flex-row items-center justify-between px-4 py-4 mb-3 border border-gray-700 rounded-xl">
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text className="text-base font-semibold text-black-200">
                Available to donate
              </Text>
              <Text className="mt-0.5 text-xs text-gray-400">
                {available
                  ? "You'll appear in donor searches"
                  : "You won't receive donation requests"}
              </Text>
            </View>
            <Switch
              value={available}
              onValueChange={setAvailable}
              trackColor={{ false: "#EF5350", true: "#EF5350" }}
              thumbColor={available ? "#fff" : "#EF5350"}
            />
          </View>

          {/* Last donation */}
          <SectionLabel text="Donation History" />
          <DatePickerField
            label="Last Donated At"
            value={lastDonatedAt}
            onChange={setLastDonatedAt}
          />
          <Text className="mb-3 -mt-1 text-xs text-gray-600">
            Helps us check eligibility (donors should wait 3 months between
            donations).
          </Text>

          {/* Location */}
          <SectionLabel text="Location" />

          {/* Detect button */}
          <TouchableOpacity
            onPress={detectLocation}
            disabled={locLoading}
            className="flex-row items-center justify-center gap-2 py-3 mb-3 border border-gray-700 rounded-xl"
            activeOpacity={0.8}
          >
            {locLoading ? (
              <>
                <ActivityIndicator color="#ef4444" size="small" />
                <Text className="text-sm font-semibold text-black-200">
                  Detecting location...
                </Text>
              </>
            ) : (
              <>
                <FontAwesome6
                  name="location-dot"
                  size={22}
                  color="#EF5350"
                  solid
                />
                <Text className="text-sm font-semibold text-black-200">
                  Auto-detect my location
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Location name */}
          <View className="mb-3">
            <Text className="mb-1 text-sm font-medium text-black-200">
              Location Name *
            </Text>
            <View
              className={`flex-row items-center px-4 py-3  border rounded-xl ${
                fieldErrors.location ? "border-red-500" : "border-gray-700"
              }`}
            >
              <TextInput
                value={location}
                onChangeText={(v) => {
                  setLocation(v);
                  if (v.trim()) clearFieldError("location");
                }}
                placeholder="e.g. Kathmandu, Nepal"
                placeholderTextColor="#6b7280"
                className="flex-1 text-base text-black-200"
              />
            </View>
            {fieldErrors.location ? (
              <Text className="mt-1 text-xs text-red-400">
                {fieldErrors.location}
              </Text>
            ) : null}
          </View>

          {/* Lat / Lng */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1 text-sm font-medium text-black-200">
                Latitude *
              </Text>
              <TextInput
                value={latitude}
                onChangeText={(v) => {
                  setLatitude(v);
                  if (v.trim()) clearFieldError("latitude");
                }}
                placeholder="27.7172"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className={`px-4 py-3 text-base text-black-200 border rounded-xl ${
                  fieldErrors.latitude ? "border-red-500" : "border-gray-700"
                }`}
              />
              {fieldErrors.latitude ? (
                <Text className="mt-1 text-xs text-red-400">
                  {fieldErrors.latitude}
                </Text>
              ) : null}
            </View>
            <View className="flex-1">
              <Text className="mb-1 text-sm font-medium text-black-200">
                Longitude *
              </Text>
              <TextInput
                value={longitude}
                onChangeText={(v) => {
                  setLongitude(v);
                  if (v.trim()) clearFieldError("longitude");
                }}
                placeholder="85.3240"
                placeholderTextColor="#6b7280"
                keyboardType="decimal-pad"
                className={`px-4 py-3 text-base text-black-200 border rounded-xl ${
                  fieldErrors.longitude ? "border-red-500" : "border-gray-700"
                }`}
              />
              {fieldErrors.longitude ? (
                <Text className="mt-1 text-xs text-red-400">
                  {fieldErrors.longitude}
                </Text>
              ) : null}
            </View>
          </View>

          {/* GPS filled indicator */}
          {latitude && longitude ? (
            <View className="flex-row items-center gap-2 px-3 py-2 mt-2 mb-1 rounded-lg bg-green-900/30">
              <Text className="text-xs text-green-400">✓</Text>
              <Text className="text-xs font-medium text-green-400">
                GPS coordinates set — {latitude}, {longitude}
              </Text>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-2xl py-4 items-center shadow-lg mt-6 ${
              loading ? "bg-primary-100" : "bg-primary-200"
            }`}
            activeOpacity={0.85}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fff" size="small" />
                <Text className="ml-2 text-base font-bold text-white">
                  Creating Profile...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-bold tracking-wide text-white">
                Register as Donor
              </Text>
            )}
          </TouchableOpacity>

          <Text className="mt-4 text-xs text-center text-gray-600">
            Your profile can be updated at any time from settings.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
