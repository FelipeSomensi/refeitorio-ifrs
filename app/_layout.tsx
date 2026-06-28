import { Stack } from "expo-router";
import { cores } from "./utils/tema";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.verdePrincipal },
        headerTintColor: cores.branco,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Login" }} />
      <Stack.Screen name="menu" options={{ title: "Menu" }} />
      <Stack.Screen name="cardapios" options={{ title: "Cardápios" }} />
      <Stack.Screen name="favoritos" options={{ title: "Favoritos" }} />
      <Stack.Screen
        name="admin/cardapios"
        options={{ title: "Gerenciar Cardápios" }}
      />
      <Stack.Screen
        name="admin/usuarios"
        options={{ title: "Gerenciar Usuários" }}
      />
    </Stack>
  );
}
