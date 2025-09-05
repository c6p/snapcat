export const ACCESSORY_PLACES = {
  head: 0.6,
  eye: 0.4,
  neck: 0.5,
  hand: 0.3,
} as const;
export type AccessoryPlace = keyof typeof ACCESSORY_PLACES;

export const ACCESSORIES = {
  head: { cap: 1, beanie: 1, hat: 1, band: 1, bow: 1 },
  eye: { glasses: 2, sunglasses: 1 },
  neck: { tie: 1, bowtie: 1, scarf: 1 },
  hand: { umbrella: 1, bag: 3, cane: 3, balloon: 2 },
} as const;
export type Accessory = {
  [K in keyof typeof ACCESSORIES]: keyof (typeof ACCESSORIES)[K];
}[keyof typeof ACCESSORIES];
