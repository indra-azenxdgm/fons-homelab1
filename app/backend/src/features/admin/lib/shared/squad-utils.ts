const nonAlphabeticPattern = /[^A-Za-z\s]+/g;
const multiSpacePattern = /\s+/g;

export function normalizeSquadName(name: string) {
  return name
    .trim()
    .replace(nonAlphabeticPattern, " ")
    .replace(multiSpacePattern, " ")
    .trim();
}

function sanitizeAlphaCharacters(value: string) {
  return value.replace(/[^A-Za-z]/g, "").toUpperCase();
}

export function generateSquadAlias(name: string) {
  const normalizedName = normalizeSquadName(name);
  const words = normalizedName.split(" ").filter(Boolean);

  if (!words.length) {
    return "XX";
  }

  if (words.length >= 2) {
    return `${sanitizeAlphaCharacters(words[0]).slice(0, 1) || "X"}${sanitizeAlphaCharacters(words.at(-1) || "").slice(0, 1) || "X"}`;
  }

  const singleWord = sanitizeAlphaCharacters(words[0]);

  if (singleWord.length >= 2) {
    return singleWord.slice(0, 2);
  }

  if (singleWord.length === 1) {
    return `${singleWord}X`;
  }

  return "XX";
}
