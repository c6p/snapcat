export const ACCESSORY_PLACES = ["head", "eye", "neck", "hand"] as const;
export type AccessoryPlace = (typeof ACCESSORY_PLACES)[number];

export const ACCESSORIES = {
  head: ["cap", "beanie", "hat", "band", "bow"],
  eye: ["glasses", "sunglasses"],
  neck: ["tie", "bowtie", "scarf"],
  hand: ["umbrella", "bag", "cane", "balloon"],
} as const;

export type Accessory = (typeof ACCESSORIES)[keyof typeof ACCESSORIES][number];
