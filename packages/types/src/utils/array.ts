export function toArray<T>(_arr: T | T[]) {
  if (!_arr) return [];
  const arr = Array.isArray(_arr) ? _arr : [_arr];
  return arr;
}

// Função auxiliar para acessar subcampos
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc?.[part], obj);
}

export function group<T>(arr: T[], props: (keyof T)[]): T[][] {
  const map = new Map<string, T[]>();

  for (const item of arr) {
    // Cria chave a partir dos paths escolhidos
    const chave = props
      .map((prop) => String(getNestedValue(item, prop as string)))
      .join("|");

    if (!map.has(chave)) {
      map.set(chave, []);
    }

    map.get(chave)!.push(item);
  }

  return Array.from(map.values());
}

export function sortDisp<T>(arr: T[]) {
  //   const disp = (x: T) =>
  //     x["disponivel"] && x["visivel"] && x["emCondicoes"] && x["estoque"] !== 0
  //       ? 1
  //       : x["visivel"]
  //       ? 0
  //       : -1;

  //   return [...arr].sort((a, b) => {
  //     return disp(b) - disp(a); // os "true" vão para o topo
  //   });

  return arr;
}

export const sortByDate = (a: any, b: any) => {
  if (!a && !b) return 0; // ambos undefined
  if (!a) return 1; // a undefined → vem depois
  if (!b) return -1; // b undefined → vem depois
  return new Date(b).getTime() - new Date(a).getTime();
};

export function mergeArraysByKey<T extends Record<string, any>>(
  original: T[],
  updates: T[],
  key: keyof T,
): T[] {
  const map = new Map(original.map((item, idx) => [item[key], { item, idx }]));
  const result = [...original]; // copia para manter imutabilidade

  for (const update of updates) {
    const entry = map.get(update[key]);

    if (entry) {
      // já existe → atualiza na mesma posição
      result[entry.idx] = { ...entry.item, ...update };
    } else {
      // não existe → insere no topo
      result.unshift(update);
    }
  }

  return result;
}

// Função para normalizar texto (remove acentos, lowercase, etc.)
function normalize(str: string): string {
  return str
    .normalize("NFD") // separa acentos
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim();
}

interface FieldConfig<T> {
  field: keyof T; // campo para procurar
  weight: number; // peso do campo
}

export function fuzzySearch<T extends Record<string, any>>(
  items: T[],
  query: string,
  fields: FieldConfig<T>[],
): T[] {
  if (!query.replace(/a-zA-Z0-9/gi, "")) return items;
  const keywords = normalize(query).split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      let score = 0;

      for (const { field, weight } of fields) {
        const fieldValue = normalize(String(item[field] ?? ""));

        for (const word of keywords) {
          if (fieldValue.includes(word)) {
            score += weight; // soma peso se encontrou
          }
        }
      }

      return { item, score };
    })
    .filter((r) => r.score > 0) // remove sem relevância
    .sort((a, b) => b.score - a.score) // ordena por score desc
    .map((r) => r.item);
}
