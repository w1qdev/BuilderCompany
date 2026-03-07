export async function sendSmsCode(
  phone: string,
  code: string
): Promise<boolean> {
  // TODO: integrate real SMS provider (SMS_API_KEY, SMS_PROVIDER env vars)
  // В production не логируем реальные коды, чтобы не светить их в логах
  if (process.env.NODE_ENV !== "production") {
    console.log(`[SMS] Код для ${phone}: ${code}`);
  }
  return true;
}
