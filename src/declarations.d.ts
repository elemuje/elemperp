// Global type declarations for packages that ship without proper TypeScript types
// or have compatibility issues with moduleResolution: bundler

declare module 'framer-motion';
declare module 'lucide-react';
declare module 'bn.js' {
  class BN {
    constructor(number: number | string | Uint8Array | BN, base?: number | 'hex', endian?: 'le' | 'be');
    static isBN(b: unknown): b is BN;
    toArrayLike(ArrayType: Uint8ArrayConstructor, endian: 'le' | 'be', length: number): Uint8Array;
    toArrayLike(ArrayType: ArrayConstructor, endian?: 'le' | 'be', length?: number): number[];
    toString(base?: number | 'hex'): string;
    toNumber(): number;
    add(b: BN): BN; sub(b: BN): BN; mul(b: BN): BN;
    div(b: BN): BN; mod(b: BN): BN;
    eq(b: BN): boolean; lt(b: BN): boolean; gt(b: BN): boolean;
    isZero(): boolean; neg(): BN; abs(): BN; clone(): BN;
    shrn(b: number): BN; shln(b: number): BN;
    and(b: BN): BN; or(b: BN): BN;
    bitLength(): number; byteLength(): number;
  }
  export = BN;
}
