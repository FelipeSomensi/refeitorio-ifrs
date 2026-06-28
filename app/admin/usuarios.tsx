import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Modal,
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
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  // confirmação de exclusão (modal próprio, em vez de Alert.alert, que não
  // funciona de forma confiável no Expo Web)
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<Usuario | null>(
    null,
  );
  const [excluindo, setExcluindo] = useState(false);

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
        setErro(dados.error || "Não foi possível carregar os usuários.");
      }
    } catch (e) {
      setErro("Não foi possível carregar os usuários.");
    }
  }

  async function cadastrarUsuario() {
    setErro("");
    setSucesso("");

    if (!login.trim() || !pwd.trim()) {
      setErro("Preencha login e senha.");
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
        setErro(dados.error || "Não foi possível cadastrar o usuário.");
        return;
      }

      setSucesso("Usuário cadastrado!");
      setTimeout(() => setSucesso(""), 3000);
      setLogin("");
      setPwd("");
      setType("aluno");
      carregarUsuarios();
    } catch (e) {
      setErro("Não foi possível cadastrar o usuário.");
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
    setErro("");
    setSucesso("");

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
        setErro(dados.error || "Não foi possível atualizar o usuário.");
        return;
      }

      setSucesso("Usuário atualizado!");
      setTimeout(() => setSucesso(""), 3000);
      cancelarEdicao();
      carregarUsuarios();
    } catch (e) {
      setErro("Não foi possível atualizar o usuário.");
    }
  }

  function excluirUsuario(usuario: Usuario) {
    setUsuarioParaExcluir(usuario);
  }

  async function confirmarExclusao() {
    if (!usuarioParaExcluir) return;

    setExcluindo(true);
    setErro("");

    const token = await AsyncStorage.getItem("token");
    try {
      const resposta = await fetch(
        `http://localhost:3000/usuarios/${usuarioParaExcluir.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.error || "Não foi possível excluir o usuário.");
        return;
      }

      // Remove imediatamente da lista local (não depende só do reload)
      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioParaExcluir.id));

      setSucesso("Usuário excluído!");
      setTimeout(() => setSucesso(""), 3000);
      setUsuarioParaExcluir(null);

      // Garante consistência com o servidor
      carregarUsuarios();
    } catch (e) {
      setErro("Não foi possível excluir o usuário.");
    } finally {
      setExcluindo(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: cores.branco }}>
      <CabecalhoInstitucional subtitulo="Gerenciar Usuários (Admin)" />

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
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

        {/* MODAL: CONFIRMAR EXCLUSÃO */}
        <Modal
          visible={usuarioParaExcluir !== null}
          animationType="fade"
          transparent
          onRequestClose={() => setUsuarioParaExcluir(null)}
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
                Excluir usuário?
              </Text>

              {usuarioParaExcluir && (
                <Text style={{ color: "#555", fontSize: 14 }}>
                  Tem certeza que deseja excluir o usuário
                  {usuarioParaExcluir.login} ? Essa ação não pode ser desfeita.
                </Text>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setUsuarioParaExcluir(null)}
                  disabled={excluindo}
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
                  onPress={confirmarExclusao}
                  disabled={excluindo}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: excluindo ? cores.erroFundo : cores.erro,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: cores.branco, fontWeight: "700" }}>
                    {excluindo ? "Excluindo..." : "Excluir"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
