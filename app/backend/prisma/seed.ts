import { randomBytes, scryptSync } from "node:crypto";

import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AdminRole,
  BookingStatus,
  ExpenseCategory,
  ExpensePaymentMethod,
  FinancePaymentMethod,
  PrismaClient,
  TimeSlot,
} from "@prisma/client";

import { generateSquadAlias, normalizeSquadName } from "../src/utils/alias";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing required environment variable: DATABASE_URL");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const squads = [
  { name: "Indra Budi", phone: "081211110001", email: "indra.budi@fons.test" },
  { name: "Andri Saputra", phone: "081211110002", email: "andri.saputra@fons.test" },
  { name: "Raka Pratama", phone: "081211110003", email: "raka.pratama@fons.test" },
  { name: "Dimas Arya", phone: "081211110004", email: "dimas.arya@fons.test" },
  { name: "Fajar Nugroho", phone: "081211110005", email: "fajar.nugroho@fons.test" },
  { name: "Sinta Maharani", phone: "081211110006", email: "sinta.maharani@fons.test" },
  { name: "Nadia Putri", phone: "081211110007", email: "nadia.putri@fons.test" },
  { name: "Bagas Wicaksono", phone: "081211110008", email: "bagas.wicaksono@fons.test" },
  { name: "Yusuf Ramadhan", phone: "081211110009", email: "yusuf.ramadhan@fons.test" },
] as const;

const serviceTypes = [
  {
    slug: "ac-cleaning",
    name: "Cuci AC",
    description: "Pembersihan indoor dan outdoor untuk AC split standar.",
    estimatedDuration: 90,
  },
  {
    slug: "ac-repair",
    name: "Perbaikan AC",
    description: "Pengecekan dan perbaikan untuk masalah dingin, bocor, atau kelistrikan.",
    estimatedDuration: 120,
  },
  {
    slug: "ac-installation",
    name: "Pasang AC",
    description: "Pemasangan unit AC baru untuk rumah atau usaha kecil.",
    estimatedDuration: 180,
  },
  {
    slug: "ac-gas-refill",
    name: "Isi Freon AC",
    description: "Isi freon setelah pengecekan kondisi unit dan tekanan.",
    estimatedDuration: 90,
  },
  {
    slug: "ac-maintenance",
    name: "Perawatan AC",
    description: "Perawatan berkala untuk menjaga performa AC tetap stabil.",
    estimatedDuration: 120,
  },
  {
    slug: "ac-other",
    name: "Lainnya",
    description: "Kebutuhan servis lain yang dijelaskan langsung oleh pelanggan.",
    estimatedDuration: 90,
  },
] as const;

const DEFAULT_DEV_ADMIN = {
  email: "admin@fons.com",
  name: "Fons Admin",
  role: AdminRole.SUPER_ADMIN,
} as const;

const DEFAULT_DEV_TEST_ACCOUNTS = [
  DEFAULT_DEV_ADMIN,
  {
    email: "ops.admin@fons.test",
    name: "Fons Ops Admin",
    role: AdminRole.ADMIN,
  },
  {
    email: "ops.squad@fons.test",
    name: "Fons Ops Squad",
    role: AdminRole.SQUAD,
    squadAlias: "IB",
  },
] as const;

const demoCustomers = [
  { key: "melinta", fullName: "Melinta", phone: "081311110101", email: "melinta@demo.fons.test" },
  { key: "fani", fullName: "Fani", phone: "081311110102", email: "fani@demo.fons.test" },
  { key: "tami", fullName: "Tami", phone: "081311110103", email: "tami@demo.fons.test" },
  { key: "ratna", fullName: "Ratna", phone: "081311110104", email: "ratna@demo.fons.test" },
  { key: "dona-apartemen", fullName: "Dona Apartemen", phone: "081311110105", email: "dona.apartemen@demo.fons.test" },
  { key: "anggi", fullName: "Anggi", phone: "081311110106", email: "anggi@demo.fons.test" },
  { key: "iwan", fullName: "Iwan", phone: "081311110107", email: "iwan@demo.fons.test" },
  { key: "delina", fullName: "Delina", phone: "081311110108", email: "delina@demo.fons.test" },
  { key: "siti-risanti", fullName: "Siti Risanti", phone: "081311110109", email: "siti.risanti@demo.fons.test" },
  { key: "fariz-agati", fullName: "Fariz Agati", phone: "081311110110", email: "fariz.agati@demo.fons.test" },
  { key: "wulan", fullName: "Wulan", phone: "081311110111", email: "wulan@demo.fons.test" },
  { key: "hendra", fullName: "Hendra", phone: "081311110112", email: "hendra@demo.fons.test" },
] as const;

