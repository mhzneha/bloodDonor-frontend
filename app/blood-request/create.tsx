import CustomHeader from "@/components/CustomHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  useColorScheme,
  View,
} from "react-native";
// import { MapPressEvent } from "react-native-maps";

let MapView: any;
let Marker: any;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

// Types
interface BloodRequestPayload {
  blood_group: string;
  contact_number: string;
  hospital_name: string;
  latitude: string;
  longitude: string;
  patient_name: string;
  units_required: number;
  urgency: "normal" | "urgent" | "critical";
  user_id: number;
}

interface StoredUser {
  id: number;
  email: string;
  name: string;
  phone_number: string;
  is_admin: boolean;
}
// Constants
const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const URGENCY_LEVELS: Array<{
  value: "normal" | "urgent" | "critical";
  label: string;
  color: string;
}> = [
  { value: "normal", label: "Normal", color: "#16a34a" },
  { value: "urgent", label: "Urgent", color: "#d97706" },
  { value: "critical", label: "Critical", color: "#dc2626" },
];

// Sub-components──
const SectionLabel = ({ text }: { text: string }) => (
  <Text className="mt-5 mb-2 text-sm font-extrabold tracking-widest text-gray-900 uppercase dark:text-gray-200">
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
    <Text className="mb-1 text-sm font-medium text-black-200">{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#6b7280"
      keyboardType={keyboardType}
      maxLength={maxLength}
      className={`px-4 py-3 text-base !text-black-200  border rounded-xl ${
        error ? "border-red-500" : "border-gray-700"
      }`}
    />
    {error ? <Text className="mt-1 text-xs text-red-400">{error}</Text> : null}
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

// Main Screen
export default function CreateBloodRequest() {
  const router = useRouter();

  const [patientName, setPatientName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [unitsRequired, setUnitsRequired] = useState("1");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "critical">(
    "normal",
  );
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState({
    latitude: 27.7172,
    longitude: 85.324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Field-level errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const setFieldError = (field: string, msg: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: msg }));

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // Validate & collect all errors
  const validateAll = (): boolean => {
    const errors: Record<string, string> = {};

    if (!patientName.trim()) errors.patientName = "Patient name is required.";

    if (!contactNumber.trim()) {
      errors.contactNumber = "Contact number is required.";
    } else if (!/^[0-9]{7,15}$/.test(contactNumber.trim())) {
      errors.contactNumber = "Enter a valid phone number (7–15 digits).";
    }

    if (!hospitalName.trim())
      errors.hospitalName = "Hospital name is required.";

    if (!bloodGroup) errors.bloodGroup = "Please select a blood group.";

    const units = parseInt(unitsRequired, 10);
    if (!unitsRequired.trim() || isNaN(units) || units < 1)
      errors.unitsRequired = "Enter at least 1 unit.";

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

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setRegion({
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      setSelectedLocation(coords);

      // auto fill latitude longitude
      setLatitude(coords.latitude.toString());
      setLongitude(coords.longitude.toString());
    })();
  }, []);

  const handleMapPress = (event: any) => {
    const coords = event.nativeEvent.coordinate;

    setSelectedLocation(coords);

    setLatitude(coords.latitude.toString());
    setLongitude(coords.longitude.toString());

    clearFieldError("latitude");
    clearFieldError("longitude");
  };

  // Submit
  const handleSubmit = async () => {
    if (!validateAll()) return; // show inline errors, stop here

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");
      // console.log("TOKEN:", token);

      if (!token) {
        Alert.alert("Error", "Please login again");
        return;
      }

      const payload = {
        blood_request: {
          patient_name: patientName.trim(),
          contact_number: contactNumber.trim(),
          hospital_name: hospitalName.trim(),
          blood_group: bloodGroup,
          units_required: Number(unitsRequired),
          urgency,
          latitude,
          longitude,
        },
      };

      // console.log("SENDING:", payload);

      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      // console.log("SUCCESS RESPONSE:", response.data);

      // Reset form
      setPatientName("");
      setContactNumber("");
      setHospitalName("");
      setBloodGroup("");
      setUnitsRequired("1");
      setUrgency("normal");
      setLatitude("");
      setLongitude("");
      setFieldErrors({});

      // router.replace("/(tabs)/blood-request");
      router.back();

      setTimeout(() => {
        Alert.alert("Success", "Blood request created successfully!");
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
  const colorScheme = useColorScheme();

  // Render
  return (
    <KeyboardAvoidingView
      className="flex-1 "
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CustomHeader title="Add Blood Request" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-6 py-8 shadow-lg bg-primary-100 rounded-b-3xl ">
          <View className="flex-row items-center gap-3">
            {/* <View className="items-center justify-center w-10 h-10 rounded-full bg-white/20">
              <Text className="text-lg font-bold text-white">🩸</Text>
            </View> */}
            {/* <View>
              <Text className="text-2xl font-bold tracking-tight text-white">
                New Blood Request
              </Text>
            </View> */}
          </View>
          <Text className="mt-3 text-sm leading-relaxed text-white/60">
            Fill in the details below. Donors in your area will be notified
            immediately.
          </Text>
        </View>

        {/* Form */}
        <View className="px-5 pt-2">
          <SectionLabel text="Patient Info" />
          <Field
            label="Patient Name *"
            value={patientName}
            onChangeText={(v) => {
              setPatientName(v);
              if (v.trim()) clearFieldError("patientName");
            }}
            placeholder="e.g. Ram Shrestha"
            error={fieldErrors.patientName}
          />
          <Field
            label="Contact Number *"
            value={contactNumber}
            onChangeText={(v) => {
              setContactNumber(v);
              if (v.trim()) clearFieldError("contactNumber");
            }}
            placeholder="e.g. 9812345678"
            keyboardType="phone-pad"
            maxLength={15}
            error={fieldErrors.contactNumber}
          />
          <Field
            label="Hospital Name *"
            value={hospitalName}
            onChangeText={(v) => {
              setHospitalName(v);
              if (v.trim()) clearFieldError("hospitalName");
            }}
            placeholder="e.g. Kist Medical College"
            error={fieldErrors.hospitalName}
          />

          <SectionLabel text="Blood Group" />
          <BloodGroupDropdown
            value={bloodGroup}
            onChange={(v) => {
              setBloodGroup(v);
              clearFieldError("bloodGroup");
            }}
            error={fieldErrors.bloodGroup}
          />

          <SectionLabel text="Requirement" />
          <Field
            label="Units Required *"
            value={unitsRequired}
            onChangeText={(v) => {
              setUnitsRequired(v);
              if (v.trim()) clearFieldError("unitsRequired");
            }}
            placeholder="e.g. 2"
            keyboardType="numeric"
            maxLength={3}
            error={fieldErrors.unitsRequired}
          />

          <Text className="mb-2 text-sm font-medium text-black-200">
            Urgency Level *
          </Text>
          <View className="flex-row gap-3 mb-3">
            {URGENCY_LEVELS.map((u) => (
              <TouchableOpacity
                key={u.value}
                onPress={() => setUrgency(u.value)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: urgency === u.value ? u.color : "#374151",
                  backgroundColor:
                    urgency === u.value ? u.color + "22" : "transparent",
                }}
              >
                <Text
                  style={{
                    color: urgency === u.value ? u.color : "#9ca3af",
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* <SectionLabel text="Location" />
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
          </View> */}

          <SectionLabel text="Location" />

          <Text className="mb-2 text-sm font-medium text-black-200">
            Tap on map to select location *
          </Text>

          {Platform.OS === "web" ? (
            <View className="items-center justify-center h-48 border border-gray-700 rounded-2xl">
              <Text className="text-gray-500">
                Map is only available on Android/iOS
              </Text>
            </View>
          ) : (
            <View className="overflow-hidden border border-gray-700 h-72 rounded-2xl">
              <MapView
                style={{ flex: 1 }}
                initialRegion={region}
                region={region}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton
              >
                {selectedLocation && (
                  <Marker
                    coordinate={selectedLocation}
                    title="Selected Location"
                  />
                )}
              </MapView>
            </View>
          )}

          <View className="p-4 mt-3 border border-gray-700 rounded-2xl bg-gray-800/30">
            <Text className="text-sm text-gray-300">
              Latitude:{" "}
              <Text className="font-bold text-white">
                {latitude || "Not selected"}
              </Text>
            </Text>

            <Text className="mt-2 text-sm text-gray-300">
              Longitude:{" "}
              <Text className="font-bold text-white">
                {longitude || "Not selected"}
              </Text>
            </Text>
          </View>

          {fieldErrors.latitude ? (
            <Text className="mt-1 text-xs text-red-400">
              {fieldErrors.latitude}
            </Text>
          ) : null}

          {fieldErrors.longitude ? (
            <Text className="mt-1 text-xs text-red-400">
              {fieldErrors.longitude}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-2xl py-4 items-center shadow-lg mt-2 ${
              loading ? "bg-red-400" : "bg-primary-100"
            }`}
            activeOpacity={0.85}
          >
            {loading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fff" size="small" />
                <Text className="ml-2 text-base font-bold text-white">
                  Submitting...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-bold tracking-wide text-white">
                Submit Blood Request
              </Text>
            )}
          </TouchableOpacity>

          <Text className="mt-4 text-xs text-center text-gray-600">
            Requests are visible to verified donors in your area.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
