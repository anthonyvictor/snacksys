import { Model, Types, PopulateOptions } from "mongoose";

/**
 *
 * - m: Model que será usado
 * - q: query, ex: { nome: "José" }
 * - l: limite de resultados
 * - s: ordenamento, ex: { criadoEm: -1 }
 * - p: populates da busca
 * @returns
 */
export async function ff<T>({
  m,
  q,
  l,
  s,
  p = [],
}: {
  m: Model<T>;
  q?: any;
  s?: any;
  l?: number;
  p?: PopulateParam;
}) {
  let query = m.find(q);

  if (s) {
    query = query.sort(s);
  }
  if (l) {
    query = query.limit(l);
  }

  query = applyPopulates(query, p);

  const raw = await query.lean().exec();

  if (!raw) return null;

  const serialized = serializeMongo(raw);

  return serialized as unknown as T[];
}

type PopulateParam = string | PopulateOptions | (string | PopulateOptions)[];

export async function ffid<T>({
  m,
  id,
  p = [],
}: {
  m: Model<T>;
  id: string;
  p?: PopulateParam;
}): Promise<T | null> {
  if (!id) return null;

  let query = m.findById(id);

  query = applyPopulates(query, p);

  const raw = await query.lean().exec();

  if (!raw) return null;

  const serialized = serializeMongo(raw);

  return serialized as unknown as T;
}

// Função recursiva para aplicar populates aninhados
const applyPopulates = (query: any, populateList: PopulateParam) => {
  if (Array.isArray(populateList)) {
    populateList.forEach((populate) => applyPopulates(query, populate));
  } else if (typeof populateList === "string") {
    query = query.populate(populateList);
  } else {
    query = query.populate(populateList);
  }
  return query;
};

export const serializeMongo = (data: any): any => {
  if (!data) return data;

  // Trata objetos Date especificamente
  if (data instanceof Date) {
    return data;
  }

  // Se for um array, serializa cada item
  if (Array.isArray(data)) {
    return data.map(serializeMongo);
  }

  // Se for um objeto (incluindo subdocumentos populados)
  if (typeof data === "object" && data !== null) {
    // Caso especial: Remove a camada do Mongoose se existir `_doc`
    if (data._doc) {
      data = data._doc;
    }

    // Trata campos Date no formato BSON { $date: string }
    if (data.$date) {
      return new Date(data.$date);
    }

    if (data._id && typeof data._id === "object") {
      const { _id, ...rest } = data;
      const id = _id.toString();
      data = { id, ...serializeMongo(rest) };
    }

    // Remove campos internos do Mongoose ($__, $isNew, etc.)
    const { $__, $isNew, ...cleanData } = data;

    // Serializa recursivamente cada propriedade
    Object.keys(cleanData).forEach((key) => {
      cleanData[key] = serializeMongo(cleanData[key]);
    });

    return cleanData;
  }

  return data;
};
