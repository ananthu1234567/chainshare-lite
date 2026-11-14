import { describe, it, expect } from "vitest";
import { encryptFile, decryptFile, sha256Hex } from "./crypto";

const makeFile = (text) => new File([text], "note.txt", { type: "text/plain" });

describe("crypto", () => {
  it("round trip returns the same bytes and filename", async () => {
    const enc = await encryptFile(makeFile("hello world"), "correct horse battery");
    const out = await decryptFile(enc, "correct horse battery");
    expect(out.name).toBe("note.txt");
    expect(new TextDecoder().decode(out.data)).toBe("hello world");
  });

  it("wrong password fails", async () => {
    const enc = await encryptFile(makeFile("secret"), "correct horse battery");
    await expect(decryptFile(enc, "wrong password!!")).rejects.toThrow();
  });

  it("tampering is detected", async () => {
    const enc = await encryptFile(makeFile("secret"), "correct horse battery");
    enc[enc.length - 1] ^= 1;
    await expect(decryptFile(enc, "correct horse battery")).rejects.toThrow();
  });

  it("same file and password encrypt differently each time", async () => {
    const a = await encryptFile(makeFile("same"), "correct horse battery");
    const b = await encryptFile(makeFile("same"), "correct horse battery");
    expect(await sha256Hex(a)).not.toBe(await sha256Hex(b));
  });

  it("hash is a valid bytes32 string", async () => {
    const h = await sha256Hex(new Uint8Array([1, 2, 3]));
    expect(h).toMatch(/^0x[a-f0-9]{64}$/);
  });
});
