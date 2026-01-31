import { IProduct } from "types";
import { normalize } from "./format";
import { levenshteinSimilarity } from "./levenshtein";

type GroupedArrayItem<T> = {
  name: string;
  items: T[];
};

export function group<T extends Record<string, any>, K extends keyof T>(
  items: T[],
  by: K
): GroupedArrayItem<T>[] {
  const groupsMap = items.reduce((acc, item) => {
    const groupKey = item[by] as T[K] & string;

    if (!acc.has(groupKey)) {
      acc.set(groupKey, []);
    }

    acc.get(groupKey)!.push(item);

    return acc;
  }, new Map<string, T[]>());

  return Array.from(groupsMap.entries()).map(([key, value]) => ({
    name: key,
    items: value,
  }));
}

export function arrayUniqueObj<T extends Record<string, any>>(
  arr: T[],
  key: keyof T
): T[] {
  const seen = new Set<any>();

  return arr.filter((item) => {
    const value = item[key];

    if (value === undefined || value === null) {
      return false; // descarta entradas sem key válida
    }

    if (seen.has(value)) {
      return false;
    }

    seen.add(value);
    return true;
  });
}

export function arrayUnique(array: (string | number)[]) {
  const setUnico = new Set(array);

  return [...setUnico];
}

export function arrayUnified<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K
): (T & { count: number })[] {
  // 1. Usar um Record (ou Map) para armazenar os objetos agrupados e suas contagens.
  // A chave do objeto agrupador será o valor da 'key' (que pode ser string | number | symbol).
  // O valor será o objeto T & { count: number }.
  const unifiedMap = array.reduce((accumulator, currentItem) => {
    const keyValue = currentItem[key];

    // Se o valor da chave já existe no acumulador, incrementamos a contagem.
    if (accumulator.has(keyValue)) {
      const existingItem = accumulator.get(keyValue)!;
      existingItem.count += 1;
      accumulator.set(keyValue, existingItem);
    } else {
      // Se o valor da chave é novo, adicionamos o item ao acumulador com count = 1.
      // Criamos uma cópia do objeto original e adicionamos a propriedade 'count'.
      const newItem = { ...currentItem, count: 1 };
      accumulator.set(keyValue, newItem);
    }

    return accumulator;
  }, new Map<T[K], T & { count: number }>());

  // 2. Retornar os valores do Map como um array.
  return Array.from(unifiedMap.values());
}
