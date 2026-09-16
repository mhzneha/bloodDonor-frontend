// import { FontAwesome6 } from "@expo/vector-icons";
// import { router } from "expo-router";
// import React from "react";
// import { Linking, Text, TouchableOpacity, View } from "react-native";

// export type BloodRequest = {
//   id: string;
//   name: string;
//   location: string;
//   time: string;
//   bloodGroup: string;
//   phone_number?: string;
//   unitsRequired: number;
//   unitsCollected: number;
// };

// type RequestCardProps = {
//   item: BloodRequest;
//   isMyRequest?: boolean;
// };

// const AvatarPlaceholder = ({ className = "" }: { className?: string }) => (
//   <View className={`rounded-full bg-gray-200  ${className}`} />
// );

// const BloodGroupBadge = ({ group }: { group: string }) => (
//   <View className="items-center justify-center w-10 h-10 bg-red-500 rounded-full">
//     <Text className="text-xs font-bold text-white">{group}</Text>
//   </View>
// );
// export default function RequestCard({
//   item,
//   isMyRequest = false,
// }: RequestCardProps) {
//   const isCompleted = item.unitsCollected >= item.unitsRequired;

//   const callDonor = () => {
//     if (!item.phone_number) return;
//     Linking.openURL(`tel:${item.phone_number}`);
//   };

//   return (
//     <View className="p-4 mb-5 bg-gray-100 dark:bg-zinc-900 shadow-sm rounded-2xl elevation-2">
//       <View className="flex-row items-center mb-3">
//         <AvatarPlaceholder className="mr-3 w-14 h-14" />

//         <View className="flex-1">
//           <Text className="font-bold text-base text-gray-900 dark:text-white mb-0.5">
//             {item.name}
//           </Text>

//           <View className="flex-row items-center mb-0.5">
//             <FontAwesome6 name="location-dot" size={12} color="#EF5350" solid />

//             <Text className="flex-shrink pl-2 text-xs text-gray-500 dark:text-zinc-400">
//               {item.location}
//             </Text>
//           </View>

//           <Text className="text-xs text-gray-400 dark:text-zinc-500">{item.time}</Text>
//         </View>

//         <BloodGroupBadge group={item.bloodGroup} />
//       </View>

//       {/* Units row */}
//       <View className="flex-row items-center mb-3">
//         <FontAwesome6 name="droplet" size={12} color="#ED3632" solid />
//         <Text className="pl-2 text-xs font-medium text-gray-600 dark:text-zinc-400">
//           {item.unitsCollected}/{item.unitsRequired} units collected
//         </Text>
//       </View>

//       <View className="flex-row items-center gap-2 mt-2">
//         <TouchableOpacity
//           onPress={() =>
//             router.push({
//               pathname: "/blood-request/[id]",
//               params: { id: item.id },
//             })
//           }
//           className="flex-1 bg-red-500 rounded-xl py-2.5 px-1 items-center"
//         >
//           <Text className="text-sm font-semibold text-white">View Details</Text>
//         </TouchableOpacity>

//         {isMyRequest ? (
//           isCompleted ? (
//             <View className="flex-1 bg-gray-200 dark:bg-zinc-800 rounded-xl py-2.5 items-center">
//               <Text className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
//                 Completed
//               </Text>
//             </View>
//           ) : (
//             <TouchableOpacity
//               className="flex-1 border border-red-400 rounded-xl py-2.5 items-center"
//               onPress={() => {
//                 router.push({
//                   pathname: "/blood-request/matching-donor",
//                   params: { id: item.id },
//                 });
//               }}
//             >
//               <Text className="text-sm font-semibold text-red-500">
//                 View Donors
//               </Text>
//             </TouchableOpacity>
//           )
//         ) : (
//           <TouchableOpacity
//             onPress={callDonor}
//             className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 border border-primary-200"
//             style={{ gap: 6 }}
//             activeOpacity={0.85}
//           >
//             <FontAwesome6 name="phone-volume" size={15} color="#ED3632" />
//             <Text className="text-sm font-bold text-primary-200">Call</Text>
//           </TouchableOpacity>
//         )}
//       </View>
//     </View>
//   );
// }
// // export default function RequestCard({
// //   item,
// //   isMyRequest = false,
// // }: RequestCardProps) {
// //   const isCompleted = item.unitsCollected >= item.unitsRequired;

// //   const callDonor = () => {
// //     if (!item.phone_number) return;
// //     Linking.openURL(`tel:${item.phone_number}`);
// //   };

// //   return (
// //     <View className="p-4 my-5 bg-gray-100 dark:bg-zinc-900 shadow-sm rounded-2xl elevation-2">
// //       <View className="flex-row items-center mb-3">
// //          <AvatarPlaceholder className="mr-3 w-14 h-14" />

// //          <View className="flex-1">
// //            <Text className="font-bold text-base text-gray-900 mb-0.5">
// //              {item.name}
// //            </Text>

// //            <View className="flex-row items-center mb-0.5">
// //              <FontAwesome6 name="location-dot" size={12} color="#EF5350" solid />

// //              <Text className="flex-shrink pl-2 text-xs text-gray-500">
// //                {item.location}
// //              </Text>
// //            </View>

// //            <Text className="text-xs text-gray-400">{item.time}</Text>
// //          </View>

// //          <BloodGroupBadge group={item.bloodGroup} />
// //        </View>

// //        {/* Units row */}
// //        <View className="flex-row items-center mb-3">
// //          <FontAwesome6 name="droplet" size={12} color="#ED3632" solid />
// //          <Text className="pl-2 text-xs font-medium text-gray-600">
// //            {item.unitsCollected}/{item.unitsRequired} units collected
// //          </Text>
// //        </View>

