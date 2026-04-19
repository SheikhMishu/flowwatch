// Lightweight UA string parser — no external dependencies

export interface ParsedUA {
  browser: string;
  os: string;
  device: "desktop" | "mobile" | "tablet" | "bot";
}

export function parseUA(ua: string): ParsedUA {
  if (!ua) return { browser: "Unknown", os: "Unknown", device: "desktop" };

  // Bot detection (check first — many bots also include Chrome/Safari tokens)
  if (
    /bot|crawler|spider|crawl|slurp|bingbot|googlebot|yandex|baidu|duckduck|semrush|ahrefs|mj12bot|archive|facebookexternalhit|twitterbot|linkedinbot/i.test(ua)
  ) {
    return { browser: "Bot", os: "Bot", device: "bot" };
  }

  // Device
  let device: ParsedUA["device"] = "desktop";
  if (/iPad|Tablet|PlayBook/i.test(ua)) {
    device = "tablet";
  } else if (/Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = "mobile";
  }

  // OS
  let os = "Unknown";
  if (/Windows NT 10/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6\.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone/i.test(ua)) os = "iOS";
  else if (/iPad/i.test(ua)) os = "iPadOS";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) {
    const v = ua.match(/Android ([\d.]+)/i)?.[1];
    os = v ? `Android ${v.split(".")[0]}` : "Android";
  } else if (/Linux/i.test(ua)) os = "Linux";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";

  // Browser (order matters — Edge/OPR must come before Chrome)
  let browser = "Unknown";
  if (/Edg\//i.test(ua)) {
    const v = ua.match(/Edg\/([\d.]+)/i)?.[1]?.split(".")[0];
    browser = v ? `Edge ${v}` : "Edge";
  } else if (/OPR\//i.test(ua) || /Opera\//i.test(ua)) {
    browser = "Opera";
  } else if (/SamsungBrowser/i.test(ua)) {
    browser = "Samsung Browser";
  } else if (/Firefox\/([\d.]+)/i.test(ua)) {
    const v = ua.match(/Firefox\/([\d.]+)/i)?.[1]?.split(".")[0];
    browser = v ? `Firefox ${v}` : "Firefox";
  } else if (/Chrome\/([\d.]+)/i.test(ua) && !/Chromium/i.test(ua)) {
    const v = ua.match(/Chrome\/([\d.]+)/i)?.[1]?.split(".")[0];
    browser = v ? `Chrome ${v}` : "Chrome";
  } else if (/Safari\/([\d.]+)/i.test(ua) && /Version\/([\d.]+)/i.test(ua)) {
    browser = "Safari";
  } else if (/Chromium/i.test(ua)) {
    browser = "Chromium";
  }

  return { browser, os, device };
}

export function getIP(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ??
    "unknown"
  );
}
