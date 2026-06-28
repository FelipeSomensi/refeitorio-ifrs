import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { cores, instituicao } from "./utils/tema";

export default function Index() {
  const [login, setLogin] = useState("");
  const [pwd, setPwd] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  // Sempre que essa tela voltar a ficar em foco (ex: ao deslogar e retornar
  // ao login), limpa os campos e qualquer mensagem de erro antiga.
  useFocusEffect(
    useCallback(() => {
      setLogin("");
      setPwd("");
      setErro("");
    }, []),
  );

  async function fazerLogin() {
    setErro("");

    if (!login.trim() || !pwd.trim()) {
      setErro("Preencha login e senha.");
      return;
    }

    setEntrando(true);
    try {
      const resposta = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, pwd }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.error || "Login ou senha inválidos.");
        return;
      }

      await AsyncStorage.setItem("token", dados.token);
      await AsyncStorage.setItem("userType", dados.type); // salva o tipo do usuário

      router.push("/menu");
    } catch (e) {
      setErro("Não foi possível conectar ao servidor.");
    } finally {
      setEntrando(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.branco }}>
      {/* FAIXA INSTITUCIONAL */}
      <View
        style={{
          backgroundColor: cores.verdePrincipal,
          paddingTop: 56,
          paddingBottom: 28,
          paddingHorizontal: 24,
          alignItems: "center",
          gap: 4,
        }}
      >
        <Text style={{ color: cores.branco, fontSize: 12, opacity: 0.9 }}>
          {instituicao.sigla} · {instituicao.campus}
        </Text>
        <Text style={{ color: cores.branco, fontSize: 22, fontWeight: "700" }}>
          Cardápio Estudantil
        </Text>
      </View>

      {/* FORMULÁRIO */}
      <View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 12 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 8,
            color: cores.cinzaTexto,
          }}
        >
          Faça seu login
        </Text>

        <TextInput
          placeholder="Login"
          value={login}
          onChangeText={(texto) => {
            setLogin(texto);
            setErro("");
          }}
          autoCapitalize="none"
          style={{
            borderWidth: 1,
            borderColor: cores.cinzaBorda,
            borderRadius: 8,
            padding: 12,
          }}
        />

        <TextInput
          placeholder="Senha"
          value={pwd}
          onChangeText={(texto) => {
            setPwd(texto);
            setErro("");
          }}
          secureTextEntry
          style={{
            borderWidth: 1,
            borderColor: cores.cinzaBorda,
            borderRadius: 8,
            padding: 12,
          }}
        />

        {erro && (
          <View
            style={{
              backgroundColor: cores.erroFundo,
              borderRadius: 8,
              padding: 10,
            }}
          >
            <Text style={{ color: cores.erro, fontSize: 13 }}>{erro}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={fazerLogin}
          disabled={entrando}
          style={{
            backgroundColor: entrando ? cores.verdeMedio : cores.verdePrincipal,
            borderRadius: 8,
            padding: 14,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text
            style={{ color: cores.branco, fontWeight: "700", fontSize: 15 }}
          >
            {entrando ? "Entrando..." : "Entrar"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* RODAPÉ INSTITUCIONAL */}
      <View style={{ padding: 16, alignItems: "center" }}>
        <Text
          style={{ fontSize: 11, color: cores.cinzaTexto, textAlign: "center" }}
        >
          {instituicao.nomeCompleto}
        </Text>
      </View>
    </View>
  );
}
