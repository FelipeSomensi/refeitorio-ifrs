import { useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { Alert, ScrollView, Text, View } from "react-native";

type Cardapio = {
  dia: string;
  tipo: string;
  itens: string[];
};

export default function Cardapios() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);

  async function carregarCardapios() {
    const token = await AsyncStorage.getItem("token");

    try {
      const resposta = await fetch(
        "http://localhost:3000/cardapio",

        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      setCardapios(dados);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os cardápios");
    }
  }

  useEffect(() => {
    carregarCardapios();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 20,
        gap: 15,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        Cardápios da Semana
      </Text>

      {cardapios.map((item, index) => {
        const ehHoje = item.dia === hoje;

        return (
          <View
            key={index}
            style={{
              backgroundColor: ehHoje ? "#A5D6A7" : "#E0E0E0",

              padding: 15,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {item.dia}
            </Text>

            <Text
              style={{
                marginBottom: 10,
                fontSize: 16,
              }}
            >
              {item.tipo}
            </Text>

            {item.itens.map((comida, i) => (
              <Text key={i}>• {comida}</Text>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
