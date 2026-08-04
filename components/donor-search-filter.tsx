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

const URGENCY_COLORS: Record<string, string> = {
  normal: "#22c55e",
  urgent: "#f97316",
  critical: "#ef4444",
};

const BloodGroupBadge = ({ group }: { group: string }) => (
  <View className="items-center justify-center rounded-full w-9 h-9 bg-primary-200">
    <Text className="text-[10px] font-bold text-white">{group}</Text>
  </View>
);

/* ── Donor detail modal ── */
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
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="items-center px-6 py-5 border-b border-gray-100">
              <BloodGroupBadge group={donor.blood_group} />
              <Text className="mt-3 text-xl font-bold text-gray-900">
                {donor.user.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <View
                  className={`w-2 h-2 rounded-full ${
                    donor.available ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <Text
                  className={`text-sm font-semibold ${
                    donor.available ? "text-emerald-600" : "text-red-500"
                  }`}
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
                <View key={row.label} className="py-3 border-b border-gray-100">
                  <Text className="text-xs font-semibold text-gray-400">
                    {row.label.toUpperCase()}
                  </Text>
                  <Text className="mt-0.5 text-sm text-gray-800">{row.value}</Text>
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
                className="flex-row items-center justify-center flex-1 gap-2 py-3 bg-primary-200 rounded-2xl"
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

/* ── Send-request modal ── */
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
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
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

export default function DonorSearchFilter() {
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

  // NEW: whether the user has explicitly submitted (search icon / keyboard "search"),
  // vs just typing. Typing = lightweight, non-Modal preview that never steals focus.
  const [submitted, setSubmitted] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [rowHeight, setRowHeight] = useState(56);

  const searchRowRef = useRef<View>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [anchor, setAnchor] = useState({ top: 0, left: 0, width: 0 });
  const [anchorReady, setAnchorReady] = useState(false);

  /* Measure synchronously (no rAF delay) so the Modal dropdown never uses stale coords */
  const measureAnchor = () => {
    searchRowRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) {
        setAnchor({ top: y + height + 8, left: x, width });
        setAnchorReady(true);
      }
    });
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasActiveFilters =
    search.length > 0 || activeGroups.length > 0 || availableOnly || verifiedOnly;

  useEffect(() => {
    setDismissed(false);
  }, [search, activeGroups, availableOnly, verifiedOnly]);

  // Typing new text always drops back into "preview" mode (Google-style),
  // even if a previous search had been submitted.
  useEffect(() => {
    setSubmitted(false);
  }, [search]);

  // Filter pill taps behave like an explicit submit — full scrollable Modal,
  // exactly like before. Keyboard isn't involved here so there's nothing to protect.
  useEffect(() => {
    if (activeGroups.length > 0 || availableOnly || verifiedOnly) {
      setSubmitted(true);
    }
  }, [activeGroups, availableOnly, verifiedOnly]);

  const submitPendingRef = useRef(false);

  const submitSearch = () => {
    if (!hasActiveFilters) return;

    setDismissed(false);

    const keyboardOpen =
      typeof Keyboard.isVisible === "function" ? Keyboard.isVisible() : true;

    if (!keyboardOpen) {
      measureAnchor();
      setSubmitted(true);
      return;
    }

    submitPendingRef.current = true;
    Keyboard.dismiss();
  };

  useEffect(() => {
    const hideListener = Keyboard.addListener("keyboardDidHide", () => {
      if (!submitPendingRef.current) return;

      submitPendingRef.current = false;

      // 150ms covers the Android resize lag after keyboardDidHide fires —
      // one animation frame wasn't enough, this is the actual fix
      setTimeout(() => {
        measureAnchor();
        setSubmitted(true);
      }, 150);
    });

    return () => hideListener.remove();
  }, []);

  /* Full Modal dropdown = filters panel OR an explicitly submitted search */
  const dropdownVisible = !dismissed && (showFilters || submitted);

  /* Lightweight, non-Modal preview shown while the user is still typing */
  const showQuickSuggestions =
    inputFocused &&
    !dismissed &&
    !submitted &&
    !showFilters &&
    hasActiveFilters &&
    (hasSearched || loading);

  useEffect(() => {
    if (dropdownVisible) {
      measureAnchor();
    }
  }, [dropdownVisible]);

  /* Re-calculate anchor on keyboard open/close so the Modal dropdown never overlaps the input */
  useEffect(() => {
    if (!dropdownVisible) return;

    const onShow = () => measureAnchor();
    const onHide = () => measureAnchor();

    const showListener = Keyboard.addListener("keyboardDidShow", onShow);
    const hideListener = Keyboard.addListener("keyboardDidHide", onHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, [dropdownVisible]);

  const closeDropdown = () => {
    setShowFilters(false);
    setSubmitted(false);
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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!hasActiveFilters) {
      setResults([]);
      setHasSearched(false);
      setSubmitted(false);
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

  /* Shared donor row renderer — used by both the quick preview and the full Modal list */
  const renderDonorItem = (donor: Donor) => (
    <View key={donor.id} className="px-4 py-3 border-b border-gray-100">
      <View className="flex-row items-center gap-3">
        <BloodGroupBadge group={donor.blood_group} />

        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-900">{donor.user.name}</Text>
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
          className="items-center flex-1 py-2 border rounded-xl border-primary-200"
        >
          <Text className="text-xs font-bold text-primary-100">View Details</Text>
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
  );

  return (
    <View className="relative z-10">
      {/* Search + Filter row */}
      <View
        ref={searchRowRef}
        onLayout={(e) => {
          setRowHeight(e.nativeEvent.layout.height);
          measureAnchor();
        }}
        collapsable={false}
        className="flex-row items-center gap-3 my-2"
      >
        <View className="flex-row items-center flex-1 px-3 py-2 bg-white shadow rounded-2xl shadow-black/10 elevation-3">
          <TouchableOpacity
            onPress={submitSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome6 name="magnifying-glass" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TextInput
            ref={searchInputRef}
            placeholder="Search Donors"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onFocus={() => {
              measureAnchor();
              setDismissed(false);
              setInputFocused(true);
            }}
            onBlur={() => setInputFocused(false)}
            onSubmitEditing={submitSearch}
            keyboardType="default"
            returnKeyType="search"
            autoCorrect={false}
            className="flex-1 ml-2 text-sm text-gray-900"
          />
        </View>

        <TouchableOpacity
          onPress={() => {
            measureAnchor();
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

      {/* Quick preview — plain overlay, NOT a Modal, so the keyboard never gets dismissed */}
      {showQuickSuggestions && (
        <>
          <Pressable
            style={{
              position: "absolute",
              top: rowHeight,
              left: 0,
              right: 0,
              bottom: -2000,
              zIndex: 20,
            }}
            onPress={() => {
              Keyboard.dismiss();
              setInputFocused(false);
              setDismissed(true);
            }}
          />

          <View
            style={{
              position: "absolute",
              top: rowHeight + 8,
              left: 0,
              right: 0,
              zIndex: 30,
            }}
            className="overflow-hidden bg-white shadow-xl rounded-2xl shadow-black/20 elevation-5"
          >
            <ScrollView
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              style={{ maxHeight: 260 }}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="red" />
                </View>
              ) : results.length === 0 ? (
                <View className="items-center px-4 py-4">
                  <Text className="text-sm text-gray-500">No donors found</Text>
                </View>
              ) : (
                <>
                  {results.slice(0, 5).map(renderDonorItem)}

                  {results.length > 0 && (
                    <TouchableOpacity
                      onPress={submitSearch}
                      className="items-center py-2.5 border-t border-gray-100"
                    >
                      <Text className="text-xs font-bold text-primary-100">
                        See all {results.length} results
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </>
      )}

      {/* Full dropdown — filters panel and/or a submitted search. This one stays a Modal so it can't be clipped. */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="none"
        onRequestClose={closeDropdown}
      >
        <Pressable style={{ flex: 1 }} onPress={closeDropdown}>
          {anchorReady && (
            <View
              onStartShouldSetResponder={() => true}
              style={{
                position: "absolute",
                top: anchor.top,
                left: anchor.left,
                width: anchor.width,
                maxHeight: 420,
              }}
              className="overflow-hidden bg-white shadow-xl rounded-2xl shadow-black/20 elevation-5"
            >
              <ScrollView
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator
                contentContainerStyle={{ paddingBottom: 24 }}
              >
                {/* Filters section */}
                {showFilters && (
                  <View
                    className={`gap-3 px-4 pt-4 pb-3 ${
                      showResultsSection ? "border-b border-gray-100" : ""
                    }`}
                  >
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
                )}

                {/* Results */}
                {showResultsSection && (
                  <View>
                    {loading ? (
                      <View className="items-center py-4">
                        <ActivityIndicator size="small" color="red" />
                      </View>
                    ) : results.length === 0 ? (
                      <View className="items-center px-4 py-4">
                        <Text className="text-sm text-gray-500">No donors found</Text>
                      </View>
                    ) : (
                      results.map(renderDonorItem)
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </Pressable>
      </Modal>

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