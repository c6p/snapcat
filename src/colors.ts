export const CAT_COLORS = {
  black: "#111",
  gray: "#80828f",
  orange: "#faaf69",
  cream: "#f7e7cd",
  white: "#eee",
};
export type CatColor = keyof typeof CAT_COLORS;
export const CAT_PATTERNS = [/* plain */ "tuxedo", "tabby"] as const;
export type CatPattern = (typeof CAT_PATTERNS)[number];
