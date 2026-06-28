import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import CabecalhoInstitucional from "./utils/CabecalhoInstitucional";
import {
  formatarDataBR,
  gerarDiasUteis,
  gerarSemanasDoAno,
  paraISO,
  semanaAtual,
} from "./utils/semanas";
import { cores } from "./utils/tema";

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
    <View style={{ flex: 1, backgroundColor: cores.branco }}>
      <CabecalhoInstitucional subtitulo="Menu Principal" />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* CARDÁPIOS DA SEMANA */}
        <Text
          style={{ fontSize: 18, fontWeight: "600", color: cores.cinzaTexto }}
        >
          🍽️ Cardápios da Semana
        </Text>

        {loading ? (
          <Text style={{ color: cores.cinzaTexto }}>Carregando...</Text>
        ) : (
          diasDaSemana.map(({ iso, nome }) => {
            const itensDoDia = cardapiosDoDia(iso);
            const ehHoje = iso === hojeISO;

            return (
              <View
                key={iso}
                style={{
                  backgroundColor: ehHoje ? cores.verdeMedio : cores.cinzaClaro,
                  padding: 16,
                  borderRadius: 10,
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: cores.cinzaTexto,
                  }}
                >
                  {nome} · {formatarDataBR(iso)} {ehHoje && "• Hoje"}
                </Text>

                {itensDoDia.length === 0 ? (
                  <Text style={{ color: "#777", fontSize: 13 }}>
                    Nenhum cardápio cadastrado.
                  </Text>
                ) : (
                  itensDoDia.map((item, i) => (
                    <View key={i} style={{ gap: 2 }}>
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 14,
                          color: cores.cinzaTexto,
                        }}
                      >
                        {item.tipo} {item.favorito && "⭐"}
                      </Text>
                      {item.itens.map((comida, j) => (
                        <Text
                          key={j}
                          style={{ fontSize: 14, color: cores.cinzaTexto }}
                        >
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
            borderTopColor: cores.cinzaBorda,
            marginVertical: 8,
          }}
        />

        {/* BOTÕES DE NAVEGAÇÃO */}
        <TouchableOpacity
          onPress={() => router.push("/cardapios")}
          style={{
            backgroundColor: cores.verdePrincipal,
            borderRadius: 10,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: cores.branco, fontWeight: "700", fontSize: 15 }}
          >
            Ver todos os cardápios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/favoritos")}
          style={{
            backgroundColor: cores.favorito,
            borderRadius: 10,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{ color: cores.branco, fontWeight: "700", fontSize: 15 }}
          >
            ⭐ Ver Favoritos
          </Text>
        </TouchableOpacity>

        {userType === "servidor" && (
          <View style={{ marginTop: 8, gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push("/admin/cardapios")}
              style={{
                backgroundColor: cores.verdeEscuro,
                borderRadius: 10,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: cores.branco, fontWeight: "700", fontSize: 15 }}
              >
                ⚙️ Gerenciar Cardápios (Admin)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/admin/usuarios")}
              style={{
                backgroundColor: cores.cinzaTexto,
                borderRadius: 10,
                padding: 14,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: cores.branco, fontWeight: "700", fontSize: 15 }}
              >
                👤 Gerenciar Usuários (Admin)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* RODAPÉ INSTITUCIONAL */}
        <Text
          style={{
            fontSize: 11,
            color: "#999",
            textAlign: "center",
            marginTop: 16,
          }}
        >
          IFRS · Campus Bento Gonçalves
        </Text>
      </ScrollView>
    </View>
  );
}
