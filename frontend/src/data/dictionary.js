// src/data/dictionary.js
export const DICTIONARY = {
  accomplish: {
    word: "accomplish",
    phonetic: "/əˈkʌm.plɪʃ/",
    level: "B2",
    family: [{ word: "accomplished", pos: "adj" }],
    collocations: ["accomplish a goal", "accomplish a task"],
    pos: [{ type: "verb", defs: [{ def: "To succeed in doing...", vi: "Hoàn thành", example: "She managed to accomplish all her goals." }], synonyms: ["achieve"], antonyms: ["fail"] }],
  },
  significant: {
    word: "significant",
    phonetic: "/sɪɡˈnɪf.ɪ.kənt/",
    level: "B2",
    family: [{ word: "significance", pos: "n" }, { word: "significantly", pos: "adv" }],
    collocations: ["significant improvement", "significant impact"],
    pos: [{ type: "adjective", defs: [{ def: "Important or noticeable...", vi: "Quan trọng, đáng kể", example: "The research showed a significant improvement." }], synonyms: ["important", "notable"], antonyms: ["insignificant"] }],
  },
  perseverance: {
    word: "perseverance",
    phonetic: "/ˌpɜː.sɪˈvɪər.əns/",
    level: "C1",
    family: [{ word: "persevere", pos: "v" }],
    collocations: ["show perseverance", "require perseverance"],
    pos: [{ type: "noun", defs: [{ def: "Continued effort...", vi: "Sự kiên trì", example: "Perseverance is the key to success." }], synonyms: ["persistence"], antonyms: ["giving up"] }],
  },
  resilient: {
    word: "resilient",
    phonetic: "/rɪˈzɪl.i.ənt/",
    level: "C1",
    family: [{ word: "resilience", pos: "n" }],
    collocations: ["resilient community", "emotionally resilient"],
    pos: [{ type: "adjective", defs: [{ def: "Able to recover quickly...", vi: "Kiên cường", example: "Children are often more resilient than adults think." }], synonyms: ["tough", "adaptable"], antonyms: ["fragile"] }],
  },
  // ... Bạn copy tiếp toàn bộ các từ còn lại (innovative, collaborate, eloquent, milestone, dedicate, analyze) vào đây.
};