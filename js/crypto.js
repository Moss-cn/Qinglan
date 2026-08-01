/* 密码学工具：浏览器端，file:// 可用。支持 UTF-8（中文碎片也正确编解码）。 */
window.CRYPTO = (function () {
  function b64enc(s) {
    try {
      const bytes = new TextEncoder().encode(s);
      let bin = "";
      for (const b of bytes) bin += String.fromCharCode(b);
      return btoa(bin);
    } catch (e) { return "[base64 编码失败：含不可编码字符]"; }
  }
  function b64dec(s) {
    try {
      const bin = atob(s);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder("utf-8").decode(bytes);
    } catch (e) { return "[base64 解码失败]"; }
  }
  function hexEnc(s) {
    const bytes = new TextEncoder().encode(s);
    let o = "";
    for (const b of bytes) o += b.toString(16).padStart(2, "0");
    return o;
  }
  function hexDec(s) {
    s = (s || "").trim().replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]+$/.test(s) || s.length % 2) {
      return "[hex 解码失败：输入须为偶数位的十六进制字符（0-9 / a-f），例：696c7573。若是想「编码」请用 encode hex <文本>]";
    }
    const bytes = new Uint8Array(s.length / 2);
    for (let i = 0; i < s.length; i += 2) bytes[i / 2] = parseInt(s.substr(i, 2), 16);
    try { return new TextDecoder("utf-8").decode(bytes); }
    catch (e) { return "[hex 解码失败]"; }
  }
  function rot13(s) {
    return s.replace(/[a-zA-Z]/g, c => {
      const b = c <= "Z" ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - b + 13) % 26 + b);
    });
  }
  function caesar(s, shift) {
    shift = ((shift % 26) + 26) % 26;
    return s.replace(/[a-zA-Z]/g, c => {
      const b = c <= "Z" ? 65 : 97;
      return String.fromCharCode((c.charCodeAt(0) - b + shift) % 26 + b);
    });
  }
  function vigenere(s, key, dec) {
    key = (key || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (!key) return "[维吉尼亚需要密钥]";
    // 拉丁字母：原位移逻辑（与旧版一致，便签解密不受影响）
    // 中日韩统一表意文字（U+4E00–U+9FFF）：在码位区间内按密钥位移，可逆，用于中文密文
    const base = 0x4E00, range = 0x9FFF - 0x4E00 + 1;
    let ki = 0, out = "";
    for (const ch of s) {
      const cp = ch.codePointAt(0);
      if (/[a-zA-Z]/.test(ch)) {
        const b = ch <= "Z" ? 65 : 97;
        const shift = key.charCodeAt(ki % key.length) - 65;
        const d = dec ? -shift : shift;
        out += String.fromCharCode((cp - b + d + 26) % 26 + b); ki++;
      } else if (cp >= 0x4E00 && cp <= 0x9FFF) {
        const shift = key.charCodeAt(ki % key.length) - 65;
        const d = dec ? -shift : shift;
        const np = base + ((cp - base + d) % range + range) % range;
        out += String.fromCodePoint(np); ki++;
      } else {
        out += ch; // 数字/标点/空格原样保留
      }
    }
    return out;
  }
  return { b64enc, b64dec, hexEnc, hexDec, rot13, caesar, vigenere };
})();
