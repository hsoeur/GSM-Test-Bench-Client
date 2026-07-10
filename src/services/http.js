// Lightweight HTTP client with timeout, console logging and JSON convenience

let __reqCounter = 0

function ts() {
  return new Date().toISOString()
}

function safeToString(body) {
  if (body == null) return ''
  if (typeof body === 'string') return body
  try {
    return JSON.stringify(body)
  } catch (error) {
    void error
    return '[unserializable body]'
  }
}

function truncate(s, max = 1000) {
  if (!s) return ''
  return s.length > max ? `${s.slice(0, max)}…(${s.length} chars)` : s
}

export async function request(url, { method = 'GET', timeout = 4000, headers = {}, ...rest } = {}) {
  const controller = new AbortController()
  const toId = setTimeout(() => controller.abort(), timeout)
  const reqId = ++__reqCounter

  // Log request
  try {
    const bodyPreview = truncate(safeToString(rest?.body))
     
    console.log(`[HTTP ${reqId}] ➜ ${method} ${url} @ ${ts()}`, { headers, timeout, body: bodyPreview })
  } catch (error) {
    void error
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      ...rest,
    })

    // Log response (status + body excerpt)
    try {
      const clone = res.clone()
      const text = await clone.text()
      const preview = truncate(text)
       
      console.log(`[HTTP ${reqId}] ⇦ ${res.status} ${res.ok ? 'OK' : 'ERR'} @ ${ts()}`, { body: preview })
    } catch (e) {
       
      console.warn(`[HTTP ${reqId}] ⇦ (response logging failed)`, String(e?.message || e))
    }

    return res
  } catch (err) {
     
    console.error(`[HTTP ${reqId}] ✖ Error @ ${ts()}`, String(err?.message || err))
    throw err
  } finally {
    clearTimeout(toId)
  }
}

export async function getJson(url, opts = {}) {
  const res = await request(url, { ...opts, method: opts.method || 'GET' })
  let data = null
  try {
    data = await res.json()
  } catch (error) {
    void error
    // ignore JSON parse errors; keep data as null
  }
  return { ok: res.ok, status: res.status, data }
}
