import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";

type Cardapio = {
  dia: string;
  tipo: string;
  itens: string[];
};

export default function Menu() {
  const [cardapiosHoje, setCardapiosHoje] = useState<Cardapio[]>([]);
  const [userType, setUserType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const hoje = new Date().toISOString().split("T")[0];

  async function carregarDados() {
    const token = await AsyncStorage.getItem("token");
    const type = await AsyncStorage.getItem("userType");
    setUserType(type || "");

    try {
      const resposta = await fetch("http://localhost:3000/cardapio", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      const filtrados = dados.filter((c: Cardapio) => c.dia === hoje);
      setCardapiosHoje(filtrados);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar o cardápio");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold" }}>Menu Principal</Text>

      {/* CARDÁPIO DO DIA */}
      <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 8 }}>
        🍽️ Cardápio de Hoje
      </Text>

      {loading ? (
        <Text style={{ color: "#888" }}>Carregando...</Text>
      ) : cardapiosHoje.length === 0 ? (
        <View
          style={{
            backgroundColor: "#FFF3E0",
            padding: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#E65100" }}>
            Nenhum cardápio cadastrado para hoje.
          </Text>
        </View>
      ) : (
        cardapiosHoje.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: "#A5D6A7",
              padding: 16,
              borderRadius: 10,
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {item.tipo}
            </Text>
            {item.itens.map((comida, i) => (
              <Text key={i}>• {comida}</Text>
            ))}
          </View>
        ))
      )}

      {/* SEPARADOR */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          marginVertical: 8,
        }}
      />

      {/* BOTÕES DE NAVEGAÇÃO */}
      <Button
        title="Ver todos os cardápios"
        onPress={() => router.push("/cardapios")}
      />

      {userType === "servidor" && (
        <View style={{ marginTop: 8 }}>
          <Button
            title="⚙️ Gerenciar Cardápios (Admin)"
            color="#1565C0"
            onPress={() => router.push("/admin/cardapios")}
          />
        </View>
      )}
    </ScrollView>
  );
}
