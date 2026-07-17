import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: "Blood Requests" }} />

      <Stack.Screen
        name="create"
        options={{ title: "Create Request", headerBackTitle: "Back" }}
      />

      <Stack.Screen
        name="[id]"
        options={{
          title: "Details",
          headerBackTitle: "Back",
        }}
      />

      {/* <Stack.Screen
        name="matching-donor"
        options={{ title: "Matching Donor" }}
      /> */}
      <Stack.Screen
        name="matching-donor"
        options={{ title: "Matching Donor", headerBackTitle: "Back" }}
      />

      <Stack.Screen
        name="blood-request/my-request"
        options={{
          title: "My Request",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
