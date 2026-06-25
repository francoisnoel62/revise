// ABOUTME: Type declaration for nspell — CJS Hunspell-compatible spell checker
// ABOUTME: Constructor accepts separate aff/dic buffers or a dictionary object

declare module 'nspell' {
  interface NSpellDictionary {
    aff: Buffer | Uint8Array | string;
    dic?: Buffer | Uint8Array | string;
  }

  class NSpell {
    constructor(aff: Buffer | Uint8Array | string | NSpellDictionary, dic?: Buffer | Uint8Array | string);
    correct(word: string): boolean;
    suggest(word: string): string[];
  }

  export = NSpell;
}
