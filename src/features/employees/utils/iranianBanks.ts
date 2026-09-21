export type IranianBank = { name: string; logo: string };

const LOGO_BASE = "https://ir-banks.github.io/logos/banks";

export const IRANIAN_CARD_BANKS: Record<string, IranianBank> = {
  "627412": { name: "بانک اقتصاد نوین", logo: LOGO_BASE + "/Eghtesad_Novin.svg" },
  "627381": { name: "بانک انصار / سپه", logo: LOGO_BASE + "/Ansar.svg" },
  "505785": { name: "بانک ایران زمین", logo: LOGO_BASE + "/Iran_Zamin.svg" },
  "622106": { name: "بانک پارسیان", logo: LOGO_BASE + "/Parsian.svg" },
  "639194": { name: "بانک پارسیان", logo: LOGO_BASE + "/Parsian.svg" },
  "627884": { name: "بانک پارسیان", logo: LOGO_BASE + "/Parsian.svg" },
  "639347": { name: "بانک پاسارگاد", logo: LOGO_BASE + "/Pasargad.svg" },
  "502229": { name: "بانک پاسارگاد", logo: LOGO_BASE + "/Pasargad.svg" },
  "636214": { name: "بانک آینده", logo: LOGO_BASE + "/Ayandeh.svg" },
  "627353": { name: "بانک تجارت", logo: LOGO_BASE + "/Tejarat.svg" },
  "585983": { name: "بانک تجارت", logo: LOGO_BASE + "/Tejarat.svg" },
  "502908": { name: "بانک توسعه تعاون", logo: LOGO_BASE + "/Tosee_Taavon.svg" },
  "627648": { name: "بانک توسعه صادرات ایران", logo: LOGO_BASE + "/Tosee_Saderat.svg" },
  "207177": { name: "بانک توسعه صادرات ایران", logo: LOGO_BASE + "/Tosee_Saderat.svg" },
  "636949": { name: "بانک حکمت ایرانیان / سپه", logo: LOGO_BASE + "/Hekmat.svg" },
  "502938": { name: "بانک دی", logo: LOGO_BASE + "/Dey.svg" },
  "589463": { name: "بانک رفاه کارگران", logo: LOGO_BASE + "/Refah.svg" },
  "621986": { name: "بانک سامان", logo: LOGO_BASE + "/Saman.svg" },
  "589210": { name: "بانک سپه", logo: LOGO_BASE + "/Sepah.svg" },
  "639607": { name: "بانک سرمایه", logo: LOGO_BASE + "/Sarmayeh.svg" },
  "639346": { name: "بانک سینا", logo: LOGO_BASE + "/Sina.svg" },
  "502806": { name: "بانک شهر", logo: LOGO_BASE + "/Shahr.svg" },
  "504706": { name: "بانک شهر", logo: LOGO_BASE + "/Shahr.svg" },
  "603769": { name: "بانک صادرات ایران", logo: LOGO_BASE + "/Saderat.svg" },
  "627961": { name: "بانک صنعت و معدن", logo: LOGO_BASE + "/Sanat_Madan.svg" },
  "606373": { name: "بانک قرض الحسنه مهر ایران", logo: LOGO_BASE + "/Mehr_Iran.svg" },
  "639599": { name: "بانک قوامین / سپه", logo: LOGO_BASE + "/Ghavamin.svg" },
  "627488": { name: "بانک کارآفرین", logo: LOGO_BASE + "/Karafarin.svg" },
  "502910": { name: "بانک کارآفرین", logo: LOGO_BASE + "/Karafarin.svg" },
  "603770": { name: "بانک کشاورزی", logo: LOGO_BASE + "/Keshavarzi.svg" },
  "639217": { name: "بانک کشاورزی", logo: LOGO_BASE + "/Keshavarzi.svg" },
  "505416": { name: "بانک گردشگری", logo: LOGO_BASE + "/Gardeshgari.svg" },
  "505426": { name: "بانک گردشگری", logo: LOGO_BASE + "/Gardeshgari.svg" },
  "636795": { name: "بانک مرکزی جمهوری اسلامی ایران", logo: LOGO_BASE + "/Bank_Markazi.svg" },
  "628023": { name: "بانک مسکن", logo: LOGO_BASE + "/Maskan.svg" },
  "610433": { name: "بانک ملت", logo: LOGO_BASE + "/Mellat.svg" },
  "991975": { name: "بانک ملت", logo: LOGO_BASE + "/Mellat.svg" },
  "603799": { name: "بانک ملی ایران", logo: LOGO_BASE + "/Melli.svg" },
  "639370": { name: "بانک مهر اقتصاد / سپه", logo: LOGO_BASE + "/Mehr_Eghtesad.svg" },
  "627760": { name: "پست بانک ایران", logo: LOGO_BASE + "/Postbank.svg" },
  "628157": { name: "موسسه اعتباری توسعه", logo: LOGO_BASE + "/Tosee.svg" },
  "505801": { name: "موسسه اعتباری کوثر / سپه", logo: LOGO_BASE + "/Kosar.svg" },
  "606256": { name: "موسسه اعتباری ملل", logo: LOGO_BASE + "/Melall.svg" },
  "504172": { name: "بانک قرض الحسنه رسالت", logo: LOGO_BASE + "/Resalat.svg" },
  "507677": { name: "موسسه نور", logo: LOGO_BASE + "/Noor.svg" },
  "585947": { name: "بانک خاورمیانه", logo: LOGO_BASE + "/Khavar_Mianeh.svg" },
};

export function getIranianBankByCard(cardNumber: string | null | undefined): IranianBank | null {
  const digits = (cardNumber ?? "").replace(/\\D/g, "");
  if (digits.length < 6) return null;
  return IRANIAN_CARD_BANKS[digits.slice(0, 6)] ?? null;
}

export function formatCardNumber(cardNumber: string | null | undefined): string {
  const digits = (cardNumber ?? "").replace(/\\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

export function formatIban(iban: string | null | undefined): string {
  const normalized = (iban ?? "").replace(/\\s/g, "").toUpperCase();
  if (!normalized) return "—";
  const digits = normalized.replace(/^IR/, "").replace(/\\D/g, "").slice(0, 24);
  if (!digits) return normalized;
  return ("IR" + digits).replace(/(.{4})/g, "$1-").replace(/-$/, "");
}
