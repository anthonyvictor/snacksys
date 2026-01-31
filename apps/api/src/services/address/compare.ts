import jaroWinkler from "jaro-winkler";
import { normalizeOrdinal } from "../text/ordinals";

const types = [
  "rua",
  "avenida",
  "av",
  "travessa",
  "estrada",
  "ladeira",
  "alameda",
  "rodovia",
  "praça",
  "beco",
];

function normalize(str: string) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .replace(/\./g, "")
    .trim();
}

function splitAddress(address: string) {
  const norm = normalizeOrdinal(normalize(address));
  // const partes = norm.split(" ");
  const type = types.find((t) => norm.startsWith(t)) || "";
  const name = type ? norm.replace(type, "").trim() : norm;
  return { type, name };
}

export function similarAddresses(_a: string, _b: string, limiar = 0.9) {
  const a = splitAddress(_a);
  const b = splitAddress(_b);

  const similarityName = jaroWinkler(a.name, b.name);

  if (similarityName >= limiar) {
    return true;
  }
  return false;
}
