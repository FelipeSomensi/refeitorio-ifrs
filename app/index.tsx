import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";

export default function Index() {
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");

  async function fazerLogin() {
    try {
      const resposta = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, pwd }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      await AsyncStorage.setItem("token", dados.token);
      await AsyncStorage.setItem("userType", dados.type); // salva o tipo do usuário

      router.push("/menu");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível conectar");
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
        Faça seu login
      </Text>

      <TextInput
        placeholder="Login"
        value={login}
        onChangeText={setLogin}
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 10,
        }}
      />

      <TextInput
        placeholder="Senha"
        value={pwd}
        onChangeText={setPwd}
        secureTextEntry
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 8,
          padding: 10,
        }}
      />

      <Button title="Entrar" onPress={fazerLogin} />
    </View>
  );
}
