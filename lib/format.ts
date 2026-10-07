const nf = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const SYMBOL: Record<string, string> = { TL: "₺", USD: "$", EUR: "€", XAU: "gr" };

export const money = (n: number, cur = "TL") => `${nf.format(n)} ${SYMBOL[cur] ?? cur}`;
