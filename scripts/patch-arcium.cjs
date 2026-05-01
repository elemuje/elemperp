#!/usr/bin/env node
/**
 * patch-arcium.js — runs via "postinstall" npm script
 *
 * Patches @arcium-hq/client to replace Node.js-only imports
 * (crypto, fs) with browser-compatible equivalents so Vite
 * can bundle the SDK for the browser.
 *
 * Runs automatically on every `npm install` including Vercel builds.
 */

const fs   = require('fs');
const path = require('path');

const BASE    = path.join(__dirname, '..', 'node_modules', '@arcium-hq', 'client', 'build');
const ESM_PATH = path.join(BASE, 'index.mjs');
const CJS_PATH = path.join(BASE, 'index.cjs');

function patchESM() {
  if (!fs.existsSync(ESM_PATH)) {
    console.warn('[patch-arcium] ESM build not found, skipping');
    return;
  }
  let src = fs.readFileSync(ESM_PATH, 'utf8');
  if (!src.includes("from 'crypto';")) {
    console.log('[patch-arcium] ESM already patched');
    return;
  }

  const nobleImports =
    "import { sha256 as _sha256 } from '@noble/hashes/sha256';\n" +
    "import { sha3_256 as _sha3_256 } from '@noble/hashes/sha3';\n\n";

  const cryptoShim =
    "// [ELEMPerp] browser shim for Node 'crypto'\n" +
    "const randomBytes = (n) => globalThis.crypto.getRandomValues(new Uint8Array(n));\n" +
    "function createHash(alg) {\n" +
    "  const ch = [];\n" +
    "  return { update(d){ ch.push(d instanceof Uint8Array ? d : new TextEncoder().encode(String(d))); return this; },\n" +
    "           digest(){ const b=new Uint8Array(ch.reduce((a,c)=>a+c.length,0)); let o=0; for(const c of ch){b.set(c,o);o+=c.length;}\n" +
    "             return alg==='sha256'?_sha256(b):_sha3_256(b); } };\n" +
    "}\n" +
    "const createCipheriv   = ()=>({update:(d)=>new Uint8Array(d.length),final:()=>new Uint8Array(0)});\n" +
    "const createDecipheriv = createCipheriv;\n";

  const fsShim =
    "// [ELEMPerp] browser stub for Node 'fs'\n" +
    "const fs = { readFileSync: ()=>{ throw new Error('fs not available in browser'); } };\n";

  src = src
    .replace("import { randomBytes, createHash, createCipheriv, createDecipheriv } from 'crypto';", cryptoShim)
    .replace("import fs from 'fs';", fsShim);

  fs.writeFileSync(ESM_PATH, nobleImports + src);
  console.log('[patch-arcium] ✓ ESM patched');
}

function patchCJS() {
  if (!fs.existsSync(CJS_PATH)) {
    console.warn('[patch-arcium] CJS build not found, skipping');
    return;
  }
  let src = fs.readFileSync(CJS_PATH, 'utf8');
  if (!src.includes("require('crypto')")) {
    console.log('[patch-arcium] CJS already patched');
    return;
  }

  const cryptoShim =
    "// [ELEMPerp] browser shim for Node 'crypto'\n" +
    "var _nh256 = require('@noble/hashes/sha256');\n" +
    "var _nh3   = require('@noble/hashes/sha3');\n" +
    "var crypto = {\n" +
    "  randomBytes: function(n){ return globalThis.crypto.getRandomValues(new Uint8Array(n)); },\n" +
    "  createHash: function(alg){\n" +
    "    var ch=[];\n" +
    "    return { update:function(d){ch.push(d instanceof Uint8Array?d:Buffer.from(String(d)));return this;},\n" +
    "             digest:function(){ var b=Buffer.concat(ch); return alg==='sha256'?_nh256.sha256(b):_nh3.sha3_256(b); } };\n" +
    "  },\n" +
    "  createCipheriv:   function(){return{update:function(d){return Buffer.alloc(d.length);},final:function(){return Buffer.alloc(0);}};},\n" +
    "  createDecipheriv: function(){return{update:function(d){return Buffer.alloc(d.length);},final:function(){return Buffer.alloc(0);}};}\n" +
    "};\n";

  const fsShim =
    "// [ELEMPerp] browser stub for Node 'fs'\n" +
    "var fs = { readFileSync: function(){ throw new Error('fs not available in browser'); } };\n";

  src = src
    .replace("var crypto = require('crypto');", cryptoShim)
    .replace("var fs = require('fs');", fsShim);

  fs.writeFileSync(CJS_PATH, src);
  console.log('[patch-arcium] ✓ CJS patched');
}

patchESM();
patchCJS();