const demoBookings = [
  {
    bookingCode: "BOOK-DEMO-251201",
    customerKey: "melinta",
    serviceTypeSlug: "ac-cleaning",
    bookingDate: "2025-12-01",
    timeSlot: TimeSlot.SLOT_0900,
    contactName: "Melinta",
    contactPhone: "081311110101",
    contactEmail: "melinta@demo.fons.test",
    addressLine1: "Jl. Kaliurang KM 5 No. 21",
    city: "Yogyakarta",
    status: BookingStatus.PAID,
    notes: "Demo booking for linked finance income.",
  },
  {
    bookingCode: "BOOK-DEMO-251203",
    customerKey: "fani",
    serviceTypeSlug: "ac-cleaning",
    bookingDate: "2025-12-03",
    timeSlot: TimeSlot.SLOT_1100,
    contactName: "Fani",
    contactPhone: "081311110102",
    contactEmail: "fani@demo.fons.test",
    addressLine1: "Jl. Magelang No. 87",
    city: "Yogyakarta",
    status: BookingStatus.PAID,
    notes: "Demo booking for linked finance income.",
  },
  {
    bookingCode: "BOOK-DEMO-251205",
    customerKey: "ratna",
    serviceTypeSlug: "ac-repair",
    bookingDate: "2025-12-05",
    timeSlot: TimeSlot.SLOT_1300,
    contactName: "Ratna",
    contactPhone: "081311110104",
    contactEmail: "ratna@demo.fons.test",
    addressLine1: "Jl. Affandi No. 33",
    city: "Yogyakarta",
    status: BookingStatus.PAID,
    notes: "Demo booking for linked finance income.",
  },
  {
    bookingCode: "BOOK-DEMO-251207",
    customerKey: "dona-apartemen",
    serviceTypeSlug: "ac-installation",
    bookingDate: "2025-12-07",
    timeSlot: TimeSlot.SLOT_0900,
    contactName: "Dona Apartemen",
    contactPhone: "081311110105",
    contactEmail: "dona.apartemen@demo.fons.test",
    addressLine1: "Apartemen Uttara Tower Selatan Unit 8A",
    city: "Yogyakarta",
    status: BookingStatus.PAID,
    notes: "Demo booking for linked finance income.",
  },
  {
    bookingCode: "BOOK-DEMO-251210",
    customerKey: "anggi",
    serviceTypeSlug: "ac-gas-refill",
    bookingDate: "2025-12-10",
    timeSlot: TimeSlot.SLOT_1500,
    contactName: "Anggi",
    contactPhone: "081311110106",
    contactEmail: "anggi@demo.fons.test",
    addressLine1: "Jl. Ringroad Utara No. 12",
    city: "Yogyakarta",
    status: BookingStatus.PAID,
    notes: "Demo booking for linked finance income.",
  },
  {
    bookingCode: "BOOK-DEMO-251214",
    customerKey: "iwan",
    serviceTypeSlug: "ac-maintenance",
    bookingDate: "2025-12-14",
    timeSlot: TimeSlot.SLOT_1100,
    contactName: "Iwan",
    contactPhone: "081311110107",
    contactEmail: "iwan@demo.fons.test",
    addressLine1: "Perum Griya Cendana Blok C2",
    city: "Yogyakarta",
    status: BookingStatus.PAID,
    notes: "Demo booking for linked finance income.",
  },
  {
    bookingCode: "BOOK-DEMO-251226",
    customerKey: "tami",
    serviceTypeSlug: "ac-cleaning",
    bookingDate: "2025-12-26",
    timeSlot: TimeSlot.SLOT_0900,
    contactName: "Tami",
    contactPhone: "081311110103",
    contactEmail: "tami@demo.fons.test",
    addressLine1: "Jl. Palagan No. 17",
    city: "Yogyakarta",
    status: BookingStatus.COMPLETED,
    notes: "Completed booking kept available for add income combobox testing.",
  },
  {
    bookingCode: "BOOK-DEMO-251227",
    customerKey: "delina",
    serviceTypeSlug: "ac-repair",
    bookingDate: "2025-12-27",
    timeSlot: TimeSlot.SLOT_1100,
    contactName: "Delina",
    contactPhone: "081311110108",
    contactEmail: "delina@demo.fons.test",
    addressLine1: "Jl. Colombo No. 18",
    city: "Yogyakarta",
    status: BookingStatus.COMPLETED,
    notes: "Completed booking kept available for add income combobox testing.",
  },
  {
    bookingCode: "BOOK-DEMO-251228",
    customerKey: "wulan",
    serviceTypeSlug: "ac-gas-refill",
    bookingDate: "2025-12-28",
    timeSlot: TimeSlot.SLOT_1300,
    contactName: "Wulan",
    contactPhone: "081311110111",
    contactEmail: "wulan@demo.fons.test",
    addressLine1: "Jl. Monjali No. 44",
    city: "Yogyakarta",
    status: BookingStatus.COMPLETED,
    notes: "Completed booking kept available for add income combobox testing.",
  },
  {
    bookingCode: "BOOK-DEMO-251229",
    customerKey: "hendra",
    serviceTypeSlug: "ac-maintenance",
    bookingDate: "2025-12-29",
    timeSlot: TimeSlot.SLOT_1500,
    contactName: "Hendra",
    contactPhone: "081311110112",
    contactEmail: "hendra@demo.fons.test",
    addressLine1: "Jl. Gejayan No. 51",
    city: "Yogyakarta",
    status: BookingStatus.COMPLETED,
    notes: "Completed booking kept available for add income combobox testing.",
  },
] as const;

