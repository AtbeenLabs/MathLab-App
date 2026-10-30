#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
async function main(){
 const file=path.resolve(process.argv[2]||path.join(__dirname,'..','atbinyar-primecount-api.js'));
 const createModule=require(file);
 assert.equal(typeof createModule,'function');
 const wasm=await createModule();
 assert.equal(typeof wasm._atbinyar_prime_count,'function');
 const cases=[
  [0,0],[1,0],[2,1],[10,4],[100,25],[1000,168],[1000000,78498],
  [100000000,5761455],[1000000000,50847534],[10000000000,455052511],
  [1000000000000,37607912018],[10000000000000,346065536839],
  [100000000000000,3204941750802]
 ];
 for(const [limit,expected] of cases){
  assert.equal(wasm._atbinyar_prime_count(BigInt(limit)),BigInt(expected),`pi(${limit})`);
 }
 console.log(`Exact prime-count WASM tests passed (${cases.length} values to 10^14).`);
}
main().catch(error=>{console.error(error);process.exitCode=1;});
