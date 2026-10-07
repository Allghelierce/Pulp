// Xbox-style generated usernames with Pulp flavor: Adjective + grove word + number,
// e.g. "ClammyElm823", "MossyMango47". Leans alliterative when it can.
// Safe for both client (reroll button) and server (auto-assign on signup).

const ADJECTIVES = [
  "Clammy", "Mossy", "Sleepy", "Dizzy", "Breezy", "Crispy", "Fuzzy", "Juicy", "Zesty", "Sunny",
  "Misty", "Dusty", "Rusty", "Frosty", "Toasty", "Snappy", "Sneaky", "Plucky", "Lucky", "Spicy",
  "Sappy", "Leafy", "Woody", "Twiggy", "Seedy", "Thorny", "Bouncy", "Cozy", "Cosmic", "Sturdy",
  "Quiet", "Brisk", "Bold", "Calm", "Clever", "Curious", "Daring", "Gentle", "Golden", "Hazy",
  "Humble", "Jolly", "Mellow", "Nimble", "Peppy", "Quirky", "Rowdy", "Silly", "Swift", "Tiny",
  "Velvet", "Wild", "Witty", "Zippy", "Amber", "Copper", "Mighty", "Sleek", "Grumpy", "Sparkly",
]

const NOUNS = [
  "Elm", "Oak", "Birch", "Maple", "Willow", "Cedar", "Pine", "Aspen", "Alder", "Juniper",
  "Mango", "Lemon", "Plum", "Pear", "Fig", "Kiwi", "Lime", "Peach", "Cherry", "Melon",
  "Tangerine", "Apricot", "Acorn", "Sprout", "Sapling", "Seedling", "Bramble", "Clover", "Fern", "Moss",
  "Pinecone", "Thistle", "Twig", "Root", "Bark", "Blossom", "Petal", "Grove", "Orchard", "Meadow",
  "Badger", "Otter", "Owl", "Finch", "Sparrow", "Fox", "Hedgehog", "Squirrel", "Beetle", "Wren",
  "Scholar", "Quill", "Notebook", "Comet", "Pebble", "Puddle", "Nugget", "Biscuit", "Muffin", "Noodle",
]

const MAX_LEN = 20

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function generateUsername(): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const adj = pick(ADJECTIVES)
    // ~45% of the time, try for alliteration (MossyMango).
    const same = NOUNS.filter(n => n[0] === adj[0])
    const noun = same.length && Math.random() < 0.45 ? pick(same) : pick(NOUNS)
    const digits = String(Math.floor(Math.random() * (Math.random() < 0.5 ? 99 : 999)) + 1)
    const name = adj + noun + digits
    if (name.length <= MAX_LEN) return name
  }
  return "Sprout" + (Math.floor(Math.random() * 9000) + 1000)
}

// Escape a value for an exact, case-insensitive Postgres ILIKE match
// (otherwise "_" and "%" act as wildcards).
export function ilikeExact(value: string): string {
  return value.replace(/[\\%_]/g, m => "\\" + m)
}
