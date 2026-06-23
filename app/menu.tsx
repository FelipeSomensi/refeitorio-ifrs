import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Button, ScrollView, Text, View } from "react-native";
import {
  formatarDataBR,
  gerarDiasUteis,
  gerarSemanasDoAno,
  paraISO,
  semanaAtual,
} from "./utils/semanas";

type Cardapio = {
  dia: string;
  modeloId: number;
  tipo: string;
  itens: string[];
  favorito: boolean;
};

export default function Menu() {
  const [cardapiosDaSemana, setCardapiosDaSemana] = useState<Cardapio[]>([]);
  const [userType, setUserType] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const hojeISO = paraISO(new Date());

  // Sempre a semana atual (segunda a sexta)
  const { ano, numeroSemana } = semanaAtual();
  const diasDaSemana = useMemo(() => {
    const semanas = gerarSemanasDoAno(ano);
    const semana = semanas.find((s) => s.numero === numeroSemana) ?? semanas[0];
    return gerarDiasUteis(semana.segunda);
  }, [ano, numeroSemana]);

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

      const isosDaSemana = diasDaSemana.map((d) => d.iso);
      const filtrados = dados.filter((c: Cardapio) =>
        isosDaSemana.includes(c.dia),
      );
      setCardapiosDaSemana(filtrados);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar o cardápio");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function cardapiosDoDia(diaISO: string) {
    return cardapiosDaSemana.filter((c) => c.dia === diaISO);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 26, fontWeight: "bold" }}>Menu Principal</Text>

      {/* CARDÁPIOS DA SEMANA */}
      <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 8 }}>
        🍽️ Cardápios da Semana
      </Text>

      {loading ? (
        <Text style={{ color: "#888" }}>Carregando...</Text>
      ) : (
        diasDaSemana.map(({ iso, nome }) => {
          const itensDoDia = cardapiosDoDia(iso);
          const ehHoje = iso === hojeISO;

          return (
            <View
              key={iso}
              style={{
                backgroundColor: ehHoje ? "#A5D6A7" : "#EDEDED",
                padding: 16,
                borderRadius: 10,
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                {nome} · {formatarDataBR(iso)} {ehHoje && "• Hoje"}
              </Text>

              {itensDoDia.length === 0 ? (
                <Text style={{ color: "#777", fontSize: 13 }}>
                  Nenhum cardápio cadastrado.
                </Text>
              ) : (
                itensDoDia.map((item, i) => (
                  <View key={i} style={{ gap: 2 }}>
                    <Text style={{ fontWeight: "600", fontSize: 14 }}>
                      {item.tipo} {item.favorito && "⭐"}
                    </Text>
                    {item.itens.map((comida, j) => (
                      <Text key={j} style={{ fontSize: 14 }}>
                        • {comida}
                      </Text>
                    ))}
                  </View>
                ))
              )}
            </View>
          );
        })
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

      <Button
        title="⭐ Ver Favoritos"
        color="#F9A825"
        onPress={() => router.push("/favoritos")}
      />

      {userType === "servidor" && (
        <View style={{ marginTop: 8, gap: 10 }}>
          <Button
            title="⚙️ Gerenciar Cardápios (Admin)"
            color="#1565C0"
            onPress={() => router.push("/admin/cardapios")}
          />
          <Button
            title="👤 Gerenciar Usuários (Admin)"
            color="#5E35B1"
            onPress={() => router.push("/admin/usuarios")}
          />
        </View>
      )}
    </ScrollView>
  );
}
