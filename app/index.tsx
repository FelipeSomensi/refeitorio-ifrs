import { router } from "expo-router";
import { useState } from "react";

import { Alert, Button, Text, TextInput, View } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");

  async function fazerLogin() {
    try {
      const resposta = await fetch(
        "http://localhost:3000/login",

        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            login,
            pwd,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        console.log("Senha incorreta");
        return;
      }

      await AsyncStorage.setItem("token", dados.token);

      console.log("Login Realizado");
      router.push("/menu");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível conectar");
      console.log("Não foi possível conectar");
    }
  }

  return (
    <View>
      <Text>Faça seu login</Text>

      <TextInput placeholder="Login" value={login} onChangeText={setLogin} />

      <TextInput
        placeholder="Senha"
        value={pwd}
        onChangeText={setPwd}
        secureTextEntry
      />

      <Button title="Entrar" onPress={fazerLogin} />
    </View>
  );
}
