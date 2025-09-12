export const ACCESSORY_PLACES = {
  head: 0.7,
  eye: 0.5,
  neck: 0.8,
  hand: 0.5,
} as const;
export type AccessoryPlace = keyof typeof ACCESSORY_PLACES;
export const placeOrder = ["head", "eye", "neck", "hand"] as const;

export const ACCESSORIES = {
  head: { cap: 100, beanie: 100, hat: 100, band: 100 },
  eye: { glasses: 100, sunglasses: 100 },
  neck: { tie: 100, bowtie: 100, scarf: 100 },
  hand: { umbrella: 100, bag: 100, cane: 100, balloon: 100 },
} as const;
export const Halving: Record<Accessory, number> = {
  cap: 2,
  beanie: 2,
  hat: 2,
  band: 2,
  glasses: 2,
  sunglasses: 4,
  tie: 2,
  bowtie: 2,
  scarf: 2,
  umbrella: 3,
  bag: 2,
  cane: 2,
  balloon: 3,
};
export type Accessory = {
  [K in keyof typeof ACCESSORIES]: keyof (typeof ACCESSORIES)[K];
}[keyof typeof ACCESSORIES];
