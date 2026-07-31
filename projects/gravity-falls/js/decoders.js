// decoders.js — pure cipher logic, no DOM dependencies

const Decoders = {

  caesar(text, shift = 3) {
    shift = ((shift % 26) + 26) % 26;
    return text.toUpperCase().split('').map(ch => {
      if (ch >= 'A' && ch <= 'Z') {
        return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
      }
      return ch;
    }).join('');
  },

  atbash(text) {
    return text.toUpperCase().split('').map(ch => {
      if (ch >= 'A' && ch <= 'Z') {
        return String.fromCharCode(90 - (ch.charCodeAt(0) - 65));
      }
      return ch;
    }).join('');
  },

  a1z26(text) {
    // Accept numbers separated by spaces, dashes, or commas
    const tokens = text.trim().split(/[\s,\-]+/);
    return tokens.map(token => {
      const n = parseInt(token, 10);
      if (!isNaN(n) && n >= 1 && n <= 26) {
        return String.fromCharCode(64 + n);
      }
      // pass through non-numeric tokens (punctuation, etc.)
      return token.length === 1 ? token : '?';
    }).join('');
  },

  vigenere(text, key = 'STANFORD') {
    text = text.toUpperCase();
    key = key.toUpperCase().replace(/[^A-Z]/g, '');
    if (!key.length) return '(key cannot be empty)';
    let ki = 0;
    return text.split('').map(ch => {
      if (ch >= 'A' && ch <= 'Z') {
        const shift = key[ki % key.length].charCodeAt(0) - 65;
        ki++;
        return String.fromCharCode(((ch.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
      }
      return ch;
    }).join('');
  },

  // Caesar then Atbash (most common multi-layer combo in the show)
  multilayer(text) {
    const step1 = Decoders.caesar(text, 3);
    const step2 = Decoders.atbash(step1);
    return `Caesar→Atbash: ${step2}\nAtbash→Caesar: ${Decoders.caesar(Decoders.atbash(text), 3)}`;
  }

};

// Make available globally (no modules needed for GitHub Pages vanilla)
window.Decoders = Decoders;
