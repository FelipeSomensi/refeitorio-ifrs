import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CabecalhoInstitucional from "../utils/CabecalhoInstitucional";
import { cores } from "../utils/tema";

type Usuario = {
  id: number;
  login: string;
  type: "aluno" | "servidor";
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meuId, setMeuId] = useState<number | null>(null);

  // form de cadastro
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");
  const [type, setType] = useState<"aluno" | "servidor">("aluno");

  // edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editLogin, setEditLogin] = useState("");
  const [editPwd, setEditPwd] = useState("");
  const [editType, setEditType] = useState<"aluno" | "servidor">("aluno");

  const [loading, setLoading] = useState(false);

  function decodificarMeuId(token: string) {
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      setMeuId(decoded.id);
    } catch (e) {
      setMeuId(null);
    }
  }

  async function carregarUsuarios() {
    const token = await AsyncStorage.getItem("token");
    if (token) decodificarMeuId(token);

    try {
      const resposta = await fetch("http://localhost:3000/usuarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resposta.json();
      if (resposta.ok) {
        setUsuarios(dados);
      } else {
        Alert.alert("Erro", dados.error);
      }
    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar os usuários");
    }
  }

  async function cadastrarUsuario() {
    if (!login.trim() || !pwd.trim()) {
      Alert.alert("Atenção", "Preencha login e senha.");
      return;
    }

    const token = await AsyncStorage.getItem("token");
    setLoading(true);

    try {
      const resposta = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ login, pwd, type }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      Alert.alert("Sucesso", dados.message);
      setLogin("");
      setPwd("");
      setType("aluno");
      carregarUsuarios();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível cadastrar o usuário");
    } finally {
      setLoading(false);
    }
  }

  function iniciarEdicao(usuario: Usuario) {
    setEditandoId(usuario.id);
    setEditLogin(usuario.login);
    setEditPwd("");
    setEditType(usuario.type);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditLogin("");
    setEditPwd("");
  }

  async function salvarEdicao(id: number) {
    const token = await AsyncStorage.getItem("token");

    const body: Record<string, string> = {
      login: editLogin,
      type: editType,
    };
    if (editPwd.trim()) body.pwd = editPwd;

    try {
      const resposta = await fetch(`http://localhost:3000/usuarios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        Alert.alert("Erro", dados.error);
        return;
      }

      Alert.alert("Sucesso", dados.message);
      cancelarEdicao();
      carregarUsuarios();
    } catch (e) {
      Alert.alert("Erro", "Não foi possível atualizar o usuário");
    }
  }

  async function excluirUsuario(usuario: Usuario) {
    Alert.alert("Confirmar", `Excluir o usuário "${usuario.login}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("token");
          try {
            const resposta = await fetch(
              `http://localhost:3000/usuarios/${usuario.id}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            const dados = await resposta.json();
            if (resposta.ok) {
              Alert.alert("Sucesso", dados.message);
              carregarUsuarios();
            } else {
              Alert.alert("Erro", dados.error);
            }
          } catch (e) {
            Alert.alert("Erro", "Não foi possível excluir o usuário");
          }
        },
      },
    ]);
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: cores.branco }}>
      <CabecalhoInstitucional subtitulo="Gerenciar Usuários (Admin)" />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* FORMULÁRIO DE CADASTRO */}
        <View
          style={{
            backgroundColor: cores.verdeClaro,
            padding: 16,
            borderRadius: 12,
            gap: 10,
          }}
        >
          <Text
            style={{ fontSize: 18, fontWeight: "600", color: cores.cinzaTexto }}
          >
            Cadastrar Usuário
          </Text>

          <TextInput
            placeholder="Login"
            value={login}
            onChangeText={setLogin}
            autoCapitalize="none"
            style={inputStyle}
          />

          <TextInput
            placeholder="Senha"
            value={pwd}
            onChangeText={setPwd}
            style={inputStyle}
          />

          <Text style={{ fontWeight: "500", color: cores.cinzaTexto }}>
            Tipo de usuário:
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setType("aluno")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor:
                  type === "aluno" ? cores.verdeEscuro : cores.branco,
                borderWidth: 1,
                borderColor: cores.verdeEscuro,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: type === "aluno" ? cores.branco : cores.verdeEscuro,
                }}
              >
                Aluno
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType("servidor")}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                backgroundColor:
                  type === "servidor" ? cores.verdeEscuro : cores.branco,
                borderWidth: 1,
                borderColor: cores.verdeEscuro,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: type === "servidor" ? cores.branco : cores.verdeEscuro,
                }}
              >
                Servidor (Admin)
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={cadastrarUsuario}
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
              {loading ? "Salvando..." : "Cadastrar Usuário"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE USUÁRIOS */}
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginTop: 8,
            color: cores.cinzaTexto,
          }}
        >
          Usuários Cadastrados
        </Text>

        {usuarios.length === 0 ? (
          <Text style={{ color: "#888" }}>Nenhum usuário cadastrado.</Text>
        ) : (
          usuarios.map((usuario) => {
            const souEu = usuario.id === meuId;
            const emEdicao = editandoId === usuario.id;

            return (
              <View
                key={usuario.id}
                style={{
                  backgroundColor: souEu
                    ? cores.favoritoFundo
                    : cores.cinzaClaro,
                  padding: 14,
                  borderRadius: 10,
                  gap: 8,
                }}
              >
                {emEdicao ? (
                  <>
                    <TextInput
                      placeholder="Login"
                      value={editLogin}
                      onChangeText={setEditLogin}
                      autoCapitalize="none"
                      style={inputStyle}
                    />
                    <TextInput
                      placeholder="Nova senha (deixe vazio para manter)"
                      value={editPwd}
                      onChangeText={setEditPwd}
                      style={inputStyle}
                    />
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => setEditType("aluno")}
                        style={{
                          flex: 1,
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor:
                            editType === "aluno"
                              ? cores.verdeEscuro
                              : cores.branco,
                          borderWidth: 1,
                          borderColor: cores.verdeEscuro,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              editType === "aluno"
                                ? cores.branco
                                : cores.verdeEscuro,
                          }}
                        >
                          Aluno
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditType("servidor")}
                        style={{
                          flex: 1,
                          padding: 8,
                          borderRadius: 8,
                          backgroundColor:
                            editType === "servidor"
                              ? cores.verdeEscuro
                              : cores.branco,
                          borderWidth: 1,
                          borderColor: cores.verdeEscuro,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color:
                              editType === "servidor"
                                ? cores.branco
                                : cores.verdeEscuro,
                          }}
                        >
                          Servidor
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => salvarEdicao(usuario.id)}
                        style={{
                          flex: 1,
                          backgroundColor: cores.verdePrincipal,
                          borderRadius: 8,
                          padding: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{ color: cores.branco, fontWeight: "700" }}
                        >
                          Salvar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={cancelarEdicao}
                        style={{
                          flex: 1,
                          backgroundColor: cores.cinzaTexto,
                          borderRadius: 8,
                          padding: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{ color: cores.branco, fontWeight: "700" }}
                        >
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontWeight: "bold",
                          fontSize: 16,
                          color: cores.cinzaTexto,
                        }}
                      >
                        {usuario.login} {souEu && "(você)"}
                      </Text>
                      <Text style={{ color: "#555" }}>
                        {usuario.type === "servidor"
                          ? "Servidor (Admin)"
                          : "Aluno"}
                      </Text>
                    </View>

                    {!souEu && (
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => iniciarEdicao(usuario)}
                          style={{
                            backgroundColor: cores.verdeMedio,
                            padding: 8,
                            borderRadius: 8,
                          }}
                        >
                          <Text>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => excluirUsuario(usuario)}
                          style={{
                            backgroundColor: cores.erroFundo,
                            padding: 8,
                            borderRadius: 8,
                          }}
                        >
                          <Text>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
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
