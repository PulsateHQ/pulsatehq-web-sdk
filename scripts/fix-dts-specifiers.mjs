// Post-processes the .d.ts tree emitted by tsconfig.build.json into declarations
// that resolve for consumers on every module-resolution mode.
//
// Two things need fixing, both because tsc does not rewrite module specifiers at
// emit:
//
// 1. The extensionless specifiers written in src/ survive into the output.
//    Consumers on "node16"/"nodenext" -- the default for modern Node projects --
//    reject those with TS2834/TS2307, which makes the published types unusable
//    for them. A directory specifier like "./DOM" additionally has to become
//    "./DOM/index.js", since directory resolution is not available there either.
//
// 2. The emitted tree is ESM-flavoured, because the package is "type": "module".
//    A CommonJS consumer that require()s the package gets TS1479 against it even
//    though dist-npm/index.cjs exists. So the tree is mirrored to .d.cts, whose
//    own specifiers point at ".cjs" and therefore resolve back into the mirror.
//
// The stylesheet side-effect import is dropped rather than rewritten: the CSS is
// published as dist-npm/styles.css, so "./styles/preview.css" resolves to
// nothing inside the package, and a declaration file has no side effects to
// carry anyway.

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const OUT = new URL("../dist-npm/", import.meta.url).pathname;

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : join(dir, e.name)
  );

const isFile = (p) => {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
};

const SPECIFIER = /(\bfrom\s*|\bimport\s*)"(\.\.?\/[^"]*)"/g;
const STYLESHEET = /^import\s*"\.\/styles\/preview\.css";\r?\n/m;

const declarations = walk(OUT).filter((f) => f.endsWith(".d.ts"));

// Pass 1: drop the stylesheet import and give every specifier a ".js" suffix.
for (const file of declarations) {
  const source = readFileSync(file, "utf8");

  const fixed = source.replace(STYLESHEET, "").replace(
    SPECIFIER,
    (match, head, spec) => {
      if (/\.(js|cjs|mjs|json|css)$/.test(spec)) return match;
      const target = resolve(dirname(file), spec);
      return `${head}"${spec}${isFile(`${target}.d.ts`) ? ".js" : "/index.js"}"`;
    }
  );

  if (fixed !== source) writeFileSync(file, fixed);
}

// Pass 2: mirror the tree to .d.cts for the "require" condition, repointing the
// specifiers so a .d.cts only ever resolves to another .d.cts.
for (const file of declarations) {
  const cjs = readFileSync(file, "utf8").replace(
    SPECIFIER,
    (_match, head, spec) => `${head}"${spec.replace(/\.js$/, ".cjs")}"`
  );
  writeFileSync(file.replace(/\.d\.ts$/, ".d.cts"), cjs);
}

console.log(
  `fix-dts-specifiers: normalised ${declarations.length} declaration file(s), ` +
    `mirrored ${declarations.length} to .d.cts`
);
