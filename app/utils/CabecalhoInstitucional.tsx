import { Text, View } from "react-native";
import { cores, instituicao } from "./tema";

type Props = {
  subtitulo?: string; // ex: "Cardápios da Semana"
};

// Mini "logo" do IFRS recriado com Views (4 quadrados + 1 círculo),
// inspirado no ícone do portal oficial — sem usar a imagem original.
function LogoIFRS() {
  const tamanho = 9;
  const gap = 3;

  return (
    <View style={{ width: tamanho * 2 + gap, height: tamanho * 2 + gap }}>
      <View style={{ flexDirection: "row", gap }}>
        <View
          style={{
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            backgroundColor: cores.branco,
          }}
        />
        <View
          style={{
            width: tamanho,
            height: tamanho,
            backgroundColor: cores.branco,
          }}
        />
      </View>
      <View style={{ flexDirection: "row", gap, marginTop: gap }}>
        <View
          style={{
            width: tamanho,
            height: tamanho,
            backgroundColor: cores.branco,
          }}
        />
        <View
          style={{
            width: tamanho,
            height: tamanho,
            backgroundColor: cores.branco,
          }}
        />
      </View>
    </View>
  );
}

export default function CabecalhoInstitucional({ subtitulo }: Props) {
  return (
    <View
      style={{
        backgroundColor: cores.verdePrincipal,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 14,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <LogoIFRS />
        <View>
          <Text style={{ color: cores.branco, fontSize: 11, opacity: 0.9 }}>
            {instituicao.sigla} · {instituicao.campus}
          </Text>
          <Text
            style={{ color: cores.branco, fontSize: 18, fontWeight: "700" }}
          >
            Cardápio Estudantil
          </Text>
        </View>
      </View>

      {subtitulo && (
        <Text style={{ color: cores.branco, fontSize: 13, opacity: 0.9 }}>
          {subtitulo}
        </Text>
      )}
    </View>
  );
}
