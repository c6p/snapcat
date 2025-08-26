export const CAT_COLORS = {
  black: "#111",
  gray: "#80828f",
  //brown: "#c3907b",
  orange: "#faaf69",
  cream: "#f7e7cd",
  white: "#eee",
};
export type CatColor = keyof typeof CAT_COLORS;
export type CatPattern = "solid" | "tuxedo" | "tabby";
