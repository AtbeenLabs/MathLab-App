#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const file = path.resolve(process.argv[2] || path.join(__dirname, '..', 'index.html'));
const html = fs.readFileSync(file, 'utf8');

let cursor = 0;
let checked = 0;

while (true) {
  const openStart = html.indexOf('<script', cursor);
  if (openStart === -1) break;

  const openEnd = html.indexOf('>', openStart);
  if (openEnd === -1) throw new Error('Unclosed script opening tag.');

  const attrs = html.slice(openStart + 7, openEnd);
  const closeStart = html.indexOf('</script>', openEnd + 1);
  if (closeStart === -1) throw new Error('Unclosed script element.');

  const source = html.slice(openEnd + 1, closeStart);
  cursor = closeStart + 9;

  const lowerAttrs = attrs.toLowerCase();
  if (lowerAttrs.includes('src=') ||
      lowerAttrs.includes('application/ld+json') ||
      !source.trim()) {
    continue;
  }

  checked++;
  new vm.Script(source, { filename: file + '#inline-script-' + checked });
}

if (!checked) throw new Error('No inline JavaScript was checked.');
console.log('Checked ' + checked + ' inline JavaScript block(s).');
