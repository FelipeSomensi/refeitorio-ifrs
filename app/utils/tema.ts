// utils/tema.ts
// Paleta de cores institucional, extraída do portal do IFRS
// (Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Sul).
// Centralizar aqui evita cores "soltas" espalhadas pelos componentes.

export const cores = {
  // Verdes institucionais
  verdeEscuro: "#0B6C1D", // faixas de navegação, cabeçalhos, botões de destaque
  verdePrincipal: "#15842A", // fundo principal de cabeçalho, botões primários
  verdeClaro: "#E8F5E9", // fundos suaves, destaque de "hoje"/selecionado
  verdeMedio: "#A5D6A7", // destaque intermediário (ex: dia atual em listas)

  // Neutros
  branco: "#FFFFFF",
  cinzaTexto: "#343A40", // texto secundário, ações neutras
  cinzaClaro: "#F5F5F5", // fundos de cartão neutro
  cinzaBorda: "#E0E0E0",

  // Estados
  erro: "#C62828",
  erroFundo: "#FFCDD2",
  aviso: "#E65100",
  avisoFundo: "#FFF3E0",
  favorito: "#F9A825",
  favoritoFundo: "#FFF8E1",
};

export const fonteTamanhos = {
  titulo: 24,
  subtitulo: 18,
  corpo: 15,
  legenda: 13,
};

// Texto institucional curto, usado no cabeçalho/rodapé do app
export const instituicao = {
  nomeCompleto:
    "Instituto Federal de Educação, Ciência e Tecnologia do Rio Grande do Sul",
  sigla: "IFRS",
  campus: "Campus Bento Gonçalves",
};
