import {
  fetchMyBloodRequests,
  MyBloodRequest,
  searchDonors,
  sendDonationRequestToDonor,
  DonorSearchParams,
} from "@/lib/api/donor-api";
import { Donor } from "@/types/donor";
import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const DEBOUNCE_MS = 400;
const DROPDOWN_MAX_HEIGHT = 420;

const URGENCY_COLORS: Record<string, string> = {
  normal: "#22c55e",
  urgent: "#f97316",
  critical: "#ef4444",
};

const BloodGroupBadge = ({ group }: { group: string }) => (
  <View className="items-center justify-center w-9 h-9 rounded-full bg-primary-200">
    <Text className="text-[10px] font-bold text-white">{group}</Text>
  </View>
);

// ── Donor detail modal (uses data already in hand — no detail API exists) ──
const DonorDetailModal = ({
  donor,
  visible,
  onClose,
}: {
  donor: Donor | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!donor) return null;

  const rows = [
    { label: "Phone", value: donor.user.phone_number },
    { label: "Email", value: donor.user.email },
    { label: "Location", value: donor.location ?? "Not provided" },
    {
      label: "Last Donated",
      value: donor.last_donated_at
        ? new Date(donor.last_donated_at).toLocaleDateString()
        : "N/A",
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="justify-end flex-1 bg-black/60">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="items-center px-6 py-5 border-b border-gray-100">
              <BloodGroupBadge group={donor.blood_group} />
              <Text className="mt-3 text-xl font-bold text-gray-900">
                {donor.user.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <View
                  className={`w-2 h-2 rounded-full ${donor.available ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <Text
                  className={`text-sm font-semibold ${donor.available ? "text-emerald-600" : "text-red-500"}`}
                >
                  {donor.available ? "Available" : "Unavailable"}
                </Text>
                {donor.verified && (
                  <FontAwesome6 name="circle-check" size={14} color="#16a34a" solid />
                )}
              </View>
            </View>

            <View className="px-6">
              {rows.map((row) => (
                <View
                  key={row.label}
                  className="py-3 border-b border-gray-100"
                >
                  <Text className="text-xs font-semibold text-gray-400">
                    {row.label.toUpperCase()}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-800">
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row gap-3 px-6 mt-5">
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(`tel:${donor.user.phone_number}`).catch(() =>
                    Alert.alert("Error", "Cannot place call."),
                  )
                }
                className="flex-1 flex-row items-center justify-center gap-2 py-3 bg-primary-200 rounded-2xl"
              >
                <FontAwesome6 name="phone-volume" size={16} color="#ffffff" />
                <Text className="text-sm font-bold text-white">Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                className="items-center flex-1 py-3 bg-gray-100 rounded-2xl"
              >
                <Text className="text-sm font-bold text-gray-600">Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ── Pick one of the user's active blood requests, then send to donor ──
const SendRequestModal = ({
  donor,
  visible,
  onClose,
}: {
  donor: Donor | null;
  visible: boolean;
  onClose: () => void;
}) => {
  const [requests, setRequests] = useState<MyBloodRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) return;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchMyBloodRequests();
        setRequests(data);
      } catch (e) {
        console.log("My blood requests error:", e);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  const handleSend = async (requestId: number) => {
    if (!donor) return;
    try {
      setSendingId(requestId);
      await sendDonationRequestToDonor(requestId, donor.id);
      Toast.show({
        type: "success",
        text1: "Request Sent",
        text2: `${donor.user.name} has been notified.`,
        position: "bottom",
      });
      onClose();
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to Send",
        text2: err?.response?.data?.message || "Please try again.",
        position: "bottom",
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="justify-end flex-1 bg-black/60">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          <View className="px-6 pt-3 pb-2">
            <Text className="text-lg font-bold text-gray-900">
              Send request to {donor?.user.name}
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Choose which of your blood requests this donor should be notified about.
            </Text>
          </View>

          {loading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color="red" />
            </View>
          ) : requests.length === 0 ? (
            <View className="items-center px-6 py-8">
              <Text className="text-sm text-center text-gray-500">
                You don't have any active blood requests yet.
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {requests.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  disabled={sendingId !== null}
                  onPress={() => handleSend(r.id)}
                  className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100"
                >
                  <View className="flex-row items-center flex-1 gap-3">
                    <BloodGroupBadge group={r.blood_group} />
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900">
                        {r.patient_name}
                      </Text>
                      <Text
                        className="text-xs font-semibold mt-0.5"
                        style={{ color: URGENCY_COLORS[r.urgency] ?? "#6b7280" }}
                      >
                        {r.urgency}
                      </Text>
                    </View>
                  </View>
                  {sendingId === r.id ? (
                    <ActivityIndicator size="small" color="red" />
                  ) : (
                    <FontAwesome6 name="chevron-right" size={14} color="#9CA3AF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            onPress={onClose}
            className="items-center py-3 mx-6 mt-1 mb-4 bg-gray-100 rounded-2xl"
          >
            <Text className="text-sm font-bold text-gray-600">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function DonorSearchFilter({
  onDropdownVisibilityChange,
}: {
  onDropdownVisibilityChange?: (visible: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [activeGroups, setActiveGroups] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [detailDonor, setDetailDonor] = useState<Donor | null>(null);
  const [sendRequestDonor, setSendRequestDonor] = useState<Donor | null>(null);

  const [dismissed, setDismissed] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActiveFilters =
    search.length > 0 ||
    activeGroups.length > 0 ||
    availableOnly ||
    verifiedOnly;

  useEffect(() => {
    setDismissed(false);
  }, [search, activeGroups, availableOnly, verifiedOnly]);

  const closeDropdown = () => {
    Keyboard.dismiss();
    setShowFilters(false);
    setDismissed(true);
  };

  const runSearch = async () => {
    try {
      setLoading(true);
      setHasSearched(true);

      const params: DonorSearchParams = { query: search };
      if (activeGroups.length > 0) params.blood_group = activeGroups;
      if (availableOnly) params.available = true;
      if (verifiedOnly) params.verified = true;

      const data = await searchDonors(params);
      setResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Donor search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search on any filter change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!hasActiveFilters) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(runSearch, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, activeGroups, availableOnly, verifiedOnly]);

  const toggleGroup = (group: string) => {
    setActiveGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
    );
  };

  const showResultsSection = hasSearched || loading;
  // Filters and/or results are visible together in one merged dropdown so
  // they never overlap each other.
  const dropdownVisible = !dismissed && (showFilters || showResultsSection);

  useEffect(() => {
    onDropdownVisibilityChange?.(dropdownVisible);
  }, [dropdownVisible]);

  const FiltersSection = (
    <View
      className={`gap-3 px-4 pt-4 pb-3 ${
        showResultsSection ? "border-b border-gray-100" : ""
      }`}
    >
      {/* Blood group multi-select */}
      <View className="flex-row flex-wrap gap-2">
        {BLOOD_GROUPS.map((group) => {
          const active = activeGroups.includes(group);
          return (
            <Pressable
              key={group}
              onPress={() => toggleGroup(group)}
              className={`px-3 py-1 rounded-xl border ${
                active
                  ? "bg-primary-200 border-primary-200"
                  : "bg-white border-gray-300"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  active ? "text-white" : "text-gray-700"
                }`}
              >
                {group}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Available / Verified toggles */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => setAvailableOnly((prev) => !prev)}
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            availableOnly
              ? "bg-emerald-500 border-emerald-500"
              : "bg-white border-gray-300"
          }`}
        >
          <View
            className={`w-1.5 h-1.5 rounded-full ${
              availableOnly ? "bg-white" : "bg-emerald-500"
            }`}
          />
          <Text
            className={`text-xs font-semibold ${
              availableOnly ? "text-white" : "text-gray-700"
            }`}
          >
            Available
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setVerifiedOnly((prev) => !prev)}
          className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
            verifiedOnly
              ? "bg-primary-200 border-primary-200"
              : "bg-white border-gray-300"
          }`}
        >
          <FontAwesome6
            name="check"
            size={10}
            color={verifiedOnly ? "#ffffff" : "#374151"}
          />
          <Text
            className={`text-xs font-semibold ${
              verifiedOnly ? "text-white" : "text-gray-700"
            }`}
          >
            Verified
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View className="relative z-10">
      <View className="flex-row items-center gap-3 my-2">
        <View className="flex-row items-center flex-1 px-3 py-2 bg-white shadow rounded-2xl shadow-black/10 elevation-3">
          <FontAwesome6 name="magnifying-glass" size={20} />
          <TextInput
            placeholder="Search Donors"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onFocus={() => setDismissed(false)}
            className="flex-1 ml-2 text-sm text-gray-900"
          />
        </View>
        <TouchableOpacity
          onPress={() => {
            setDismissed(false);
            setShowFilters((prev) => !prev);
          }}
        >
          <Image
            source={require("../assets/icons/filter.png")}
            className="w-7 h-7"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Backdrop: sits below the search row (top-14) so it never blocks
          taps on the search bar or filter icon, but catches any tap
          elsewhere on screen to close the dropdown. */}
      {dropdownVisible && (
        <Pressable
          onPress={closeDropdown}
          style={{
            position: "absolute",
            top: 56,
            left: -1000,
            right: -1000,
            height: 2000,
            zIndex: 30,
          }}
        />
      )}

      {dropdownVisible && (
        <View
          collapsable={false}
          className="absolute left-0 right-0 bg-white shadow-lg top-[58px] rounded-2xl shadow-black/20 elevation-5"
          style={{ zIndex: 50, maxHeight: DROPDOWN_MAX_HEIGHT, overflow: "hidden" }}
        >
          <FlatList
            data={showResultsSection ? results : []}
            keyExtractor={(donor) => String(donor.id)}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
            style={{ maxHeight: DROPDOWN_MAX_HEIGHT }}
            contentContainerStyle={{ paddingBottom: 8 }}
            ListHeaderComponent={showFilters ? FiltersSection : null}
            ListEmptyComponent={
              showResultsSection ? (
                loading ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" color="red" />
                  </View>
                ) : (
                  <View className="items-center py-4">
                    <Text className="text-sm text-gray-500">No donors found</Text>
                  </View>
                )
              ) : null
            }
            renderItem={({ item: donor }) => (
              <View className="px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center gap-3">
                  <BloodGroupBadge group={donor.blood_group} />
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900">
                      {donor.user.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {donor.available ? "Available" : "Unavailable"}
                      {donor.location ? ` · ${donor.location}` : ""}
                    </Text>
                  </View>
                  {donor.verified && (
                    <FontAwesome6 name="circle-check" size={16} color="#16a34a" solid />
                  )}
                </View>

                <View className="flex-row gap-2 mt-2.5">
                  <TouchableOpacity
                    onPress={() => {
                      setDetailDonor(donor);
                      closeDropdown();
                    }}
                    className="flex-1 items-center py-2 rounded-xl border border-primary-200"
                  >
                    <Text className="text-xs font-bold text-primary-100">
                      View Details
                    </Text>
                  </TouchableOpacity>
                  {donor.available ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSendRequestDonor(donor);
                        closeDropdown();
                      }}
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2 bg-primary-200 rounded-xl"
                    >
                      <FontAwesome name="send-o" size={12} color="#ffffff" />
                      <Text className="text-xs font-bold text-white">Send Request</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      disabled
                      className="flex-1 flex-row items-center justify-center gap-1.5 py-2 bg-gray-200 rounded-xl"
                    >
                      <FontAwesome6 name="circle-xmark" size={12} color="#9CA3AF" />
                      <Text className="text-xs font-bold text-gray-500">Unavailable</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        </View>
      )}

      <DonorDetailModal
        donor={detailDonor}
        visible={!!detailDonor}
        onClose={() => setDetailDonor(null)}
      />

      <SendRequestModal
        donor={sendRequestDonor}
        visible={!!sendRequestDonor}
        onClose={() => setSendRequestDonor(null)}
      />
    </View>
  );
}