export function mergeUniqueText(currentMsg: string, newMsg: string) {
  if (!newMsg) return currentMsg;
  if (!currentMsg) return newMsg;

  // 1. Normalização para comparação (sem acentos e em minúsculo)
  const normalizar = (txt: string) =>
    txt
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^\w\s]/gi, "") // Remove pontuação
      .trim();

  const atualNorm = normalizar(currentMsg);
  const novoNorm = normalizar(newMsg);

  // 2. Se um texto já contém o outro integralmente, ficamos com o maior
  if (atualNorm.includes(novoNorm)) return currentMsg;
  if (novoNorm.includes(atualNorm)) return newMsg;

  // 3. Verificação de sobreposição (Overlap)
  // Se o novo texto começa com o final do texto atual, ou vice-versa
  const palavrasAtual = currentMsg.split(/\s+/);
  const palavrasNovo = newMsg.split(/\s+/);

  // Ex: "Rua São Paulo" + "São Paulo" -> "Rua São Paulo"
  // Pegamos as últimas 2 palavras do atual e vemos se o novo começa com elas
  const ultimasPalavras = palavrasAtual.slice(-2).join(" ");
  if (novoNorm.startsWith(normalizar(ultimasPalavras))) {
    // Remove a repetição e junta
    const complemento = palavrasNovo.slice(2).join(" ");
    return `${currentMsg} ${complemento}`.trim();
  }

  // 4. Se não há sobreposição clara, apenas concatena com separador inteligente
  // Se for número, geralmente usamos espaço. Se for complemento, vírgula.
  const separador = /\d/.test(currentMsg) && /\d/.test(newMsg) ? " " : ", ";
  return `${currentMsg}${separador}${newMsg}`;
}
