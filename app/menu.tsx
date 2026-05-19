import { Button, Text, View } from "react-native";

import { router } from "expo-router";

export default function Menu() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
      }}
    >
      <Text>Menu Principal</Text>

      <Button
        title="Cardápios"
        onPress={() => {
          router.push("/cardapios");
        }}
      />
    </View>
  );
}
