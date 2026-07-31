import { FontAwesome6, Fontisto } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

//  Types

interface Donor {
  id: number;
  blood_group: string;
  available: boolean;
  latitude: string;
  longitude: string;
  last_donated_at: string;
  verified: boolean | null;
  user: { id: number; name: string; email: string; phone_number: string };
}

//  Constants

const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/donor_profiles";

const BG_COLORS: Record<string, string> = {
  "A+": "#dc2626",
  "A-": "#b91c1c",
  "B+": "#ea580c",
  "B-": "#c2410c",
  "AB+": "#7c3aed",
  "AB-": "#6d28d9",
  "O+": "#db2777",
  "O-": "#be185d",
};

//  Helpers

const formatDate = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

const daysSince = (iso: string) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86400000) : 0;

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

//  Small Components

const BloodBadge = ({ group, large }: { group: string; large?: boolean }) => {
  const color = BG_COLORS[group] ?? "#dc2626";
  return (
    <View
      className={`items-center justify-center ${large ? "w-16 h-16 rounded-2xl" : "w-10 h-10 rounded-xl"}`}
      style={{
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
      }}
    >
      <Text
        className={`text-white font-black ${large ? "text-xl" : "text-sm"}`}
      >
        {group}
      </Text>
    </View>
  );
};

const Avatar = ({ name, group }: { name: string; group: string }) => {
  const color = BG_COLORS[group] ?? "#dc2626";
  return (
    <View
      className="items-center justify-center w-12 h-12 rounded-full"
      style={{
        backgroundColor: color + "22",
        borderColor: color + "55",
        borderWidth: 2,
      }}
    >
      <Text className="text-base font-black" style={{ color }}>
        {initials(name)}
      </Text>
    </View>
  );
};

//  Detail Modal

