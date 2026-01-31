import { removeDuplicateWords } from "@/services/text/removeDuplicateWords";
import { IBuildingAddress, MsgIntentFunc } from "types";
import { replaceDeliveryText } from "../replace/delivery";
import { extractAddressIA } from "@/services/ia/extractAddress";

export const askDelivery: MsgIntentFunc = async ({
  original,
  normalized,
  chat,
}) => {
  const n = removeDuplicateWords(replaceDeliveryText(normalized));

  const r = !!n.match(
    /((quanto|quero) (entrega|retirada)|^(retirada|entrega))/g,
  );
  if (r) {
    const entities = await extractAddressIA(
      original
        .replace(
          /\b(obr?i?ga?d?o?a?|pfv|por\s+favor?|quero|querer|vou|vai|ser)\b/g,
          "",
        )
        .replace(/\b(entrega|fica|(entra|desce)(ndo)?)\b/g, "")
        .replace(/\b((eh?\s+)?(a(q|k)u?i?\s+)?(na|no))\b/g, "")
        .replace(/^tv\.? /g, "travessa ")
        .replace(/^r\.? /g, "rua ")
        .replace(/^av\.? /g, "avenida ")
        .replace(/^lad\.? /g, "ladeira ")
        .replace(/^ala?\.? /g, "alameda ")
        .replace(/\b(sao cr?istova?o)\b/g, "bairro sao cristovao")
        .replace(/\s+/g, " ")
        .trim(),
    );

    return {
      intent: "askDelivery",
      entities,
    };
  } else {
    return false;
  }
};
