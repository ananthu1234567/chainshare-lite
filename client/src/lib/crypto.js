// File format on the server:
//
// The encrypted payload contains:
// [ salt 16 bytes ][ iv 12 bytes ][ AES-GCM ciphertext + 16-byte tag ]
// [ 4-byte metadata length ][ metadata JSON: name, type ][ file bytes ]
// So the server never sees the real filename.

const ITERATIONS = 600_000;
const SALT_LEN = 16;
const IV_LEN = 12; // recommended IV size for AES-GCM

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

async function keyFromPassword(password, salt) {
  const base = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptFile(file, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const key = await keyFromPassword(password, salt);

  const meta = textEncoder.encode(JSON.stringify({ name: file.name, type: file.type }));
  const content = new Uint8Array(await file.arrayBuffer());
  const payload = new Uint8Array(4 + meta.length + content.length);

  new DataView(payload.buffer).setUint32(0, meta.length);
  payload.set(meta, 4);
  payload.set(content, 4 + meta.length);

  const cipher = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload)
  );

  const out = new Uint8Array(SALT_LEN + IV_LEN + cipher.length);
  out.set(salt, 0);
  out.set(iv, SALT_LEN);
  out.set(cipher, SALT_LEN + IV_LEN);
  return out;
}

export async function decryptFile(encrypted, password) {
  const salt = encrypted.slice(0, SALT_LEN);
  const iv = encrypted.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const cipher = encrypted.slice(SALT_LEN + IV_LEN);
  const key = await keyFromPassword(password, salt);

  let payload;
  try {
    payload = new Uint8Array(
      await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher)
    );
  } catch {
    throw new Error("Wrong password, or the file has been altered.");
  }

  const metaLen = new DataView(payload.buffer, payload.byteOffset).getUint32(0);
  const meta = JSON.parse(textDecoder.decode(payload.slice(4, 4 + metaLen)));
  const data = payload.slice(4 + metaLen);
  return { name: meta.name, type: meta.type, data };
}

export async function sha256Hex(bytes) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return "0x" + [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
}
