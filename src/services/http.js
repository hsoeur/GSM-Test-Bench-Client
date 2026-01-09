// Lightweight HTTP client with timeout and JSON convenience

export async function request(url, { method = 'GET', timeout = 4000, headers = {}, ...rest } = {}) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      ...rest,
    })
    return res
  } finally {
    clearTimeout(id)
  }
}

export async function getJson(url, opts = {}) {
  const res = await request(url, { ...opts, method: opts.method || 'GET' })
  let data = null
  try {
    data = await res.json()
  } catch (_) {
    // ignore JSON parse errors; keep data as null
  }
  return { ok: res.ok, status: res.status, data }
}
