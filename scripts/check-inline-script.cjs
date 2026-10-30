#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const file=path.resolve(process.argv[2]||path.join(__dirname,'..','index.html'));
const html=fs.readFileSync(file,'utf8');
const re=/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi;
let match,count=0;
while((match=re.exec(html))){
 const attrs=match[1]||'',source=match[2]||'';
 if(/\\bsrc\\s*=/.test(attrs)||/application\\/ld\\+json/i.test(attrs)||!source.trim())continue;
 new vm.Script(source,{filename:`${file}#inline-${++count}`});
}
if(!count)throw new Error('No inline JavaScript was checked.');
console.log(`Checked ${count} inline JavaScript block(s).`);
