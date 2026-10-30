'use strict';

importScripts(new URL('atbinyar-primecount-api.js', self.location.href).href);

let primecountModulePromise = null;

self.onmessage = event => {
  const { id, limit } = event.data || {};
  (async () => {
    try {
      if (!/^\\d+$/.test(String(limit))) throw new Error('Invalid prime-count input.');
      if (!primecountModulePromise) {
        if (typeof self.createAtbinYarPrimecountModule !== 'function') {
          throw new Error('The exact prime-count WASM module is unavailable.');
        }
        primecountModulePromise = self.createAtbinYarPrimecountModule();
      }
      const module = await primecountModulePromise;
      const result = module._atbinyar_prime_count(BigInt(limit));
      if (typeof result !== 'bigint' || result < 0n) throw new Error('Primecount returned an invalid result.');
      self.postMessage({ id, count: result.toString() });
    } catch (error) {
      self.postMessage({ id, error: error?.message || String(error) });
    }
  })();
};
