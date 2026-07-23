import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View, useColorScheme } from "react-native";

type HeaderProps = {
  title: string;
};

export default function CustomHeader({ title }: HeaderProps) {
  const colorScheme = useColorScheme();

  return (
    <View className="flex-row items-center px-5 pb-3 bg-white border-b pt-14 border-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={colorScheme === "dark" ? "white" : "black"}
        />
      </TouchableOpacity>

      <Text className="ml-3 text-2xl font-bold text-zinc-900 dark:text-white">
        {title}
      </Text>
    </View>
  );
}
