import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  formatarDataBR,
  gerarDiasUteis,
  gerarSemanasDoAno,
  semanaAtual,
} from "../utils/semanas";

type Cardapio = {
  dia: string;
  tipo: string;
  itens: string[];
};

export default function AdminCardapios() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [dia, setDia] = useState("");
  const [tipo, setTipo] = useState("");
  const [itensTexto, setItensTexto] = useState(""); // itens separados por vírgula
  const [loading, setLoading] = useState(false);

  // navegação de ano/semana para a LISTAGEM de cardápios cadastrados
  const padrao = semanaAtual();
  const [ano, setAno] = useState(padrao.ano);
  const [numeroSemana, setNumeroSemana] = useState(padrao.numeroSemana);
  const [modalSemanaAberto, setModalSemanaAberto] = useState(false);

  async function carregarCardapios() {
    const token = await AsyncStorage.getItem("token");
    try {
      const resposta = await fetch("http://localhost:3000/cardapio", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resposta.json();
      if (resposta.ok) setCardapios(dados);
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os cardápios");
    }
  }

  async function cadastrarCardapio() {
    if (!dia || !tipo || !itensTexto.trim()) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    // Valida formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
      Alert.alert("Atenção", "Data deve estar no formato AAAA-MM-DD");
      return;
    }

    const itens = itensTexto
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (itens.length === 0) {
      Alert.alert("Atenção", "Informe ao menos um item.");
      return;
    }

    const token = await AsyncStorage.getItem("token");
    setLoading(true);

    try {
      const resposta = await fetch("http://localhost:3000/cardapio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dia, tipo, itens }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      Alert.alert("Sucesso", dados.message);
      setDia("");
      setTipo("");
      setItensTexto("");
      carregarCardapios();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível cadastrar o cardápio");
    } finally {
      setLoading(false);
    }
  }

  async function removerCardapio(item: Cardapio) {
    Alert.alert(
      "Confirmar",
      `Remover cardápio de ${item.dia} (${item.tipo})?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const token = await AsyncStorage.getItem("token");
            try {
              const resposta = await fetch("http://localhost:3000/cardapio", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ dia: item.dia, tipo: item.tipo }),
              });
              const dados = await resposta.json();
              if (resposta.ok) {
                Alert.alert("Sucesso", dados.message);
                carregarCardapios();
              } else {
                Alert.alert("Erro", dados.error);
              }
            } catch (e) {
              Alert.alert("Erro", "Não foi possível remover");
            }
          },
        },
      ],
    );
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

  const isosDaSemana = useMemo(
    () => diasDaSemana.map((d) => d.iso),
    [diasDaSemana],
  );

  const cardapiosDaSemana = useMemo(
    () =>
      [...cardapios]
        .filter((c) => isosDaSemana.includes(c.dia))
        .sort((a, b) => a.dia.localeCompare(b.dia)),
    [cardapios, isosDaSemana],
  );

  function irParaAno(novoAno: number) {
    setAno(novoAno);
    const semanas = gerarSemanasDoAno(novoAno);
    setNumeroSemana(semanas[0]?.numero ?? 1);
  }

  function voltarParaHoje() {
    const atual = semanaAtual();
    setAno(atual.ano);
    setNumeroSemana(atual.numeroSemana);
  }

  const ehSemanaAtual =
    ano === padrao.ano && numeroSemana === padrao.numeroSemana;

  useEffect(() => {
    carregarCardapios();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        ⚙️ Gerenciar Cardápios
      </Text>

      {/* FORMULÁRIO DE CADASTRO */}
      <View
        style={{
          backgroundColor: "#E3F2FD",
          padding: 16,
          borderRadius: 12,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
          Cadastrar Cardápio
        </Text>

        <TextInput
          placeholder="Data (AAAA-MM-DD)"
          value={dia}
          onChangeText={setDia}
          style={inputStyle}
        />

        <TextInput
          placeholder="Tipo (ex: Almoço, Jantar)"
          value={tipo}
          onChangeText={setTipo}
          style={inputStyle}
        />

        <TextInput
          placeholder="Itens separados por vírgula (ex: Arroz, Feijão, Frango)"
          value={itensTexto}
          onChangeText={setItensTexto}
          multiline
          style={[inputStyle, { minHeight: 80, textAlignVertical: "top" }]}
        />

        <Button
          title={loading ? "Salvando..." : "Cadastrar Cardápio"}
          onPress={cadastrarCardapio}
          disabled={loading}
          color="#1565C0"
        />
      </View>

      {/* NAVEGAÇÃO DE ANO E SEMANA */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 8 }}>
        Cardápios Cadastrados
      </Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#F5F5F5",
          borderRadius: 10,
          padding: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => irParaAno(ano - 1)}
          style={{ padding: 6 }}
        >
          <Text style={{ fontSize: 16 }}>◀</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: "bold" }}>{ano}</Text>
        <TouchableOpacity
          onPress={() => irParaAno(ano + 1)}
          style={{ padding: 6 }}
        >
          <Text style={{ fontSize: 16 }}>▶</Text>
        </TouchableOpacity>
      </View>

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

      {cardapiosDaSemana.length === 0 ? (
        <Text style={{ color: "#888" }}>
          Nenhum cardápio cadastrado para esta semana.
        </Text>
      ) : (
        cardapiosDaSemana.map((item, index) => (
          <View
            key={index}
            style={{
              backgroundColor: "#F5F5F5",
              padding: 14,
              borderRadius: 10,
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
              <View>
                <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                  {formatarDataBR(item.dia)}
                </Text>
                <Text style={{ color: "#555", marginBottom: 4 }}>
                  {item.tipo}
                </Text>
                {item.itens.map((comida, i) => (
                  <Text key={i} style={{ color: "#333" }}>
                    • {comida}
                  </Text>
                ))}
              </View>

              <TouchableOpacity
                onPress={() => removerCardapio(item)}
                style={{
                  backgroundColor: "#FFCDD2",
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#C62828", fontWeight: "bold" }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* MODAL COM TODAS AS SEMANAS DO ANO */}
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
                    setModalSemanaAberto(false);
                  }}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    backgroundColor: selecionada ? "#1565C0" : "#F5F5F5",
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
                        color: selecionada ? "#E3F2FD" : "#777",
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
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#BBDEFB",
  borderRadius: 8,
  padding: 10,
  backgroundColor: "#fff",
  fontSize: 15,
};
