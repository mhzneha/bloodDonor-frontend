import { FontAwesome6, Fontisto } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//  Types
interface DonorProfile {
  id: number;
  available: boolean | null;
  blood_group: string;
  created_at: string;
  last_donated_at: string | null;
  latitude: string | null;
  location: string | null;
  longitude: string | null;
  updated_at: string;
  user_id: number;
  verified: boolean | null;
  last_active_at: string | null;
}

//  Constants
const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/donor_profile";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

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

//  Sub-components
const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mt-5 mb-2 text-sm font-extrabold tracking-widest text-gray-900 uppercase dark:text-gray-400">
    {text}
  </Text>
);

//  Skeleton
const Skeleton = ({
  w,
  h,
  rounded = 8,
}: {
  w: number | string;
  h: number;
  rounded?: number;
}) => (
  <View
    style={{
      width: w as any,
      height: h,
      borderRadius: rounded,
      backgroundColor: "#e5e7eb",
    }}
  />
);

const FormSkeleton = () => (
  <View className="px-5 pt-4" style={{ gap: 16 }}>
    {[1, 2, 3].map((i) => (
      <View key={i} style={{ gap: 6 }}>
        <Skeleton w={100} h={12} rounded={4} />
        <Skeleton w="100%" h={48} rounded={12} />
      </View>
    ))}
    <View className="flex-row" style={{ gap: 12 }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton w={80} h={12} rounded={4} />
        <Skeleton w="100%" h={48} rounded={12} />
      </View>
      <View style={{ flex: 1, gap: 6 }}>
        <Skeleton w={80} h={12} rounded={4} />
        <Skeleton w="100%" h={48} rounded={12} />
      </View>
    </View>
    <Skeleton w="100%" h={56} rounded={16} />
  </View>
);

// Blood Group Dropdown
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
      <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
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
            value ? "text-gray-500 text-base" : "text-gray-400 text-base"
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
                  className={`text-base font-bold ${value === bg ? "text-red-400" : "text-white"}`}
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

//  Date Picker
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
  const [selMonth, setSelMonth] = useState(today.getMonth());
  const [selDay, setSelDay] = useState(today.getDate());

  // When value changes externally (prefill), sync internal state
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setSelYear(d.getFullYear());
      setSelMonth(d.getMonth());
      setSelDay(d.getDate());
    }
  }, [value]);

  const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
  const years = Array.from({ length: 10 }, (_, i) => today.getFullYear() - i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const confirm = () => {
    const mm = String(selMonth + 1).padStart(2, "0");
    const dd = String(selDay).padStart(2, "0");
    // onChange(`${selYear}-${mm}-${dd}`);
    onChange(new Date(selYear, selMonth, selDay).toISOString().split("T")[0]);
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
      <Text className="mb-1 text-sm font-medium text-gray-600 dark:text-gray-400">
        {label}
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
            displayValue ? "text-gray-500 text-base" : "text-gray-400 text-base"
          }
        >
          {displayValue || "Select date (optional)"}
        </Text>
        <FontAwesome6 name="calendar-days" size={15} color="#4b5563" />
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
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-800">
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text className="text-base text-gray-400">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-base font-bold text-white">
                Last Donated
              </Text>
              <TouchableOpacity onPress={confirm}>
                <Text className="text-base font-bold text-red-400">Done</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row px-4 py-2" style={{ height: 200 }}>
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

//  Main Screen
export default function UpdateDonorProfile() {
  const router = useRouter();

  // Form state
  const [bloodGroup, setBloodGroup] = useState("");
  const [available, setAvailable] = useState(true);
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [lastDonatedAt, setLastDonatedAt] = useState<string | null>(null);

  // UI state
  const [fetchLoading, setFetchLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Track what was originally loaded so we can show a "no changes" hint
  const [original, setOriginal] = useState<Partial<DonorProfile>>({});

  //  Fetch existing profile
  const loadProfile = useCallback(async () => {
    try {
      setFetchLoading(true);
      setFetchError(null);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      const { data } = await axios.get<DonorProfile>(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      // Pre-fill form with existing data
      setBloodGroup(data.blood_group ?? "");
      setAvailable(data.available ?? true);
      setLocation(data.location ?? "");
      setLatitude(data.latitude ?? "");
      setLongitude(data.longitude ?? "");
      // setLastDonatedAt(data.last_donated_at ?? null);
      setLastDonatedAt(
        data.last_donated_at ? data.last_donated_at.split("T")[0] : null,
      );
      setOriginal(data);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) {
        Alert.alert("Session expired", "Please login again.");
        router.replace("/login");
      } else if (status === 404) {
        // No profile yet — redirect to create
        Alert.alert(
          "No profile found",
          "You don't have a donor profile yet. Let's create one!",
          [
            {
              text: "OK",
              onPress: () => router.replace("/blood-donor/create"),
            },
          ],
        );
      } else {
        setFetchError(
          err?.response?.data?.message ||
            err?.message ||
            "Could not load profile.",
        );
      }
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  //  Detect location
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

  //  Validation
  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const n = { ...prev };
      delete n[field];
      return n;
    });

  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};
    if (!bloodGroup) errors.bloodGroup = "Please select your blood group.";
    // if (!location.trim()) errors.location = "Location name is required.";
    // if (!latitude.trim()) errors.latitude = "Latitude is required.";
    // else if (isNaN(Number(latitude)))
    //   errors.latitude = "Must be a valid number.";
    // if (!longitude.trim()) errors.longitude = "Longitude is required.";
    // else if (isNaN(Number(longitude)))
    //   errors.longitude = "Must be a valid number.";
    // setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  //  Detect changed fields
  const hasChanges = (): boolean => {
    return (
      bloodGroup !== (original.blood_group ?? "") ||
      available !== (original.available ?? true) ||
      location !== (original.location ?? "") ||
      latitude !== (original.latitude ?? "") ||
      longitude !== (original.longitude ?? "") ||
      lastDonatedAt !== (original.last_donated_at ?? null)
    );
  };

  //  Submit (PATCH)
  const handleSubmit = async () => {
    if (!validateAll()) return;

    if (!hasChanges()) {
      Alert.alert("No changes", "You haven't changed anything yet.");
      return;
    }

    try {
      setSubmitLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      if (!token) {
        Alert.alert("Error", "Please login again.");
        return;
      }

      const payload = {
        donor_profile: {
          blood_group: bloodGroup,
          available,
          location: location.trim(),
          latitude,
          longitude,
          // last_donated_at: lastDonatedAt ? lastDonatedAt : null,
          last_donated_at: lastDonatedAt ? lastDonatedAt + "T00:00:00Z" : null,
        },
      };

      // console.log("PATCHING:", payload);
      console.log("LAST DONATED RAW:", lastDonatedAt);

      const res = await axios.put(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const updated = res.data.donor_profile;

      console.log("UPDATED:", updated);

      // Navigate back to profile show page so changes are visible
      router.replace({
        pathname: "/blood-donor/detail",
        params: { refresh: Date.now().toString() },
      });

      setTimeout(() => {
        Alert.alert(
          "Updated!",
          "Your donor profile has been updated successfully.",
        );
      }, 300);
    } catch (err: any) {
      console.log("ERROR:", err?.response?.data);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Could not update profile.";
      if (err?.response?.status === 401) {
        Alert.alert("Session expired", "Please login again.");
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  //  Fetch error state
  if (fetchError) {
    return (
      <View
        className="items-center justify-center flex-1 px-8 bg-gray-950"
        style={{ gap: 16 }}
      >
        <Text style={{ fontSize: 48 }}>⚠️</Text>
        <Text className="text-base font-semibold text-center text-white">
          {fetchError}
        </Text>
        <TouchableOpacity
          onPress={loadProfile}
          className="px-6 py-3 bg-gray-800 border border-gray-700 rounded-xl"
        >
          <Text className="text-sm font-bold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  //  Render
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
        {/*  Header */}
        <View
          className="px-6 py-8 shadow-lg rounded-b-3xl bg-primary-200/70"
          // style={{ backgroundColor: "#4c0519" }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
                <Fontisto name="blood-drop" size={22} color="#ED3632" />
              </View>
              <View>
                <Text className="text-sm font-medium text-white/70">
                  Blood Donor Finder
                </Text>
                <Text className="text-2xl font-bold tracking-tight text-white">
                  Update Profile
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="px-3 py-2 border rounded-xl border-white/20"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <Text className="text-sm font-semibold text-white">✕</Text>
            </TouchableOpacity>
          </View>

          <Text className="mt-3 text-sm leading-relaxed text-white/60">
            Your current details are pre-filled. Update what you need and save.
          </Text>

          {/* Change indicator */}
          {!fetchLoading && (
            <View
              className="flex-row items-center mt-4 px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: hasChanges() ? "#7f1d1d" : "#1c1917",
                borderWidth: 1,
                borderColor: hasChanges() ? "#dc2626" : "#292524",
                gap: 8,
              }}
            >
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: hasChanges() ? "#f87171" : "#57534e",
                }}
              />
              <Text
                className="text-xs font-semibold"
                style={{ color: hasChanges() ? "#fca5a5" : "#78716c" }}
              >
                {hasChanges() ? "Unsaved changes" : "No changes yet"}
              </Text>
            </View>
          )}
        </View>

        {/*  Form / Skeleton  */}
        {fetchLoading ? (
          <FormSkeleton />
        ) : (
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

            {/* Availability */}
            <SectionLabel text="Availability" />
            <View className="flex-row items-center justify-between px-4 py-4 mb-3 border border-gray-700 rounded-xl">
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text className="text-base font-semibold text-gray-500">
                  Available to donate
                </Text>
                <Text className="mt-0.5 text-xs text-gray-500">
                  {available
                    ? "You'll appear in donor searches"
                    : "You won't receive donation requests"}
                </Text>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: "#374151", true: "#9ca3af" }}
                thumbColor={available ? "#EF5350" : "#9ca3af"}
              />
            </View>

            {/* Last Donation */}
            <SectionLabel text="Donation History" />
            <DatePickerField
              label="Last Donated At"
              value={lastDonatedAt}
              onChange={setLastDonatedAt}
            />
            <Text className="mb-3 -mt-1 text-xs text-gray-600">
              Helps us check eligibility (donors wait 3 months between
              donations).
            </Text>

            {/* Location */}
            {/* <SectionLabel text="Location" />
            <TouchableOpacity
              onPress={detectLocation}
              disabled={locLoading}
              className="flex-row items-center justify-center gap-2 py-3 mb-3 bg-gray-800 border border-gray-700 rounded-xl"
              activeOpacity={0.8}
            >
              {locLoading ? (
                <>
                  <ActivityIndicator color="#ef4444" size="small" />
                  <Text className="text-sm font-semibold text-gray-300">
                    Detecting location...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 15 }}>📍</Text>
                  <Text className="text-sm font-semibold text-gray-300">
                    Re-detect my location
                  </Text>
                </>
              )}
            </TouchableOpacity> */}

            {/* Location name */}
            {/* <View className="mb-3">
              <Text className="mb-1 text-sm font-medium text-gray-300">
                Location Name *
              </Text>
              <View
                className={`flex-row items-center px-4 py-3 bg-gray-800 border rounded-xl ${
                  fieldErrors.location ? "border-red-500" : "border-gray-700"
                }`}
              >
                <Text className="mr-2" style={{ fontSize: 15 }}>
                  🏙️
                </Text>
                <TextInput
                  value={location}
                  onChangeText={(v) => {
                    setLocation(v);
                    if (v.trim()) clearFieldError("location");
                  }}
                  placeholder="e.g. Kathmandu, Nepal"
                  placeholderTextColor="#6b7280"
                  className="flex-1 text-base text-white"
                />
              </View>
              {fieldErrors.location ? (
                <Text className="mt-1 text-xs text-red-400">
                  {fieldErrors.location}
                </Text>
              ) : null}
            </View> */}

            {/* Lat / Lng */}
            {/* <View className="flex-row" style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text className="mb-1 text-sm font-medium text-gray-300">
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
                  className={`px-4 py-3 text-base text-white bg-gray-800 border rounded-xl ${
                    fieldErrors.latitude ? "border-red-500" : "border-gray-700"
                  }`}
                />
                {fieldErrors.latitude ? (
                  <Text className="mt-1 text-xs text-red-400">
                    {fieldErrors.latitude}
                  </Text>
                ) : null}
              </View>
              <View style={{ flex: 1 }}>
                <Text className="mb-1 text-sm font-medium text-gray-300">
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
                  className={`px-4 py-3 text-base text-white bg-gray-800 border rounded-xl ${
                    fieldErrors.longitude ? "border-red-500" : "border-gray-700"
                  }`}
                />
                {fieldErrors.longitude ? (
                  <Text className="mt-1 text-xs text-red-400">
                    {fieldErrors.longitude}
                  </Text>
                ) : null}
              </View>
            </View> */}

            {/* GPS confirmed */}
            {/* {latitude && longitude ? (
              <View
                className="flex-row items-center px-3 py-2 mt-2 mb-1 rounded-lg"
                style={{ backgroundColor: "rgba(20,83,45,0.4)", gap: 6 }}
              >
                <Text className="text-xs text-green-400">✓</Text>
                <Text className="text-xs font-medium text-green-400">
                  GPS set — {latitude}, {longitude}
                </Text>
              </View>
            ) : null} */}

            {/*  Action buttons  */}
            <View style={{ marginTop: 28, gap: 12 }}>
              {/* Save */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitLoading}
                className={`rounded-2xl py-4 items-center shadow-lg ${
                  submitLoading ? "bg-rose-400" : "bg-primary-100"
                }`}
                activeOpacity={0.85}
              >
                {submitLoading ? (
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text className="text-base font-bold text-white">
                      Saving changes...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-base font-bold tracking-wide text-white">
                    Save Changes
                  </Text>
                )}
              </TouchableOpacity>

              {/* Discard */}
              <TouchableOpacity
                onPress={() => {
                  if (hasChanges()) {
                    Alert.alert(
                      "Discard changes?",
                      "Your unsaved changes will be lost.",
                      [
                        { text: "Keep editing", style: "cancel" },
                        {
                          text: "Discard",
                          style: "destructive",
                          onPress: () => router.back(),
                        },
                      ],
                    );
                  } else {
                    router.back();
                  }
                }}
                className="items-center py-4 border border-gray-700 rounded-2xl"
                activeOpacity={0.85}
              >
                <Text className="text-base font-bold text-gray-700 dark:text-gray-300">
                  Discard & Go Back
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="mt-4 text-xs text-center text-gray-600">
              Only fields you change will be updated.
            </Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
