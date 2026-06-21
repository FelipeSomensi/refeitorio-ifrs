// utils/semanas.ts
// Funções compartilhadas para calcular semanas do ano (segunda a sexta).

export const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export function paraISO(data: Date) {
  return data.toISOString().split("T")[0];
}

export function formatarDataBR(isoDate: string) {
  const [ano, mes, dia] = isoDate.split("-");
  return `${dia}/${mes}/${ano}`;
}

// Retorna a data da segunda-feira da semana que contém "data"
function segundaFeiraDaSemana(data: Date) {
  const d = new Date(data);
  const diaSemana = d.getDay(); // 0 = domingo, 1 = segunda, ...
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Gera todas as segundas-feiras (uma por semana) que tocam o ano informado.
// Algumas semanas "viram o ano" (ex: semana que começa em 29/12 e termina em
// 02/01) — incluímos a semana se qualquer um dos 5 dias (seg-sex) cair no ano.
export function gerarSemanasDoAno(ano: number) {
  const semanas: { numero: number; segunda: Date }[] = [];

  // Começa um pouco antes do dia 1º de janeiro para garantir que a primeira
  // semana do ano seja capturada mesmo se 1º de jan não for segunda.
  let cursor = segundaFeiraDaSemana(new Date(ano, 0, 1));
  cursor.setDate(cursor.getDate() - 7); // uma semana de margem

  let numero = 1;
  while (true) {
    const sexta = new Date(cursor);
    sexta.setDate(cursor.getDate() + 4);

    const tocaOAno =
      cursor.getFullYear() === ano || sexta.getFullYear() === ano;
    const passouDoAno = cursor.getFullYear() > ano;

    if (passouDoAno) break;

    if (tocaOAno) {
      semanas.push({ numero, segunda: new Date(cursor) });
      numero++;
    }

    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }

  return semanas;
}

// Gera os 5 dias úteis (seg-sex) a partir da data de uma segunda-feira
export function gerarDiasUteis(segunda: Date) {
  const dias: { iso: string; nome: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(segunda);
    d.setDate(segunda.getDate() + i);
    dias.push({ iso: paraISO(d), nome: DIAS_SEMANA[i] });
  }
  return dias;
}

// Retorna { ano, numeroSemana } da semana atual (hoje)
export function semanaAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const segundaHoje = paraISO(segundaFeiraDaSemana(hoje));

  const semanas = gerarSemanasDoAno(ano);
  const encontrada = semanas.find((s) => paraISO(s.segunda) === segundaHoje);

  return {
    ano,
    numeroSemana: encontrada ? encontrada.numero : 1,
  };
}

export function labelSemana(numero: number, segunda: Date) {
  const dias = gerarDiasUteis(segunda);
  const inicio = formatarDataBR(dias[0].iso);
  const fim = formatarDataBR(dias[4].iso);
  return `Semana ${numero} · ${inicio} a ${fim}`;
}
