import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Blood Requests" }} />
      <Stack.Screen name="create" options={{ title: "Create Request" }} />
      <Stack.Screen name="[id]" options={{ title: "Details" }} />
    </Stack>
  );
}