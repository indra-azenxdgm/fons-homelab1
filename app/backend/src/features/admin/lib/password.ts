import { randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_PARAMS = {
  cost: 16384,
  blockSize: 8,
  parallelization: 1,
  keyLength: 64,
} as const;

const TEMP_PASSWORD_SETS = {
  lower: "abcdefghjkmnpqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  number: "23456789",
  symbol: "!@#$%^&*",
} as const;

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, SCRYPT_PARAMS.keyLength, {
    N: SCRYPT_PARAMS.cost,
    r: SCRYPT_PARAMS.blockSize,
    p: SCRYPT_PARAMS.parallelization,
  });

  return [
    "scrypt",
    SCRYPT_PARAMS.cost,
    SCRYPT_PARAMS.blockSize,
    SCRYPT_PARAMS.parallelization,
    salt,
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyAdminPassword(password: string, passwordHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, expectedHash] =
    passwordHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !salt ||
    !expectedHash
  ) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, expectedHash.length / 2, {
    N: Number(cost),
    r: Number(blockSize),
    p: Number(parallelization),
  });

  return safeEqual(derivedKey.toString("hex"), expectedHash);
}

export function getAdminPasswordValidationMessage(password: string) {
  if (password.length < 10) {
    return "Password must be at least 10 characters long";
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include uppercase, lowercase, and numeric characters";
  }

  return null;
}

function pickRandomCharacter(characters: string) {
  return characters[randomInt(0, characters.length)];
}

function shuffleCharacters(characters: string[]) {
  const copy = [...characters];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const nextIndex = randomInt(0, index + 1);
    const current = copy[index];
    copy[index] = copy[nextIndex];
    copy[nextIndex] = current;
  }

  return copy;
}

export function generateTemporaryAdminPassword(length = 14) {
  const requiredCharacters = [
    pickRandomCharacter(TEMP_PASSWORD_SETS.lower),
    pickRandomCharacter(TEMP_PASSWORD_SETS.upper),
    pickRandomCharacter(TEMP_PASSWORD_SETS.number),
    pickRandomCharacter(TEMP_PASSWORD_SETS.symbol),
  ];

  const allCharacters = Object.values(TEMP_PASSWORD_SETS).join("");
  const nextCharacters = [...requiredCharacters];

  while (nextCharacters.length < length) {
    nextCharacters.push(pickRandomCharacter(allCharacters));
  }

  return shuffleCharacters(nextCharacters).join("");
}
