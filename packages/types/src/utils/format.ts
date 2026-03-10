export function formatNumber(valor: string) {
  return valor.replace(/[^0-9]/gi, "");
}

const MyDDD = "71";

export function formatPhoneNumber(
  valor: string,
  manterDDD = true,
  manterDDI = true,
  manter9 = true,
) {
  if (!valor) return "";
  // Remove the Country code
  valor = valor.replace("+55", "");
  valor =
    valor.startsWith("55") && valor.length > 11
      ? valor.replace(/^(55)/, "")
      : valor;
  if (valor.startsWith("+")) return valor;

  valor = valor.slice(0, 1) === "0" ? valor.slice(1, valor.length) : valor;
  valor = formatNumber(valor);
  let _ddd, _num, _ddi;
  _ddi = manterDDI ? "+55" : "";
  const nove = manter9 ? "9" : "";

  switch (valor.length) {
    case 11: //00 90000-0000
      _ddd = valor.slice(0, 2);
      _ddd = manterDDD === true || _ddd !== MyDDD ? _ddd + " " : "";
      _num = nove + valor.slice(3, 7) + "-" + valor.slice(7);
      break;
    case 10: //00 0000-0000
      _ddd = valor.slice(0, 2);
      _ddd = manterDDD === true || _ddd !== MyDDD ? _ddd + " " : "";
      _num = nove + valor.slice(2, 6) + "-" + valor.slice(6);
      break;
    case 9: //90000-0000
      _ddd = manterDDD === true ? MyDDD + " " : "";
      _num = nove + valor.slice(1, 5) + "-" + valor.slice(5);
      break;
    case 8: //0000-0000
      _ddd = manterDDD === true ? MyDDD + " " : "";
      _num = nove + valor.slice(0, 4) + "-" + valor.slice(4);
      break;
    default:
      _ddd = "";
      _num = valor;
      break;
  }

  valor = _ddi + _ddd + _num;
  return valor;
}
