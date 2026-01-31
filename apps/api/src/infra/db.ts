import { CustomerModel } from "types";

export async function createIndex() {
  try {
    await CustomerModel.syncIndexes();

    console.log("✅ Índices sincronizados");
  } catch (error) {
    console.error("❌ Erro ao sincronizar índices:", error);
  }
}
