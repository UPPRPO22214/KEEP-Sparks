import crypto from "crypto";

function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  return { hash, dataCheckString, params };
}

export function verifyTelegramInitData(initData: string, botToken: string) {
  const { hash, dataCheckString, params } = parseInitData(initData);
  if (!hash) return { ok: false as const, reason: "No hash" };

  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  // calculated_hash = HMAC_SHA256(data_check_string, secret_key) hex
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (calculatedHash !== hash) return { ok: false as const, reason: "Bad hash" };

  // user лежит в params.get("user") как JSON
  const userRaw = params.get("user");
  const user = userRaw ? (JSON.parse(userRaw) as { id: number; first_name?: string }) : null;

  return { ok: true as const, user };
}
