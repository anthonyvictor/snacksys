export function join(
  arr: (string | undefined | null)[] | string,
  separator: string = ", "
) {
  let f = (x: string) => x;
  let _arr = Array.isArray(arr)
    ? arr
        .filter(Boolean)
        .filter((x) => !!x && typeof x === "string" && !!x.trim())
    : arr
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

  if (["e", "ou"].includes(separator.trim())) {
    f = (x) => x.replace(/,([^,]*)$/, ` ${separator.trim()}` + "$1");
  }
  return f(_arr.join(separator));
}
