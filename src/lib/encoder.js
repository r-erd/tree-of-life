/**
 * encoder.js — Share code encode/decode
 *
 * Format: V<version>.<base62>
 *
 * The state is a binary bitfield: one bit per node in canonical YAML order
 * (depth-first walk of category → skill → children recursively).
 * 1 = skilled, 0 = not skilled.
 * Bits are packed into bytes (LSB first within each byte), then base62-encoded.
 */

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Walk all nodes in canonical DFS order and return array of IDs.
 * @param {Array} categories
 * @returns {string[]}
 */
export function getCanonicalOrder(categories) {
  const ids = []
  function walk(nodes) {
    if (!nodes) return
    for (const node of nodes) {
      ids.push(node.id)
      if (node.children) walk(node.children)
    }
  }
  for (const cat of categories) {
    for (const skill of cat.skills) {
      walk([skill])
    }
  }
  return ids
}

/**
 * Encode a Set of skilled node IDs into a share code string.
 * @param {Set<string>} skilled
 * @param {Array} categories
 * @param {number} version
 * @returns {string}
 */
export function encode(skilled, categories, version) {
  const order = getCanonicalOrder(categories)
  const bytes = new Uint8Array(Math.ceil(order.length / 8))

  for (let i = 0; i < order.length; i++) {
    if (skilled.has(order[i])) {
      bytes[Math.floor(i / 8)] |= (1 << (i % 8))
    }
  }

  let encoded = ''
  // Convert bytes to a big integer, then encode in base62
  // Simple approach: encode each byte pair as base62 chunks
  let n = BigInt(0)
  for (let i = bytes.length - 1; i >= 0; i--) {
    n = (n << 8n) | BigInt(bytes[i])
  }

  if (n === 0n) {
    encoded = BASE62_CHARS[0]
  } else {
    while (n > 0n) {
      encoded = BASE62_CHARS[Number(n % 62n)] + encoded
      n = n / 62n
    }
  }

  return `V${version}.${encoded}`
}

/**
 * Decode a share code string into a Set of skilled node IDs.
 * @param {string} code
 * @param {Array} categories
 * @returns {{ version: number, skilled: Set<string> } | { error: string }}
 */
export function decode(code, categories) {
  const match = code.trim().match(/^V(\d+)\.([0-9A-Za-z]+)$/)
  if (!match) return { error: 'Invalid code format. Expected V<n>.<code>' }

  const version = parseInt(match[1], 10)
  const encoded = match[2]

  // Decode base62 to BigInt
  let n = 0n
  for (const ch of encoded) {
    const idx = BASE62_CHARS.indexOf(ch)
    if (idx === -1) return { error: 'Invalid character in code' }
    n = n * 62n + BigInt(idx)
  }

  // Convert BigInt to bytes
  const order = getCanonicalOrder(categories)
  const byteCount = Math.ceil(order.length / 8)
  const bytes = new Uint8Array(byteCount)
  for (let i = 0; i < byteCount; i++) {
    bytes[i] = Number(n & 0xffn)
    n = n >> 8n
  }

  // Build skilled set
  const skilled = new Set()
  for (let i = 0; i < order.length; i++) {
    if (bytes[Math.floor(i / 8)] & (1 << (i % 8))) {
      skilled.add(order[i])
    }
  }

  return { version, skilled }
}
