export const textStyles = {
  bold: (str: string | undefined | null) => (str ? `*${str}*` : ""),
  italic: (str: string | undefined | null) => (str ? `_${str}_` : ""),
  sliced: (str: string | undefined | null) => (str ? `~${str}~` : ""),
  cite: (str: string | undefined | null) => (str ? `> ${str}` : ""),
  mark: (str: string | undefined | null) => (str ? `* ${str}` : ""),
  num: (str: string | undefined | null, i: number) =>
    str ? `${i}. ${str}` : "",
  code: (str: string | undefined | null) => (str ? `\`${str}\`` : ""),
  mono: (str: string | undefined | null) => (str ? `\`\`\`${str}\`\`\`` : ""),
  section: (str: string | undefined | null) =>
    str
      ? `*[ ${str.toUpperCase()} ]*`
      : //  str.length < 10
        //   ? `*------------- [ ${str.toUpperCase()} ] -------------*`
        //   : `*-------- [ ${str.toUpperCase()} ] --------*`
        "",
};
