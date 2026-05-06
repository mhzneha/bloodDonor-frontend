import { useColorScheme } from "@/hooks/use-color-scheme";
import { Redirect, Slot } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isAuthenticated = false;
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <Slot />;

  // return (
  //   <Tabs
  //     screenOptions={{
  //       tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
  //       headerShown: false,
  //       tabBarButton: HapticTab,
  //     }}
  //   >
  //     <Tabs.Screen
  //       name="index"
  //       options={{
  //         title: "Home",
  //         tabBarIcon: ({ color }) => (
  //           <IconSymbol size={28} name="house.fill" color={color} />
  //         ),
  //       }}
  //     />
  //     <Tabs.Screen
  //       name="explore"
  //       options={{
  //         title: "Explore",
  //         tabBarIcon: ({ color }) => (
  //           <IconSymbol size={28} name="paperplane.fill" color={color} />
  //         ),
  //       }}
  //     />
  //   </Tabs>
  // );
}
