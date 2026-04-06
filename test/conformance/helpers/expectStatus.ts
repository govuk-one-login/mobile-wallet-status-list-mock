export async function expectStatus(
  res: Response,
  expected: number,
): Promise<void> {
  try {
    expect(res.status).toBe(expected);
  } catch (e) {
    const body = await res.text();
    console.error(`Expected ${expected}, got ${res.status}. Body:`, body);
    throw e;
  }
}