export default async function fetchJson<JSON = unknown>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<JSON> {
  try {
    const res = await fetch(input, init);
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('An unexpected error happened:', error);
    throw new Error('Error fetching data.');
    return {} as JSON;
  }
}
