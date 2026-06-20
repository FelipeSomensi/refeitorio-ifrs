import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    Alert,
    Button,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

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

      {/* LISTA DE CARDÁPIOS */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 8 }}>
        Cardápios Cadastrados
      </Text>

      {cardapios.length === 0 ? (
        <Text style={{ color: "#888" }}>Nenhum cardápio cadastrado.</Text>
      ) : (
        [...cardapios]
          .sort((a, b) => a.dia.localeCompare(b.dia))
          .map((item, index) => (
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
                    {item.dia}
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
                  <Text style={{ color: "#C62828", fontWeight: "bold" }}>
                    🗑️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
      )}
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
