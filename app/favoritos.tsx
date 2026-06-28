import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import CabecalhoInstitucional from "./utils/CabecalhoInstitucional";
import { formatarDataBR } from "./utils/semanas";
import { cores } from "./utils/tema";

type Favorito = {
  modeloId: number;
  tipo: string;
  itens: string[];
  dias: string[]; // todas as datas (YYYY-MM-DD) em que esse cardápio é usado
};

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarFavoritos() {
    const token = await AsyncStorage.getItem("token");
    setErro("");

    try {
      const resposta = await fetch("http://localhost:3000/favoritos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.error || "Não foi possível carregar os favoritos.");
        return;
      }

      setFavoritos(dados);
    } catch (e) {
      setErro("Não foi possível carregar os favoritos.");
    } finally {
      setLoading(false);
    }
  }

  async function removerFavorito(modeloId: number) {
    setErro("");
    const token = await AsyncStorage.getItem("token");

    try {
      const resposta = await fetch(
        `http://localhost:3000/favoritos/${modeloId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.error || "Não foi possível remover o favorito.");
        return;
      }

      setFavoritos((prev) => prev.filter((f) => f.modeloId !== modeloId));
    } catch (e) {
      setErro("Não foi possível remover o favorito.");
    }
  }

  useEffect(() => {
    carregarFavoritos();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: cores.branco }}>
      <CabecalhoInstitucional subtitulo="Meus Favoritos" />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {erro && (
          <View
            style={{
              backgroundColor: cores.erroFundo,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Text
              style={{
                color: cores.erro,
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              {erro}
            </Text>
          </View>
        )}

        {loading ? (
          <Text style={{ color: "#888" }}>Carregando...</Text>
        ) : favoritos.length === 0 ? (
          <View
            style={{
              backgroundColor: cores.avisoFundo,
              padding: 14,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: cores.aviso }}>
              Você ainda não favoritou nenhum cardápio. Toque na estrela ☆ na
              tela de cardápios para favoritar.
            </Text>
          </View>
        ) : (
          favoritos.map((fav) => (
            <View
              key={fav.modeloId}
              style={{
                backgroundColor: cores.favoritoFundo,
                padding: 16,
                borderRadius: 12,
                gap: 10,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                    {fav.tipo}
                  </Text>
                  {fav.itens.map((comida, i) => (
                    <Text key={i}>• {comida}</Text>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => removerFavorito(fav.modeloId)}
                  style={{ padding: 4 }}
                >
                  <Text style={{ fontSize: 20 }}>⭐</Text>
                </TouchableOpacity>
              </View>

              {/* DIAS EM QUE ESSE CARDÁPIO É USADO */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#FFE082",
                  paddingTop: 10,
                  gap: 6,
                }}
              >
                <Text
                  style={{ fontWeight: "600", color: "#795548", fontSize: 13 }}
                >
                  Aparece em:
                </Text>

                {fav.dias.length === 0 ? (
                  <Text style={{ color: "#999", fontSize: 13 }}>
                    Não está atribuído a nenhum dia no momento.
                  </Text>
                ) : (
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {fav.dias.map((dia) => (
                      <View
                        key={dia}
                        style={{
                          backgroundColor: "#FFE082",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 20,
                        }}
                      >
                        <Text style={{ fontSize: 12, color: "#5D4037" }}>
                          {formatarDataBR(dia)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
