import RequestCard from "@/components/request-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  RefreshControl,
  View,
} from "react-native";

const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests";

//  Pagination bar
const PaginationBar = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) return null;

  const getPageItems = (): (number | "...")[] => {
    const items: (number | "...")[] = [];
    const delta = 1;

    const range: number[] = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    items.push(1);
    if (range[0] > 2) items.push("...");
    items.push(...range);
    if (range[range.length - 1] < totalPages - 1) items.push("...");
    if (totalPages > 1) items.push(totalPages);

    return items;
  };

  const pageItems = getPageItems();
  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return (
    <View className="flex-row items-center justify-center flex-wrap px-5 pt-4 pb-8" style={{ gap: 6 }}>
      {/* Prev */}
      <TouchableOpacity
        onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={isPrevDisabled}
        className={`items-center justify-center w-9 h-9 rounded-lg border ${
          isPrevDisabled
            ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
            : "border-zinc-400 dark:border-zinc-600"
        }`}
      >
        <Text
          className={`text-sm font-bold ${
            isPrevDisabled
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          ‹
        </Text>
      </TouchableOpacity>

      {pageItems.map((item, idx) =>
        item === "..." ? (
          <Text
            key={`ellipsis-${idx}`}
            className="px-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400"
          >
            …
          </Text>
        ) : (
          <TouchableOpacity
            key={item}
            onPress={() => onPageChange(item)}
            className={`items-center justify-center rounded-lg ${
              item === currentPage
                ? "bg-red-600"
                : "border border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800"
            }`}
            style={{ width: 36, height: 36 }}
          >
            <Text
              className={`text-sm font-bold ${
                item === currentPage
                  ? "text-white"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ),
      )}

      {/* Next */}
      <TouchableOpacity
        onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
        className={`items-center justify-center w-9 h-9 rounded-lg border ${
          isNextDisabled
            ? "border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800"
            : "border-zinc-400 dark:border-zinc-600"
        }`}
      >
        <Text
          className={`text-sm font-bold ${
            isNextDisabled
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-700 dark:text-zinc-300"
          }`}
        >
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function BloodRequestIndex() {
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async (pageNum: number = page, silent = false) => {
    try {
      if (!silent) setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      const res = await axios.get(API_URL, {
        params: { page: pageNum },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      setData(res.data.blood_requests);

      const pages = res.data.meta?.pages ?? 1;

      setTotalPages(pages);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onPullToRefresh = () => {
    setRefreshing(true);
    fetchRequests(page, true);
  };

  useEffect(() => {
    fetchRequests(page);
  }, [page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRefresh = () => {
    fetchRequests(page);
  };

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-5 pb-6 bg-white border-b dark:bg-zinc-900 pt-14 border-zinc-100 dark:border-zinc-800">
        <Text className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
          Blood Request
        </Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text className="text-sm font-semibold text-red-500">Refresh</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        className="flex-1 bg-zinc-50 dark:bg-zinc-950"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor="#dc2626"
            colors={["#dc2626"]}
          />
        }
      >
        {/* Cards */}
        <View className="px-5 mt-5">
          {data.map((item) => (
            <RequestCard
              key={item.id}
              item={{
                id: String(item.id),
                name: item.patient_name,
                location: item.hospital_name,
                time: new Date(item.created_at).toLocaleString(),
                bloodGroup: item.blood_group,
                phone_number: item.contact_number,
                unitsRequired: item.units_required,
                unitsCollected: item.units_collected,
              }}
            />
          ))}
        </View>

        {/* Pagination */}
        <PaginationBar
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push("/blood-request/create")}
        className="absolute px-5 py-3 bottom-6 right-6 bg-primary-200 rounded-xl"
      >
        <Text className="font-bold text-white">+ Add Request</Text>
      </TouchableOpacity>
    </View>
  );
}