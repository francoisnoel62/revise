// ABOUTME: Type declaration for dictionary-fr — French Hunspell dictionary
// ABOUTME: ESM module that exports the dictionary object directly as default

declare module 'dictionary-fr' {
  interface FrenchDictionary {
    aff: Uint8Array;
    dic: Uint8Array;
  }

  const dictionary: FrenchDictionary;
  export default dictionary;
}
