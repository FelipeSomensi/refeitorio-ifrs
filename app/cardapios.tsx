import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  formatarDataBR,
  gerarDiasUteis,
  gerarSemanasDoAno,
  paraISO,
  semanaAtual,
} from "./utils/semanas";

type Cardapio = {
  dia: string; // YYYY-MM-DD
  modeloId: number;
  tipo: string;
  itens: string[];
  favorito: boolean;
};

export default function Cardapios() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [loading, setLoading] = useState(true);

  const padrao = semanaAtual();
  const [ano, setAno] = useState(padrao.ano);
  const [numeroSemana, setNumeroSemana] = useState(padrao.numeroSemana);
  const [diasExpandidos, setDiasExpandidos] = useState<string[]>([]);

  const [modalSemanaAberto, setModalSemanaAberto] = useState(false);

  const hojeISO = paraISO(new Date());

  async function carregarCardapios() {
    const token = await AsyncStorage.getItem("token");

    try {
      const resposta = await fetch("http://localhost:3000/cardapio", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      setCardapios(dados);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os cardápios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCardapios();
  }, []);

  async function alternarFavorito(modeloId: number, favoritoAtual: boolean) {
    const token = await AsyncStorage.getItem("token");

    // Atualização otimista: reflete na tela antes da resposta do servidor
    setCardapios((prev) =>
      prev.map((c) =>
        c.modeloId === modeloId ? { ...c, favorito: !favoritoAtual } : c,
      ),
    );

    try {
      const resposta = await fetch(
        favoritoAtual
          ? `http://localhost:3000/favoritos/${modeloId}`
          : "http://localhost:3000/favoritos",
        {
          method: favoritoAtual ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: favoritoAtual ? undefined : JSON.stringify({ modeloId }),
        },
      );

      if (!resposta.ok) {
        // Reverte se der erro
        setCardapios((prev) =>
          prev.map((c) =>
            c.modeloId === modeloId ? { ...c, favorito: favoritoAtual } : c,
          ),
        );
        const dados = await resposta.json();
        Alert.alert("Erro", dados.error);
      }
    } catch (e) {
      setCardapios((prev) =>
        prev.map((c) =>
          c.modeloId === modeloId ? { ...c, favorito: favoritoAtual } : c,
        ),
      );
      Alert.alert("Erro", "Não foi possível atualizar o favorito");
    }
  }

  const semanasDoAno = useMemo(() => gerarSemanasDoAno(ano), [ano]);

  const semanaSelecionada = useMemo(
    () =>
      semanasDoAno.find((s) => s.numero === numeroSemana) ?? semanasDoAno[0],
    [semanasDoAno, numeroSemana],
  );

  const diasDaSemana = useMemo(
    () => (semanaSelecionada ? gerarDiasUteis(semanaSelecionada.segunda) : []),
    [semanaSelecionada],
  );

  function cardapiosDoDia(diaISO: string) {
    return cardapios.filter((c) => c.dia === diaISO);
  }

  function irParaAno(novoAno: number) {
    setAno(novoAno);
    const semanas = gerarSemanasDoAno(novoAno);
    setNumeroSemana(semanas[0]?.numero ?? 1);
  }

  function voltarParaHoje() {
    const atual = semanaAtual();
    setAno(atual.ano);
    setNumeroSemana(atual.numeroSemana);
    setDiasExpandidos([]);
  }

  const ehSemanaAtual =
    ano === padrao.ano && numeroSemana === padrao.numeroSemana;

  const [exportando, setExportando] = useState(false);

  async function exportarPDF() {
    setExportando(true);

    try {
      const semanaTemAlgumCardapio = diasDaSemana.some(
        ({ iso }) => cardapiosDoDia(iso).length > 0,
      );

      const blocosDias = diasDaSemana
        .map(({ iso, nome }) => {
          const itensDoDia = cardapiosDoDia(iso);

          const refeicoes =
            itensDoDia.length === 0
              ? `<p>Sem cardápio cadastrado.</p>`
              : itensDoDia
                  .map(
                    (item) => `
                      <p><strong>${item.tipo}${item.favorito ? " ⭐" : ""}</strong></p>
                      <ul>
                        ${item.itens.map((comida) => `<li>${comida}</li>`).join("")}
                      </ul>
                    `,
                  )
                  .join("");

          return `
            <h2>${nome} · ${formatarDataBR(iso)}</h2>
            ${refeicoes}
          `;
        })
        .join("");

      const corpo = semanaTemAlgumCardapio
        ? blocosDias
        : `<p>Nenhum cardápio foi cadastrado para esta semana.</p>`;

      const html = `
        <html>
          <body>
            <h1>Cardápio da Semana ${numeroSemana}</h1>
            <p>
              ${formatarDataBR(diasDaSemana[0].iso)} a ${formatarDataBR(diasDaSemana[4].iso)} · ${ano}
            </p>
            ${corpo}
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const podeCompartilhar = await Sharing.isAvailableAsync();
      if (podeCompartilhar) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Cardápio - Semana ${numeroSemana}`,
        });
      } else {
        Alert.alert(
          "PDF gerado",
          "Não foi possível abrir o compartilhamento neste dispositivo.",
        );
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível exportar o cardápio em PDF");
    } finally {
      setExportando(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* SELETOR DE ANO */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#F5F5F5",
          padding: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => irParaAno(ano - 1)}
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 18 }}>◀</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "bold" }}>{ano}</Text>

        <TouchableOpacity
          onPress={() => irParaAno(ano + 1)}
          style={{ padding: 8 }}
        >
          <Text style={{ fontSize: 18 }}>▶</Text>
        </TouchableOpacity>
      </View>

      {/* SELETOR DE SEMANA (dropdown) */}
      <View style={{ padding: 16, paddingBottom: 0, gap: 10 }}>
        <TouchableOpacity
          onPress={() => setModalSemanaAberto(true)}
          style={{
            borderWidth: 1,
            borderColor: "#BDBDBD",
            borderRadius: 10,
            padding: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <View>
            <Text style={{ fontWeight: "700", fontSize: 16 }}>
              Semana {numeroSemana}
            </Text>
            {diasDaSemana.length > 0 && (
              <Text style={{ color: "#777", fontSize: 13 }}>
                {formatarDataBR(diasDaSemana[0].iso)} a{" "}
                {formatarDataBR(diasDaSemana[4].iso)}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 16 }}>▼</Text>
        </TouchableOpacity>

        {!ehSemanaAtual && (
          <TouchableOpacity onPress={voltarParaHoje}>
            <Text style={{ color: "#2E7D32", fontWeight: "600" }}>
              ↩ Voltar para semana atual
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={exportarPDF}
          disabled={exportando || diasDaSemana.length === 0}
          style={{
            backgroundColor: exportando ? "#EF9A9A" : "#C62828",
            borderRadius: 10,
            padding: 14,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
            {exportando ? "Gerando PDF..." : "📄 Exportar semana em PDF"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE DIAS DA SEMANA SELECIONADA */}
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        {loading ? (
          <Text style={{ color: "#888" }}>Carregando...</Text>
        ) : (
          diasDaSemana.map(({ iso, nome }) => {
            const itensDoDia = cardapiosDoDia(iso);
            const ehHoje = iso === hojeISO;
            const expandido = diasExpandidos.includes(iso);

            return (
              <View
                key={iso}
                style={{
                  backgroundColor: ehHoje ? "#A5D6A7" : "#EDEDED",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    setDiasExpandidos((prev) =>
                      expandido
                        ? prev.filter((d) => d !== iso)
                        : [...prev, iso],
                    )
                  }
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 15,
                  }}
                >
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: "bold" }}>
                      {nome} {ehHoje && "• Hoje"}
                    </Text>
                    <Text style={{ color: "#555", fontSize: 13 }}>
                      {formatarDataBR(iso)} ·{" "}
                      {itensDoDia.length === 0
                        ? "Sem cardápio"
                        : `${itensDoDia.length} refeição(ões)`}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18 }}>{expandido ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {expandido && (
                  <View
                    style={{
                      paddingHorizontal: 15,
                      paddingBottom: 15,
                      gap: 10,
                    }}
                  >
                    {itensDoDia.length === 0 ? (
                      <Text style={{ color: "#888" }}>
                        Nenhum cardápio cadastrado para este dia.
                      </Text>
                    ) : (
                      itensDoDia.map((item, i) => (
                        <View
                          key={i}
                          style={{
                            backgroundColor: "#fff",
                            padding: 12,
                            borderRadius: 8,
                            gap: 4,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ fontWeight: "600" }}>
                              {item.tipo}
                            </Text>
                            <TouchableOpacity
                              onPress={() =>
                                alternarFavorito(item.modeloId, item.favorito)
                              }
                              style={{ padding: 4 }}
                            >
                              <Text style={{ fontSize: 18 }}>
                                {item.favorito ? "⭐" : "☆"}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          {item.itens.map((comida, j) => (
                            <Text key={j}>• {comida}</Text>
                          ))}
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL COM LISTA DE TODAS AS SEMANAS DO ANO */}
      <Modal
        visible={modalSemanaAberto}
        animationType="slide"
        onRequestClose={() => setModalSemanaAberto(false)}
      >
        <View style={{ flex: 1, paddingTop: 50 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingBottom: 12,
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              Semanas de {ano}
            </Text>
            <TouchableOpacity onPress={() => setModalSemanaAberto(false)}>
              <Text style={{ fontSize: 16, color: "#1565C0" }}>Fechar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
            {semanasDoAno.map((s) => {
              const dias = gerarDiasUteis(s.segunda);
              const selecionada = s.numero === numeroSemana;
              const atual =
                ano === padrao.ano && s.numero === padrao.numeroSemana;

              return (
                <TouchableOpacity
                  key={s.numero}
                  onPress={() => {
                    setNumeroSemana(s.numero);
                    setDiasExpandidos([]);
                    setModalSemanaAberto(false);
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: selecionada ? "#2E7D32" : "#F5F5F5",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: selecionada ? "#fff" : "#333",
                      }}
                    >
                      Semana {s.numero} {atual && "• Atual"}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: selecionada ? "#E8F5E9" : "#777",
                      }}
                    >
                      {formatarDataBR(dias[0].iso)} a{" "}
                      {formatarDataBR(dias[4].iso)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
