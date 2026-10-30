#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('const B0 = 0n, B1 = 1n, B2 = 2n;');
const end=html.indexOf('/* ===== THEME TOGGLE ===== */',start);
assert.notEqual(start,-1); assert.notEqual(end,-1);
const api=new Function(html.slice(start,end)+`
 return {gcdBig,isPrime,factorize,divisorsOf,sigmaOf,getBasePrimes,isPrimeInWindow};
`)();
assert.equal(api.gcdBig(48n,18n),6n);
assert.equal(api.gcdBig(-48n,18n),6n);
assert.equal(api.isPrime(1),false);
assert.equal(api.isPrime(2),true);
assert.equal(api.isPrime(97),true);
assert.equal(api.isPrime(9999999967),true);
for(const n of [3215031751,341550071728321,382512305654641]){
 assert.equal(api.isPrime(n),false,`Composite ${n} marked prime`);
}
assert.deepEqual(api.factorize(600851475143),[[71,1],[839,1],[1471,1],[6857,1]]);
assert.deepEqual(api.factorize(1000036000099),[[1000003,1],[1000033,1]]);
assert.deepEqual(api.factorize(1),[]);
assert.deepEqual(api.divisorsOf([[2,2],[3,1]]),[1,2,3,4,6,12]);
assert.equal(api.sigmaOf([[2,2],[3,1]]),28n);
const primes=[];
for(let n=90;n<=110;n++)if(api.isPrimeInWindow(n,n)[0])primes.push(n);
assert.deepEqual(primes,[97,101,103,107,109]);
assert.equal(api.getBasePrimes(1000).length,168);
console.log('Math core tests passed.');
