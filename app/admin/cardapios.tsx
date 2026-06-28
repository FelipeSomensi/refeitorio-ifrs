import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CabecalhoInstitucional from "../utils/CabecalhoInstitucional";
import {
  formatarDataBR,
  gerarDiasUteis,
  gerarSemanasDoAno,
  semanaAtual,
} from "../utils/semanas";
import { cores } from "../utils/tema";

type Modelo = {
  id: number;
  tipo: string;
  itens: string[];
};

type CardapioCompleto = {
  dia: string;
  modeloId: number;
  tipo: string;
  itens: string[];
};

const TIPOS_DISPONIVEIS = ["Café da Manhã", "Almoço", "Jantar"];

export default function AdminCardapios() {
  const [cardapios, setCardapios] = useState<CardapioCompleto[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);

  // --- Formulário de atribuição ---
  const [dia, setDia] = useState("");
  const [modo, setModo] = useState<"existente" | "novo">("existente");

  // modo "existente"
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<number | null>(
    null,
  );
  const [modalModeloAberto, setModalModeloAberto] = useState(false);

  // modo "novo"
  const [novoTipo, setNovoTipo] = useState(TIPOS_DISPONIVEIS[0]);
  const [novosItensTexto, setNovosItensTexto] = useState("");

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  // confirmação de remoção (modal próprio, em vez de Alert.alert, que não
  // funciona de forma confiável no Expo Web)
  const [itemParaRemover, setItemParaRemover] =
    useState<CardapioCompleto | null>(null);
  const [removendo, setRemovendo] = useState(false);

  // navegação de ano/semana para a LISTAGEM
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
      setErro("Não foi possível carregar os cardápios.");
    }
  }

  async function carregarModelos() {
    const token = await AsyncStorage.getItem("token");
    try {
      const resposta = await fetch("http://localhost:3000/modelos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resposta.json();
      if (resposta.ok) setModelos(dados);
    } catch (e) {
      setErro("Não foi possível carregar os modelos de cardápio.");
    }
  }

  async function atribuirCardapio() {
    setSucesso("");
    setErro("");

    if (!dia) {
      setErro("Informe o dia.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
      setErro("Data deve estar no formato AAAA-MM-DD.");
      return;
    }

    const token = await AsyncStorage.getItem("token");
    setLoading(true);

    try {
      let modeloId = modeloSelecionadoId;

      // MODO "NOVO": cria o modelo primeiro
      if (modo === "novo") {
        if (!novoTipo.trim() || !novosItensTexto.trim()) {
          setErro("Preencha tipo e itens do novo cardápio.");
          setLoading(false);
          return;
        }

        const itens = novosItensTexto
          .split(",")
          .map((i) => i.trim())
          .filter((i) => i.length > 0);

        if (itens.length === 0) {
          setErro("Informe ao menos um item.");
          setLoading(false);
          return;
        }

        const respostaModelo = await fetch("http://localhost:3000/modelos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ tipo: novoTipo, itens }),
        });

        const dadosModelo = await respostaModelo.json();

        if (!respostaModelo.ok) {
          setErro(dadosModelo.error || "Não foi possível criar o cardápio.");
          setLoading(false);
          return;
        }

        modeloId = dadosModelo.modelo.id;
        setModelos((prev) => [...prev, dadosModelo.modelo]);
      }

      // MODO "EXISTENTE": precisa ter selecionado um modelo
      if (modo === "existente" && !modeloId) {
        setErro("Selecione um cardápio existente para reutilizar.");
        setLoading(false);
        return;
      }

      // Atribui o modelo (novo ou existente) ao dia
      const respostaAtribuicao = await fetch("http://localhost:3000/cardapio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dia, modeloId }),
      });

      const dadosAtribuicao = await respostaAtribuicao.json();

      if (!respostaAtribuicao.ok) {
        setErro(
          dadosAtribuicao.error || "Não foi possível atribuir o cardápio.",
        );
        return;
      }

      setSucesso("Cardápio adicionado!");
      setTimeout(() => setSucesso(""), 3000);
      setDia("");
      setModeloSelecionadoId(null);
      setNovoTipo(TIPOS_DISPONIVEIS[0]);
      setNovosItensTexto("");
      carregarCardapios();
    } catch (e) {
      setErro("Não foi possível atribuir o cardápio.");
    } finally {
      setLoading(false);
    }
  }

  function removerAtribuicao(item: CardapioCompleto) {
    setItemParaRemover(item);
  }

  async function confirmarRemocao() {
    if (!itemParaRemover) return;

    setRemovendo(true);
    setErro("");

    const token = await AsyncStorage.getItem("token");
    try {
      const resposta = await fetch("http://localhost:3000/cardapio", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dia: itemParaRemover.dia,
          modeloId: itemParaRemover.modeloId,
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.error || "Não foi possível remover o cardápio.");
        return;
      }

      // Remove imediatamente da lista local (não depende só do reload)
      setCardapios((prev) =>
        prev.filter(
          (c) =>
            !(
              c.dia === itemParaRemover.dia &&
              c.modeloId === itemParaRemover.modeloId
            ),
        ),
      );

      setSucesso("Cardápio removido!");
      setTimeout(() => setSucesso(""), 3000);
      setItemParaRemover(null);

      // Garante consistência com o servidor
      carregarCardapios();
    } catch (e) {
      setErro("Não foi possível remover o cardápio.");
    } finally {
      setRemovendo(false);
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

  const modeloSelecionado = useMemo(
    () => modelos.find((m) => m.id === modeloSelecionadoId) ?? null,
    [modelos, modeloSelecionadoId],
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
    carregarModelos();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: cores.branco }}>
      <CabecalhoInstitucional subtitulo="Gerenciar Cardápios (Admin)" />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* FORMULÁRIO DE ATRIBUIÇÃO */}
        <View
          style={{
            backgroundColor: cores.verdeClaro,
            padding: 16,
            borderRadius: 12,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            Atribuir Cardápio a um Dia
          </Text>

          <TextInput
            placeholder="Data (AAAA-MM-DD)"
            value={dia}
            onChangeText={setDia}
            style={inputStyle}
          />

          {/* TOGGLE: existente vs novo */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setModo("existente")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor:
                  modo === "existente" ? cores.verdeEscuro : cores.branco,
                borderWidth: 1,
                borderColor: cores.verdeEscuro,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color:
                    modo === "existente" ? cores.branco : cores.verdeEscuro,
                }}
              >
                Reutilizar existente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModo("novo")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor:
                  modo === "novo" ? cores.verdeEscuro : cores.branco,
                borderWidth: 1,
                borderColor: cores.verdeEscuro,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: modo === "novo" ? cores.branco : cores.verdeEscuro,
                }}
              >
                Criar novo
              </Text>
            </TouchableOpacity>
          </View>

          {/* MODO EXISTENTE: seletor de modelo salvo */}
          {modo === "existente" && (
            <TouchableOpacity
              onPress={() => setModalModeloAberto(true)}
              style={{
                borderWidth: 1,
                borderColor: cores.verdeMedio,
                borderRadius: 8,
                padding: 12,
                backgroundColor: cores.branco,
              }}
            >
              {modeloSelecionado ? (
                <View>
                  <Text style={{ fontWeight: "600" }}>
                    {modeloSelecionado.tipo}
                  </Text>
                  <Text style={{ color: "#555", fontSize: 13 }}>
                    {modeloSelecionado.itens.join(", ")}
                  </Text>
                </View>
              ) : (
                <Text style={{ color: "#888" }}>
                  Toque para escolher um cardápio salvo...
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* MODO NOVO: campos de criação */}
          {modo === "novo" && (
            <>
              <Text style={{ fontWeight: "500", color: cores.cinzaTexto }}>
                Tipo de refeição:
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {TIPOS_DISPONIVEIS.map((tipoOpcao) => {
                  const selecionado = novoTipo === tipoOpcao;
                  return (
                    <TouchableOpacity
                      key={tipoOpcao}
                      onPress={() => setNovoTipo(tipoOpcao)}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 4,
                        borderRadius: 8,
                        backgroundColor: selecionado
                          ? cores.verdeEscuro
                          : cores.branco,
                        borderWidth: 1,
                        borderColor: cores.verdeEscuro,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: selecionado ? cores.branco : cores.verdeEscuro,
                          fontSize: 13,
                          textAlign: "center",
                        }}
                      >
                        {tipoOpcao}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                placeholder="Itens separados por vírgula (ex: Arroz, Feijão, Frango)"
                value={novosItensTexto}
                onChangeText={setNovosItensTexto}
                multiline
                style={[
                  inputStyle,
                  { minHeight: 80, textAlignVertical: "top" },
                ]}
              />
            </>
          )}

          <TouchableOpacity
            onPress={atribuirCardapio}
            disabled={loading}
            style={{
              backgroundColor: loading
                ? cores.verdeMedio
                : cores.verdePrincipal,
              borderRadius: 10,
              padding: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: cores.branco, fontWeight: "700", fontSize: 15 }}
            >
              {loading ? "Salvando..." : "Atribuir Cardápio"}
            </Text>
          </TouchableOpacity>

          {sucesso && (
            <View
              style={{
                backgroundColor: cores.verdeMedio,
                borderRadius: 8,
                padding: 10,
              }}
            >
              <Text
                style={{
                  color: cores.verdeEscuro,
                  fontWeight: "600",
                  textAlign: "center",
                }}
              >
                ✓ {sucesso}
              </Text>
            </View>
          )}

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
        </View>

        {/* NAVEGAÇÃO DE ANO E SEMANA */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginTop: 8,
            color: cores.cinzaTexto,
          }}
        >
          Cardápios Cadastrados
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: cores.cinzaClaro,
            borderRadius: 10,
            padding: 10,
          }}
        >
          <TouchableOpacity
            onPress={() => irParaAno(ano - 1)}
            style={{ padding: 6 }}
          >
            <Text style={{ fontSize: 16, color: cores.cinzaTexto }}>◀</Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "bold",
              color: cores.cinzaTexto,
            }}
          >
            {ano}
          </Text>
          <TouchableOpacity
            onPress={() => irParaAno(ano + 1)}
            style={{ padding: 6 }}
          >
            <Text style={{ fontSize: 16, color: cores.cinzaTexto }}>▶</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => setModalSemanaAberto(true)}
          style={{
            borderWidth: 1,
            borderColor: cores.cinzaBorda,
            borderRadius: 10,
            padding: 14,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: cores.branco,
          }}
        >
          <View>
            <Text
              style={{
                fontWeight: "700",
                fontSize: 16,
                color: cores.cinzaTexto,
              }}
            >
              Semana {numeroSemana}
            </Text>
            {diasDaSemana.length > 0 && (
              <Text style={{ color: "#777", fontSize: 13 }}>
                {formatarDataBR(diasDaSemana[0].iso)} a{" "}
                {formatarDataBR(diasDaSemana[4].iso)}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 16, color: cores.cinzaTexto }}>▼</Text>
        </TouchableOpacity>

        {!ehSemanaAtual && (
          <TouchableOpacity onPress={voltarParaHoje}>
            <Text style={{ color: cores.verdeEscuro, fontWeight: "600" }}>
              ↩ Voltar para semana atual
            </Text>
          </TouchableOpacity>
        )}

        {cardapiosDaSemana.length === 0 ? (
          <Text style={{ color: "#888" }}>
            Nenhum cardápio atribuído para esta semana.
          </Text>
        ) : (
          cardapiosDaSemana.map((item, index) => (
            <View
              key={index}
              style={{
                backgroundColor: cores.cinzaClaro,
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
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontWeight: "bold",
                      fontSize: 16,
                      color: cores.cinzaTexto,
                    }}
                  >
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
                  onPress={() => removerAtribuicao(item)}
                  style={{
                    backgroundColor: cores.erroFundo,
                    padding: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: cores.erro, fontWeight: "bold" }}>
                    🗑️
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* MODAL: CONFIRMAR REMOÇÃO */}
        <Modal
          visible={itemParaRemover !== null}
          animationType="fade"
          transparent
          onRequestClose={() => setItemParaRemover(null)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.4)",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: cores.branco,
                borderRadius: 12,
                padding: 20,
                gap: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: cores.cinzaTexto,
                }}
              >
                Remover cardápio?
              </Text>

              {itemParaRemover && (
                <Text style={{ color: "#555", fontSize: 14 }}>
                  Remover {itemParaRemover.tipo} do dia{" "}
                  {formatarDataBR(itemParaRemover.dia)}? O modelo continua salvo
                  para reutilizar depois.
                </Text>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setItemParaRemover(null)}
                  disabled={removendo}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: cores.cinzaBorda,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: cores.cinzaTexto, fontWeight: "600" }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={confirmarRemocao}
                  disabled={removendo}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: removendo ? cores.erroFundo : cores.erro,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: cores.branco, fontWeight: "700" }}>
                    {removendo ? "Removendo..." : "Remover"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL: ESCOLHER MODELO EXISTENTE */}
        <Modal
          visible={modalModeloAberto}
          animationType="slide"
          onRequestClose={() => setModalModeloAberto(false)}
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
                Cardápios Salvos
              </Text>
              <TouchableOpacity onPress={() => setModalModeloAberto(false)}>
                <Text style={{ fontSize: 16, color: cores.verdeEscuro }}>
                  Fechar
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
              {modelos.length === 0 ? (
                <Text style={{ color: "#888" }}>
                  Nenhum cardápio salvo ainda. Crie um novo para começar.
                </Text>
              ) : (
                // Agrupa visualmente por tipo (Almoço, Jantar, ...)
                Object.entries(
                  modelos.reduce<Record<string, Modelo[]>>((grupos, m) => {
                    if (!grupos[m.tipo]) grupos[m.tipo] = [];
                    grupos[m.tipo].push(m);
                    return grupos;
                  }, {}),
                ).map(([tipo, lista]) => (
                  <View key={tipo} style={{ gap: 8, marginBottom: 12 }}>
                    <Text
                      style={{
                        fontWeight: "700",
                        fontSize: 15,
                        color: cores.verdeEscuro,
                      }}
                    >
                      {tipo}
                    </Text>
                    {lista.map((m) => {
                      const selecionado = m.id === modeloSelecionadoId;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          onPress={() => {
                            setModeloSelecionadoId(m.id);
                            setModalModeloAberto(false);
                          }}
                          style={{
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: selecionado
                              ? cores.verdeEscuro
                              : cores.cinzaClaro,
                          }}
                        >
                          <Text
                            style={{
                              color: selecionado ? cores.branco : "#333",
                              fontSize: 13,
                            }}
                          >
                            {m.itens.join(", ")}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* MODAL: TODAS AS SEMANAS DO ANO */}
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
                <Text style={{ fontSize: 16, color: cores.verdeEscuro }}>
                  Fechar
                </Text>
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
                      backgroundColor: selecionada
                        ? cores.verdeEscuro
                        : cores.cinzaClaro,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontWeight: "700",
                          color: selecionada ? cores.branco : "#333",
                        }}
                      >
                        Semana {s.numero} {atual && "• Atual"}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: selecionada ? cores.verdeClaro : "#777",
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
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: cores.verdeMedio,
  borderRadius: 8,
  padding: 10,
  backgroundColor: cores.branco,
  fontSize: 15,
};