const DetailModal = ({
  donor,
  visible,
  onClose,
}: {
  donor: Donor | null;
  visible: boolean;
  onClose: () => void;
}) => {
  if (!donor) return null;
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="justify-end flex-1 bg-black/60">
        <View className="bg-white dark:bg-zinc-900 rounded-t-3xl max-h-[88%]">
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Hero */}
            <View className="items-center px-6 py-6 border-b border-zinc-100 dark:border-zinc-800">
              <BloodBadge group={donor.blood_group} large />
              <Text className="mt-4 text-2xl font-black text-center text-zinc-900 dark:text-white">
                {donor.user.name}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <View
                  className={`w-2 h-2 rounded-full ${donor.available ? "bg-emerald-500" : "bg-red-500"}`}
                />
                <Text
                  className={`font-bold text-sm ${donor.available ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}
                >
                  {donor.available ? "Available to Donate" : "Not Available"}
                </Text>
              </View>
            </View>

            {/* Stats */}
            <View className="flex-row gap-3 px-4 py-4">
              {[
                {
                  label: "DAYS SINCE",
                  value: `${daysSince(donor.last_donated_at)}d`,
                },
                // { label: "DONOR ID", value: `#${donor.id}` },
                {
                  label: "VERIFIED",
                  value: donor.verified ? "✓ Yes" : "Pending",
                },
              ].map((s) => (
                <View
                  key={s.label}
                  className="items-center flex-1 p-3 border bg-zinc-50 dark:bg-zinc-800 rounded-xl border-zinc-100 dark:border-zinc-700"
                >
                  <Text className="text-lg font-black text-red-500">
                    {s.value}
                  </Text>
                  <Text className="text-zinc-400 text-[10px] font-bold mt-1">
                    {s.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Info Rows */}
            <View className="px-4">
              {[
                {
                  icon: (
                    <FontAwesome6 name="envelope" size={15} color="#a1a1aa" />
                  ),
                  label: "Email",
                  value: donor.user.email,
                },
                {
                  icon: (
                    <FontAwesome6
                      name="phone-volume"
                      size={15}
                      color="#a1a1aa"
                    />
                  ),
                  label: "Phone",
                  value: donor.user.phone_number,
                },
                {
                  icon: (
                    <Fontisto name="blood-drop" size={22} color="#ED3632" />
                  ),
                  label: "Last Donated",
                  value: formatDate(donor.last_donated_at),
                },
                {
                  icon: (
                    <FontAwesome6
                      name="location-dot"
                      size={15}
                      color="#EF5350"
                      solid
                    />
                  ),
                  label: "Location",
                  value: `${parseFloat(donor.latitude).toFixed(4)}, ${parseFloat(donor.longitude).toFixed(4)}`,
                },
              ].map((row) => (
                <View
                  key={row.label}
                  className="flex-row items-center py-4 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <Text className="mr-4 text-lg">{row.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-zinc-400 text-[10px] font-bold tracking-widest mb-0.5">
                      {row.label.toUpperCase()}
                    </Text>
                    <Text className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {row.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 px-4 mt-6">
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL(`tel:${donor.user.phone_number}`)
                }
                className="flex-row items-center justify-center flex-1 gap-2 py-4 bg-primary-100 rounded-2xl"
              >
                <FontAwesome6 name="phone-volume" size={20} color="#ffffff" />
                <Text className="text-white font-black text-[15px]">
                  Call Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                className="items-center flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl"
              >
                <Text className="text-zinc-500 dark:text-zinc-300 font-bold text-[15px]">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

//  Donor Card

const DonorCard = ({
  donor,
  onDetail,
}: {
  donor: Donor;
  onDetail: () => void;
}) => {
  const color = BG_COLORS[donor.blood_group] ?? "#dc2626";
  const days = daysSince(donor.last_donated_at);

  return (
    <View
      className="mx-4 mb-3 overflow-hidden bg-white border dark:bg-zinc-900 rounded-2xl border-zinc-100 dark:border-zinc-800"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ height: 3, backgroundColor: color }} />
      <View className="p-4">
        {/* Top row */}
        <View className="flex-row items-center mb-3">
          <Avatar name={donor.user.name} group={donor.blood_group} />
          <View className="flex-1 mx-3">
            <Text
              className="text-base font-black text-zinc-900 dark:text-white"
              numberOfLines={1}
            >
              {donor.user.name}
            </Text>
            <Text className="text-zinc-400 text-xs mt-0.5" numberOfLines={1}>
              {donor.user.email}
            </Text>
            <View
              className={`flex-row items-center mt-1.5 self-start px-2.5 py-1 rounded-lg gap-1.5 ${donor.available ? "bg-emerald-50 dark:bg-emerald-950" : "bg-red-50 dark:bg-red-950"}`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full ${donor.available ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <Text
                className={`font-bold text-[11px] ${donor.available ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
              >
                {donor.available ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
          <BloodBadge group={donor.blood_group} />
        </View>

        <View className="h-px mb-3 bg-zinc-100 dark:bg-zinc-800" />

        {/* Pills */}
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[
            {
              icon: (
                <FontAwesome6
                  name="calendar-days"
                  size={14}
                  color="#ED3632"
                  solid
                />
              ),
              text: days > 0 ? `${days}d ago` : "Today",
            },
            // { icon: "📱", text: donor.user.phone_number },
          ].map((p) => (
            <View
              key={p.text}
              className="flex-row items-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl px-3 py-1.5 gap-1.5"
            >
              <Text className="text-xs">{p.icon}</Text>
              <Text className="text-xs font-semibold text-zinc-500 dark:text-zinc-300">
                {p.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View className="flex-row gap-2.5">
          <TouchableOpacity
            onPress={onDetail}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl  bg-primary-100"
          >
            <Text className="text-sm font-bold text-white">View Detail</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(`tel:${donor.user.phone_number}`).catch(() =>
                Alert.alert("Error", "Cannot place call."),
              )
            }
            className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-2xl border border-primary-200"
            // style={{
            //   shadowColor: "#ED3632sssss",
            //   shadowOffset: { width: 0, height: 3 },
            //   shadowOpacity: 0.35,
            //   shadowRadius: 6,
            //   elevation: 4,
            // }}
          >
            <FontAwesome6 name="phone-volume" size={15} color="#ED3632" />
            <Text className="text-sm font-bold text-primary-100">Call</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

//  Main Screen

export default function DonorListScreen() {
  const [data, setData] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Donor | null>(null);
  const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);

  const fetchDonors = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      setData(res.data.donors);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDonors();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDonors();
  }, []);

  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-zinc-50 dark:bg-zinc-950">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-5 pb-5 bg-white border-b dark:bg-zinc-900 pt-14 border-zinc-100 dark:border-zinc-800">
        <View className="flex-row items-center justify-between">
          <View>
            {/* <Text className="mb-1 text-xs font-bold tracking-widest text-red-500">
              BLOOD DONOR FINDER
            </Text> */}
            <Text className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Donors
            </Text>
          </View>
          <View className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-900 rounded-2xl px-4 py-2.5 items-center">
            <Text className="text-xl font-black leading-none text-red-500">
              {data.length}
            </Text>
            <Text className="text-red-400 text-[10px] font-bold tracking-widest">
              DONORS
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DonorCard donor={item} onDetail={() => setSelected(item)} />
        )}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 40,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="red"
            colors={["red"]}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center flex-1 gap-3 py-20">
            <Fontisto name="blood-drop" size={22} color="#ED3632" />
            <Text className="text-xl font-black text-zinc-900 dark:text-white">
              No Donors Found
            </Text>
            <Text className="text-sm text-center text-zinc-400">
              No registered donors at the moment.
            </Text>
          </View>
        }
      />

      <DetailModal
        donor={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}
