import CustomHeader from "@/components/CustomHeader";
import RequestCard from "@/components/request-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

const API_URL =
  "https://blood-donor-finder-be.onrender.com/api/v1/blood_requests/my_requests";

//  Pagination Bar

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
    <View className="flex-row items-center justify-center flex-wrap px-5 py-4" style={{ gap: 6 }}>
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

export default function MyRequestsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMyRequests = async (pageNum: number = page) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("auth_token");

      const res = await axios.get(API_URL, {
        params: { page: pageNum },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      setData(res.data.blood_requests);
      setTotalPages(res.data.meta?.pages ?? 1);
    } catch (err) {
      console.log("MY REQUEST FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    fetchMyRequests(page);
  }, [page]);

  const sortedData = [...data].sort((a, b) => {
    const aCompleted = a.units_collected >= a.units_required ? 1 : 0;
    const bCompleted = b.units_collected >= b.units_required ? 1 : 0;
    return aCompleted - bCompleted; // incomplete first, completed last
  });

  if (loading) {
    return (
      <View className="items-center justify-center flex-1">
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <View className="flex-1 ">
      <CustomHeader title="My Request" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-5">
          {/* Empty State */}
          {data.length === 0 && (
            <View className="items-center mt-20">
              <Text className="text-base text-gray-500">
                No blood requests found
              </Text>
            </View>
          )}

          {/* Request Cards */}
          {sortedData.map((item) => (
            <RequestCard
              key={item.id}
              isMyRequest
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
    </View>
  );
}