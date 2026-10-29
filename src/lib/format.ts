export const formatCurrency = (value?: number | null, unit?: "Cr" | "L") => value == null ? "—" : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
export const currency = (value?: number | null) => formatCurrency(value);
export const crore = (value?: number | null) => value == null ? "—" : `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)} Cr`;
export const formatDate = (value?: string | null, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => value ? new Intl.DateTimeFormat("en-IN", options).format(new Date(`${value}T12:00:00`)) : "To be announced";
export const formatPercent = (value?: number | null) => value == null ? "—" : `${value.toFixed(2)}x`;
export const dateRange = (open: string, close: string) => `${formatDate(open)} – ${formatDate(close)}`;
export const priceBand = (low?: number | null, high?: number | null) => low == null || high == null ? "To be announced" : `₹${low.toLocaleString("en-IN")} – ₹${high.toLocaleString("en-IN")}`;
