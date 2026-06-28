// Atribuições de modelos de cardápio a dias específicos.
// O conteúdo real (tipo + itens) está em modelos.js — aqui só vinculamos
// qual modelo (modeloId) vale para qual dia.
// Datas abaixo cobrem a semana atual (segunda 22/06 a sexta 26/06/2026).
module.exports = [
  { dia: "2026-06-22", modeloId: 4 }, // Café da Manhã (Pão com manteiga...)
  { dia: "2026-06-22", modeloId: 1 }, // Almoço (Arroz, Feijão...)
  { dia: "2026-06-22", modeloId: 3 }, // Jantar (Sopa...)

  { dia: "2026-06-23", modeloId: 5 }, // Café da Manhã (Bolo simples...)
  { dia: "2026-06-23", modeloId: 2 }, // Almoço (Macarrão...)
  { dia: "2026-06-23", modeloId: 7 }, // Jantar (Omelete...)

  { dia: "2026-06-29", modeloId: 4 }, // Café da Manhã (Pão com manteiga...)
  { dia: "2026-06-29", modeloId: 6 }, // Almoço (Arroz integral, peixe...)

  { dia: "2026-06-30", modeloId: 5 }, // Café da Manhã (Bolo simples...)
  { dia: "2026-06-30", modeloId: 8 }, // Almoço (Polenta, linguiça...)
  { dia: "2026-06-25", modeloId: 3 }, // Jantar (Sopa...)

  { dia: "2026-06-26", modeloId: 4 }, // Café da Manhã (Pão com manteiga...)
  { dia: "2026-07-01", modeloId: 1 }, // Almoço (Arroz, Feijão...)
  { dia: "2026-07-01", modeloId: 7 }, // Jantar (Omelete...)
];