const demoIncomeRecords = [
  {
    incomeCode: "INC-DEMO-251201-01",
    billNumber: "INV/INC/251201/001",
    bookingCode: "BOOK-DEMO-251201",
    customerName: "Melinta",
    transactionDate: "2025-12-01",
    amount: 80000,
    serviceDescription: "cleaning AC 1 unit",
    paymentMethod: FinancePaymentMethod.CASH,
    notes: "Booking linked demo income.",
    items: [
      { description: "cleaning AC 1 unit", amount: 80000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251203-02",
    billNumber: "INV/INC/251203/002",
    bookingCode: "BOOK-DEMO-251203",
    customerName: "Fani",
    transactionDate: "2025-12-03",
    amount: 160000,
    serviceDescription: "cleaning AC 2 unit",
    paymentMethod: FinancePaymentMethod.TRANSFER_BCA,
    notes: "Booking linked demo income.",
    items: [
      { description: "cleaning AC 2 unit", amount: 160000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251205-03",
    billNumber: "INV/INC/251205/003",
    bookingCode: "BOOK-DEMO-251205",
    customerName: "Ratna",
    transactionDate: "2025-12-05",
    amount: 175000,
    serviceDescription: "perbaikan kebocoran freon +1 more",
    paymentMethod: FinancePaymentMethod.TRANSFER_BRI,
    notes: "Booking linked demo income.",
    items: [
      { description: "perbaikan kebocoran freon", amount: 90000 },
      { description: "drainase 2 meter", amount: 85000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251207-04",
    billNumber: "INV/INC/251207/004",
    bookingCode: "BOOK-DEMO-251207",
    customerName: "Dona Apartemen",
    transactionDate: "2025-12-07",
    amount: 350000,
    serviceDescription: "pemasangan AC 1PK +1 more",
    paymentMethod: FinancePaymentMethod.TRANSFER_MANDIRI,
    notes: "Booking linked demo income.",
    items: [
      { description: "pemasangan AC 1PK", amount: 300000 },
      { description: "pipa refrigerant 2 meter", amount: 50000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251210-05",
    billNumber: "INV/INC/251210/005",
    bookingCode: "BOOK-DEMO-251210",
    customerName: "Anggi",
    transactionDate: "2025-12-10",
    amount: 300000,
    serviceDescription: "pengisian freon R410 full +1 more",
    paymentMethod: FinancePaymentMethod.TRANSFER_BCA,
    notes: "Booking linked demo income.",
    items: [
      { description: "pengisian freon R410 full", amount: 200000 },
      { description: "perbaikan kebocoran freon", amount: 100000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251214-06",
    billNumber: "INV/INC/251214/006",
    bookingCode: "BOOK-DEMO-251214",
    customerName: "Iwan",
    transactionDate: "2025-12-14",
    amount: 200000,
    serviceDescription: "drainase 3 meter +1 more",
    paymentMethod: FinancePaymentMethod.TRANSFER_BRI,
    notes: "Booking linked demo income.",
    items: [
      { description: "drainase 3 meter", amount: 120000 },
      { description: "cleaning AC 1 unit", amount: 80000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251216-07",
    billNumber: "INV/INC/251216/007",
    customerName: "Tami",
    transactionDate: "2025-12-16",
    amount: 90000,
    serviceDescription: "drainase 2 meter",
    paymentMethod: FinancePaymentMethod.CASH,
    notes: "Manual income entry seeded for finance testing.",
    items: [
      { description: "drainase 2 meter", amount: 90000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251217-08",
    billNumber: "INV/INC/251217/008",
    customerName: "Delina",
    transactionDate: "2025-12-17",
    amount: 30000,
    serviceDescription: "Manual income entry",
    paymentMethod: FinancePaymentMethod.OTHER,
    notes: "Manual entry with minimal fallback style data.",
    items: [
      { description: "Manual income entry", amount: 30000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251218-09",
    billNumber: "INV/INC/251218/009",
    customerName: "Siti Risanti",
    transactionDate: "2025-12-18",
    amount: 200000,
    serviceDescription: "pengisian freon R410 full",
    paymentMethod: FinancePaymentMethod.TRANSFER_MANDIRI,
    notes: "Manual income entry seeded for finance testing.",
    items: [
      { description: "pengisian freon R410 full", amount: 200000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251219-10",
    billNumber: "INV/INC/251219/010",
    customerName: "Fariz Agati",
    transactionDate: "2025-12-19",
    amount: 175000,
    serviceDescription: "pipa refrigerant 2 meter",
    paymentMethod: FinancePaymentMethod.TRANSFER_BCA,
    notes: "Manual income entry seeded for finance testing.",
    items: [
      { description: "pipa refrigerant 2 meter", amount: 175000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251220-11",
    billNumber: "INV/INC/251220/011",
    customerName: "Wulan",
    transactionDate: "2025-12-20",
    amount: 80000,
    serviceDescription: "cleaning AC 1 unit",
    paymentMethod: FinancePaymentMethod.CASH,
    notes: "Manual income entry seeded for finance testing.",
    items: [
      { description: "cleaning AC 1 unit", amount: 80000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251221-12",
    billNumber: "INV/INC/251221/012",
    customerName: "Hendra",
    transactionDate: "2025-12-21",
    amount: 160000,
    serviceDescription: "cleaning AC 2 unit",
    paymentMethod: FinancePaymentMethod.TRANSFER_BRI,
    notes: "Manual income entry seeded for finance testing.",
    items: [
      { description: "cleaning AC 2 unit", amount: 160000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251222-13",
    billNumber: "INV/INC/251222/013",
    customerName: "Melinta",
    transactionDate: "2025-12-22",
    amount: 90000,
    serviceDescription: "drainase 2 meter",
    paymentMethod: FinancePaymentMethod.TRANSFER_MANDIRI,
    notes: "Manual follow-up invoice for demo customer.",
    items: [
      { description: "drainase 2 meter", amount: 90000 },
    ],
  },
  {
    incomeCode: "INC-DEMO-251223-14",
    billNumber: "INV/INC/251223/014",
    customerName: "Fani",
    transactionDate: "2025-12-23",
    amount: 300000,
    serviceDescription: "pemasangan AC 1PK",
    paymentMethod: FinancePaymentMethod.TRANSFER_BCA,
    notes: "Manual income entry seeded for finance testing.",
    items: [
      { description: "pemasangan AC 1PK", amount: 300000 },
    ],
  },
] as const;

const demoExpenseRecords = [
  {
    billCode: "OPS-0001",
    transactionDate: "2025-12-01",
    expenseType: "Kontrakan",
    category: ExpenseCategory.OPERATIONAL,
    amount: 1500000,
    paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
    notes: "monthly office rent",
    items: [{ description: "Kontrakan", amount: 1500000 }],
  },
  {
    billCode: "OFF-0001",
    transactionDate: "2025-12-02",
    expenseType: "Wifi Office",
    category: ExpenseCategory.OFFICE,
    amount: 385000,
    paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
    notes: "monthly internet",
    items: [{ description: "Wifi Office", amount: 385000 }],
  },
  {
    billCode: "OFF-0002",
    transactionDate: "2025-12-03",
    expenseType: "CapCut & Canva",
    category: ExpenseCategory.SUBSCRIPTION,
    amount: 245000,
    paymentMethod: ExpensePaymentMethod.QRIS,
    notes: "design and editing subscription",
    items: [{ description: "CapCut & Canva", amount: 245000 }],
  },
  {
    billCode: "TRN-0001",
    transactionDate: "2025-12-04",
    expenseType: "BBM Yudha",
    category: ExpenseCategory.TRANSPORTATION,
    amount: 80000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "technician transport fuel",
    items: [{ description: "BBM Yudha", amount: 80000 }],
  },
  {
    billCode: "TRN-0002",
    transactionDate: "2025-12-05",
    expenseType: "BBM Bagas",
    category: ExpenseCategory.TRANSPORTATION,
    amount: 90000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "technician transport fuel",
    items: [{ description: "BBM Bagas", amount: 90000 }],
  },
  {
    billCode: "TRN-0003",
    transactionDate: "2025-12-06",
    expenseType: "BBM Beni",
    category: ExpenseCategory.TRANSPORTATION,
    amount: 85000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "technician transport fuel",
    items: [{ description: "BBM Beni", amount: 85000 }],
  },
  {
    billCode: "MAT-0001",
    transactionDate: "2025-12-07",
    expenseType: "Freon R410 2kg",
    category: ExpenseCategory.SPARE_PART,
    amount: 430000,
    paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
    notes: "stock material purchase",
    items: [{ description: "Freon R410 2kg", amount: 430000 }],
  },
  {
    billCode: "MAT-0002",
    transactionDate: "2025-12-08",
    expenseType: "Freon R32 2kg",
    category: ExpenseCategory.SPARE_PART,
    amount: 410000,
    paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
    notes: "stock material purchase",
    items: [{ description: "Freon R32 2kg", amount: 410000 }],
  },
  {
    billCode: "MAT-0003",
    transactionDate: "2025-12-09",
    expenseType: "Pipa 1PK 4 meter",
    category: ExpenseCategory.SPARE_PART,
    amount: 175000,
    paymentMethod: ExpensePaymentMethod.QRIS,
    notes: "stock material purchase",
    items: [{ description: "Pipa 1PK 4 meter", amount: 175000 }],
  },
  {
    billCode: "MAT-0004",
    transactionDate: "2025-12-10",
    expenseType: "Drainase 1 roll 50 meter",
    category: ExpenseCategory.SPARE_PART,
    amount: 220000,
    paymentMethod: ExpensePaymentMethod.BANK_TRANSFER,
    notes: "stock material purchase",
    items: [{ description: "Drainase 1 roll 50 meter", amount: 220000 }],
  },
  {
    billCode: "TOL-0001",
    transactionDate: "2025-12-11",
    expenseType: "Service Mesin Steam",
    category: ExpenseCategory.TOOLS,
    amount: 160000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "tool maintenance",
    items: [{ description: "Service Mesin Steam", amount: 160000 }],
  },
  {
    billCode: "MAT-0005",
    transactionDate: "2025-12-12",
    expenseType: "Thermis Sharp",
    category: ExpenseCategory.SPARE_PART,
    amount: 30000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "small spare part purchase",
    items: [{ description: "Thermis Sharp", amount: 30000 }],
  },
  {
    billCode: "OTH-0001",
    transactionDate: "2025-12-13",
    expenseType: "Jangkrik Pisang",
    category: ExpenseCategory.OTHER,
    amount: 35000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "miscellaneous field purchase",
    items: [{ description: "Jangkrik Pisang", amount: 35000 }],
  },
  {
    billCode: "MAT-0006",
    transactionDate: "2025-12-14",
    expenseType: "Kapasitor Kaki 3",
    category: ExpenseCategory.SPARE_PART,
    amount: 45000,
    paymentMethod: ExpensePaymentMethod.CASH,
    notes: "stock material purchase",
    items: [{ description: "Kapasitor Kaki 3", amount: 45000 }],
  },
  {
    billCode: "OPS-0002",
    transactionDate: "2025-12-15",
    expenseType: "Ganti Ban Dalam Yudha",
    category: ExpenseCategory.MAINTENANCE,
    amount: 70000,
    paymentMethod: ExpensePaymentMethod.QRIS,
    notes: "vehicle maintenance",
    items: [{ description: "Ganti Ban Dalam Yudha", amount: 70000 }],
  },
] as const;

function hashAdminPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });

  return ["scrypt", 16384, 8, 1, salt, derivedKey.toString("hex")].join("$");
}

function generateSeedPassword() {
  return `Fons!${randomBytes(9).toString("base64url")}`;
}

function getSeedAdminConfigs() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  const isProduction = process.env.NODE_ENV === "production";
  const allowDefaultDevAdminSeed =
    process.env.ALLOW_DEFAULT_DEV_ADMIN_SEED === "true"
    || (!isProduction && process.env.ALLOW_DEFAULT_DEV_ADMIN_SEED !== "false");

  if ((email && !password) || (!email && password)) {
    throw new Error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be provided together.");
  }

  const accounts = allowDefaultDevAdminSeed
    ? DEFAULT_DEV_TEST_ACCOUNTS.map((account) => ({
        ...account,
        password: generateSeedPassword(),
        source: "default-dev" as const,
      }))
    : [];

  if (!email && !password) {
    return accounts;
  }

  accounts.unshift({
    email,
    password,
    name: process.env.ADMIN_SEED_NAME?.trim() || "Super Admin",
    role:
      process.env.ADMIN_SEED_ROLE === AdminRole.SQUAD
        ? AdminRole.SQUAD
        : process.env.ADMIN_SEED_ROLE === AdminRole.ADMIN
          ? AdminRole.ADMIN
          : AdminRole.SUPER_ADMIN,
    source: "env" as const,
  });

  return accounts;
}

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function buildIncomeSummaryDescription(items: Array<{ description: string }>) {
  if (items.length <= 1) {
    return items[0]?.description || "Manual income entry";
  }

  return `${items[0].description} +${items.length - 1} more`;
}

function sumIncomeItems(items: Array<{ amount: number }>) {
  return items.reduce((total, item) => total + item.amount, 0);
}

async function main() {
  const seenAliases = new Set<string>();
  const seenNames = new Set<string>();

  for (const [index, squad] of squads.entries()) {
    const normalizedName = normalizeSquadName(squad.name);
    const alias = generateSquadAlias(squad.name);
    const code = `SQD-${String(index + 1).padStart(2, "0")}`;

    if (seenAliases.has(alias)) {
      throw new Error(`Duplicate squad alias in seed data: ${alias}`);
    }

    if (seenNames.has(normalizedName.toLowerCase())) {
      throw new Error(`Duplicate squad name in seed data: ${normalizedName}`);
    }

    seenAliases.add(alias);
    seenNames.add(normalizedName.toLowerCase());

    await prisma.squad.upsert({
      where: { alias },
      update: {
        alias,
        name: normalizedName,
        normalizedName,
        phone: squad.phone,
        email: squad.email,
        code,
        isActive: true,
      },
      create: {
        alias,
        name: normalizedName,
        normalizedName,
        phone: squad.phone,
        email: squad.email,
        code,
        isActive: true,
      },
    });
  }

  for (const serviceType of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { slug: serviceType.slug },
      update: {
        name: serviceType.name,
        description: serviceType.description,
        estimatedDuration: serviceType.estimatedDuration,
        isActive: true,
      },
      create: serviceType,
    });
  }

  const customerIds = new Map<string, string>();

  for (const customer of demoCustomers) {
    const record = await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {
        fullName: customer.fullName,
        email: customer.email,
      },
      create: {
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      },
      select: {
        id: true,
      },
    });

    customerIds.set(customer.key, record.id);
  }

  const serviceTypeIds = new Map<string, string>();
  const seededServiceTypes = await prisma.serviceType.findMany({
    where: {
      slug: {
        in: Array.from(new Set(demoBookings.map((booking) => booking.serviceTypeSlug))),
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  for (const serviceType of seededServiceTypes) {
    serviceTypeIds.set(serviceType.slug, serviceType.id);
  }

  const bookingIds = new Map<string, string>();

  for (const booking of demoBookings) {
    const customerId = customerIds.get(booking.customerKey);
    const serviceTypeId = serviceTypeIds.get(booking.serviceTypeSlug);

    if (!customerId || !serviceTypeId) {
      throw new Error(`Missing seed dependency for booking ${booking.bookingCode}`);
    }

    const record = await prisma.booking.upsert({
      where: { bookingCode: booking.bookingCode },
      update: {
        customerId,
        serviceTypeId,
        bookingDate: toDateOnly(booking.bookingDate),
        timeSlot: booking.timeSlot,
        status: booking.status,
        contactName: booking.contactName,
        contactPhone: booking.contactPhone,
        contactEmail: booking.contactEmail,
        addressLine1: booking.addressLine1,
        city: booking.city,
        notes: booking.notes,
      },
      create: {
        bookingCode: booking.bookingCode,
        customerId,
        serviceTypeId,
        bookingDate: toDateOnly(booking.bookingDate),
        timeSlot: booking.timeSlot,
        status: booking.status,
        contactName: booking.contactName,
        contactPhone: booking.contactPhone,
        contactEmail: booking.contactEmail,
        addressLine1: booking.addressLine1,
        city: booking.city,
        notes: booking.notes,
      },
      select: {
        id: true,
      },
    });

    bookingIds.set(booking.bookingCode, record.id);
  }

  for (const income of demoIncomeRecords) {
    const items = income.items.length
      ? income.items
      : [{ description: income.serviceDescription, amount: income.amount }];

    await prisma.incomeRecord.upsert({
      where: {
        billNumber: income.billNumber,
      },
      update: {
        incomeCode: income.incomeCode,
        bookingId: income.bookingCode ? bookingIds.get(income.bookingCode) || null : null,
        customerName: income.customerName,
        transactionDate: toDateOnly(income.transactionDate),
        amount: sumIncomeItems(items),
        serviceDescription: buildIncomeSummaryDescription(items),
        paymentMethod: income.paymentMethod,
        notes: income.notes,
        items: {
          deleteMany: {},
          create: items.map((item, index) => ({
            sortOrder: index,
            description: item.description,
            amount: item.amount,
          })),
        },
      },
      create: {
        incomeCode: income.incomeCode,
        bookingId: income.bookingCode ? bookingIds.get(income.bookingCode) || null : null,
        customerName: income.customerName,
        transactionDate: toDateOnly(income.transactionDate),
        billNumber: income.billNumber,
        amount: sumIncomeItems(items),
        serviceDescription: buildIncomeSummaryDescription(items),
        paymentMethod: income.paymentMethod,
        notes: income.notes,
        items: {
          create: items.map((item, index) => ({
            sortOrder: index,
            description: item.description,
            amount: item.amount,
          })),
        },
      },
    });
  }

  for (const expense of demoExpenseRecords) {
    await prisma.expenseRecord.upsert({
      where: {
        billCode: expense.billCode,
      },
      update: {
        transactionDate: toDateOnly(expense.transactionDate),
        expenseType: expense.expenseType,
        category: expense.category,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes,
        items: {
          deleteMany: {},
          create: expense.items.map((item, index) => ({
            sortOrder: index,
            description: item.description,
            amount: item.amount,
          })),
        },
      },
      create: {
        billCode: expense.billCode,
        transactionDate: toDateOnly(expense.transactionDate),
        expenseType: expense.expenseType,
        category: expense.category,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes,
        items: {
          create: expense.items.map((item, index) => ({
            sortOrder: index,
            description: item.description,
            amount: item.amount,
          })),
        },
      },
    });
  }

  const seedAdmins = getSeedAdminConfigs();

  for (const seedAdmin of seedAdmins) {
    const linkedSquad =
      "squadAlias" in seedAdmin && seedAdmin.squadAlias
        ? await prisma.squad.findUnique({
            where: {
              alias: seedAdmin.squadAlias,
            },
            select: {
              id: true,
            },
          })
        : null;

    await prisma.adminUser.upsert({
      where: {
        email: seedAdmin.email,
      },
      update: {
        name: seedAdmin.name,
        passwordHash: hashAdminPassword(seedAdmin.password),
        role: seedAdmin.role,
        squadId: linkedSquad?.id || null,
        isActive: true,
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
      },
      create: {
        email: seedAdmin.email,
        name: seedAdmin.name,
        passwordHash: hashAdminPassword(seedAdmin.password),
        role: seedAdmin.role,
        squadId: linkedSquad?.id || null,
        mustChangePassword: false,
        passwordUpdatedAt: new Date(),
      },
    });

    console.log(seedAdmin.source === "default-dev"
      ? `[seed] admin user ready (${seedAdmin.source}): ${seedAdmin.email} / one-time password ${seedAdmin.password}`
      : `[seed] admin user ready (${seedAdmin.source}): ${seedAdmin.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
