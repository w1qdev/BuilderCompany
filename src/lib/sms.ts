export async function sendSmsCode(phone: string, code: string): Promise<boolean> {
  // TODO: integrate real SMS provider (SMS_API_KEY, SMS_PROVIDER env vars)
  console.log(`[SMS] Код для ${phone}: ${code}`);
  return true;
}
