// Adapted from Underscores; Copyright (c) 2026 Underscores contributors.
// MIT terms: ../UNDERSCORES-LICENSE.
import { PLAY_CORE_MODULE_SPECIFIERS, resolvePlayCoreModule } from "./playCoreModules.js";
const formatModuleImports = source => {
  let importIndex = 0;
  const transformed = String(source || "").replace(/^\s*import\s+(.+?)\s+from\s+["']([^"']+)["'];?\s*$/gm, (_match, rawClause, specifier) => {
    const clause = rawClause.trim();
    const moduleName = `__playCoreModule${importIndex++}`;
    const require = `const ${moduleName} = __require(${JSON.stringify(specifier)});`;
    const named = value => value.slice(1, -1).trim().replace(/\s+as\s+/g, ": ");
    if (clause.startsWith("{")) return `${require}\nconst { ${named(clause)} } = ${moduleName};`;
    if (clause.startsWith("* as ")) return `${require}\nconst ${clause.slice(5).trim()} = ${moduleName};`;
    const comma = clause.indexOf(",");
    if (comma === -1) return `${require}\nconst ${clause} = ${moduleName}.default ?? ${moduleName};`;
    const defaultName = clause.slice(0, comma).trim();
    const remainder = clause.slice(comma + 1).trim();
    if (remainder.startsWith("{")) return `${require}\nconst ${defaultName} = ${moduleName}.default ?? ${moduleName};\nconst { ${named(remainder)} } = ${moduleName};`;
    if (remainder.startsWith("* as ")) return `${require}\nconst ${defaultName} = ${moduleName}.default ?? ${moduleName};\nconst ${remainder.slice(5).trim()} = ${moduleName};`;
    throw new Error(`Unsupported Play Core import clause: ${clause}`);
  });
  if (/\bimport\s*\(/.test(transformed)) throw new Error("Dynamic import() is not available in a portable Play Core program.");
  if (/^\s*import\s/m.test(transformed)) throw new Error("Use a static import from a bundled Play Core module.");
  return transformed;
};

const transformPlayCoreSource = source => formatModuleImports(source)
    .replace(/export\s+const\s+settings\s*=/g, "exports.settings =")
    .replace(/export\s+(async\s+)?function\s+(boot|pre|main|post|pointerMove|pointerDown|pointerUp)\s*\(/g, (_match, async, name) => `exports.${name} = ${async || ""}function ${name}(`)
    .replace(/export\s+(const|let|var)\s+(\w+)\s*=/g, "exports.$2 =")
    .replace(/export\s+default\s+/g, "exports.default = ")
    .replace(/export\s*\{\s*([^}]+)\s*\}\s*;?/g, (_match, names) => names.split(",").map(entry => {
      const [local, exported = local] = entry.trim().split(/\s+as\s+/);
      return `exports.${exported.trim()} = ${local.trim()};`;
    }).join("\n"));

const requirePlayCoreModule = specifier => {
  const module = resolvePlayCoreModule(specifier);
  if (module) return module;
  throw new Error(`Unsupported Play Core module “${specifier}”. Bundled modules: ${PLAY_CORE_MODULE_SPECIFIERS.join(", ")}`);
};

export const evaluatePlayCoreSource = (source, bridge = {}, scriptConsole = bridge?.console || globalThis.console) => {
  const code = transformPlayCoreSource(source);
  const exports = {};
  new Function("exports", "__", "__require", "console", `"use strict";\n${code}\nreturn exports;`)(
    exports,
    bridge,
    requirePlayCoreModule,
    scriptConsole,
  );
  return exports;
};