// //       <View className="flex-row items-center gap-2 mt-2">
// //         <TouchableOpacity
// //           onPress={() =>
// //             router.push({
// //               pathname: "/blood-request/[id]",
// //               params: { id: item.id },
// //             })
// //           }
// //           className="flex-1 bg-red-500 rounded-xl py-2.5 px-1 items-center"
// //         >
// //           <Text className="text-sm font-semibold text-white">View Details</Text>
// //         </TouchableOpacity>

// //         {isMyRequest ? (
// //           isCompleted ? (
// //             <View className="flex-1 bg-gray-200 rounded-xl py-2.5 items-center">
// //               <Text className="text-sm font-semibold text-gray-500">
// //                 Completed
// //               </Text>
// //             </View>
// //           ) : (
// //             <TouchableOpacity
// //               className="flex-1 border border-red-400 rounded-xl py-2.5 items-center"
// //               onPress={() => {
// //                 router.push({
// //                   pathname: "/blood-request/matching-donor",
// //                   params: { id: item.id },
// //                 });
// //               }}
// //             >
// //               <Text className="text-sm font-semibold text-red-500">
// //                 View Donors
// //               </Text>
// //             </TouchableOpacity>
// //           )
// //         ) : (
// //           <TouchableOpacity
// //             onPress={callDonor}
// //             className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 border border-primary-200"
// //             style={{ gap: 6 }}
// //             activeOpacity={0.85}
// //           >
// //             <FontAwesome6 name="phone-volume" size={15} color="#ED3632" />
// //             <Text className="text-sm font-bold text-primary-200">Call</Text>
// //           </TouchableOpacity>
// //         )}
// //       </View>
// //     </View>
// //   );
// // }

import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";

export type BloodRequest = {
  id: string;
  name: string;
  location: string;
  time: string;
  bloodGroup: string;
  phone_number?: string;
  unitsRequired: number;
  unitsCollected: number;
};

type RequestCardProps = {
  item: BloodRequest;
  isMyRequest?: boolean;
};

const BloodGroupBadge = ({ group }: { group: string }) => (
  <View className="items-center justify-center w-12 h-12 bg-red-500 rounded-2xl">
    <Text className="text-sm font-extrabold text-white">{group}</Text>
  </View>
);

export default function RequestCard({
  item,
  isMyRequest = false,
}: RequestCardProps) {
  const isCompleted = item.unitsCollected >= item.unitsRequired;
  const progress = Math.min(item.unitsCollected / item.unitsRequired, 1);

  const callDonor = () => {
    if (!item.phone_number) return;
    Linking.openURL(`tel:${item.phone_number}`);
  };

  return (
    <View className="p-4 mb-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm rounded-2xl elevation-2">
      {/* Top row */}
      <View className="flex-row items-start mb-3" style={{ gap: 12 }}>
        <BloodGroupBadge group={item.bloodGroup} />

        <View className="flex-1">
          <Text
            className="font-bold text-base text-gray-900 dark:text-white mb-1"
            numberOfLines={1}
          >
            {item.name}
          </Text>

          <View className="flex-row items-center mb-1">
            <FontAwesome6 name="location-dot" size={11} color="#EF5350" solid />
            <Text
              className="flex-shrink pl-1.5 text-xs text-gray-500 dark:text-zinc-400"
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>

          <Text className="text-xs text-gray-400 dark:text-zinc-500">
            {item.time}
          </Text>
        </View>

        {isCompleted && (
          <View className="px-2.5 py-1 bg-green-100 dark:bg-green-900/40 rounded-full">
            <Text className="text-[10px] font-bold text-green-700 dark:text-green-400">
              Fulfilled
            </Text>
          </View>
        )}
      </View>

      {/* Progress */}
      <View className="mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <View className="flex-row items-center">
            <FontAwesome6 name="droplet" size={11} color="#ED3632" solid />
            <Text className="pl-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400">
              Units collected
            </Text>
          </View>
          <Text className="text-xs font-bold text-gray-700 dark:text-zinc-300">
            {item.unitsCollected}/{item.unitsRequired}
          </Text>
        </View>

        <View className="h-1.5 overflow-hidden bg-gray-100 dark:bg-zinc-800 rounded-full">
          <View
            className={`h-full rounded-full ${
              isCompleted ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>

      {/* Buttons */}
      <View className="flex-row items-center gap-2 mt-1">
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/blood-request/[id]",
              params: { id: item.id },
            })
          }
          className="flex-1 bg-red-500 rounded-xl py-2.5 px-1 items-center"
          activeOpacity={0.85}
        >
          <Text className="text-sm font-semibold text-white">View Details</Text>
        </TouchableOpacity>

        {isMyRequest ? (
          isCompleted ? (
            <View className="flex-1 bg-gray-100 dark:bg-zinc-800 rounded-xl py-2.5 items-center">
              <Text className="text-sm font-semibold text-gray-500 dark:text-zinc-400">
                Completed
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              className="flex-1 border border-red-400 rounded-xl py-2.5 items-center"
              onPress={() => {
                router.push({
                  pathname: "/blood-request/matching-donor",
                  params: { id: item.id },
                });
              }}
              activeOpacity={0.85}
            >
              <Text className="text-sm font-semibold text-red-500">
                View Donors
              </Text>
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity
            onPress={callDonor}
            className="flex-1 flex-row items-center justify-center rounded-xl py-2.5 border border-primary-200"
            style={{ gap: 6 }}
            activeOpacity={0.85}
          >
            <FontAwesome6 name="phone-volume" size={14} color="#ED3632" />
            <Text className="text-sm font-bold text-primary-200">Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}