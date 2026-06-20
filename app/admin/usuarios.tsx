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
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>
        👤 Gerenciar Usuários
      </Text>

      {/* FORMULÁRIO DE CADASTRO */}
      <View
        style={{
          backgroundColor: "#EDE7F6",
          padding: 16,
          borderRadius: 12,
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "600" }}>
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

        <Text style={{ fontWeight: "500" }}>Tipo de usuário:</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={() => setType("aluno")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              backgroundColor: type === "aluno" ? "#7E57C2" : "#fff",
              borderWidth: 1,
              borderColor: "#7E57C2",
              alignItems: "center",
            }}
          >
            <Text style={{ color: type === "aluno" ? "#fff" : "#7E57C2" }}>
              Aluno
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setType("servidor")}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 8,
              backgroundColor: type === "servidor" ? "#7E57C2" : "#fff",
              borderWidth: 1,
              borderColor: "#7E57C2",
              alignItems: "center",
            }}
          >
            <Text style={{ color: type === "servidor" ? "#fff" : "#7E57C2" }}>
              Servidor (Admin)
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={loading ? "Salvando..." : "Cadastrar Usuário"}
          onPress={cadastrarUsuario}
          disabled={loading}
          color="#5E35B1"
        />
      </View>

      {/* LISTA DE USUÁRIOS */}
      <Text style={{ fontSize: 18, fontWeight: "600", marginTop: 8 }}>
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
                backgroundColor: souEu ? "#FFF9C4" : "#F5F5F5",
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
                          editType === "aluno" ? "#7E57C2" : "#fff",
                        borderWidth: 1,
                        borderColor: "#7E57C2",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: editType === "aluno" ? "#fff" : "#7E57C2",
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
                          editType === "servidor" ? "#7E57C2" : "#fff",
                        borderWidth: 1,
                        borderColor: "#7E57C2",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: editType === "servidor" ? "#fff" : "#7E57C2",
                        }}
                      >
                        Servidor
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Salvar"
                        onPress={() => salvarEdicao(usuario.id)}
                        color="#2E7D32"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Cancelar"
                        onPress={cancelarEdicao}
                        color="#757575"
                      />
                    </View>
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
                    <Text style={{ fontWeight: "bold", fontSize: 16 }}>
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
                          backgroundColor: "#BBDEFB",
                          padding: 8,
                          borderRadius: 8,
                        }}
                      >
                        <Text>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => excluirUsuario(usuario)}
                        style={{
                          backgroundColor: "#FFCDD2",
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
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#D1C4E9",
  borderRadius: 8,
  padding: 10,
  backgroundColor: "#fff",
  fontSize: 15,
};
