export const CAT_NAMES = {
  black: [
    "Shadow",
    "Midnight",
    "Salem",
    "Jinx",
    "Nyx",
    "Smudge",
    "Raven",
    "Loki",
    "Onyx",
    "Coal",
  ],
  orange: ["Ginger", "Simba", "Tigger", "Honey", "Maple", "Peaches", "Pumpkin"],
  cream: ["Pudding", "Cookie", "Muffin", "Latte", "Waffle", "Tofu", "Noodle"],
  gray: ["Smokey", "Cinder", "Ash", "Pebbles", "Dusty", "Steel", "Fog"],
  white: ["Snowball", "Ivory", "Pearl", "Cotton", "Ghost", /*"Daisy", "Frost"*/],
} as const;

export type CatName = (typeof CAT_NAMES)[keyof typeof CAT_NAMES][number];
