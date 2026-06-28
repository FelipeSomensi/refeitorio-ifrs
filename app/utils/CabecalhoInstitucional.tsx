import { Text, View } from "react-native";
import { cores, instituicao } from "./tema";

type Props = {
  subtitulo?: string; // ex: "Cardápios da Semana"
};

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
      <View>
        <Text style={{ color: cores.branco, fontSize: 11, opacity: 0.9 }}>
          {instituicao.sigla} · {instituicao.campus}
        </Text>
        <Text style={{ color: cores.branco, fontSize: 18, fontWeight: "700" }}>
          Cardápio Estudantil
        </Text>
      </View>

      {subtitulo && (
        <Text style={{ color: cores.branco, fontSize: 13, opacity: 0.9 }}>
          {subtitulo}
        </Text>
      )}
    </View>
  );
}
