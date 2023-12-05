import vm from "isolated-vm";
import { IsolatedEvalOptions } from "./options";

export function isolatedEvalSync(
  code: string,
  context: Object = {},
  opts: IsolatedEvalOptions = { memoryLimit: 128 }
) {
  if (code instanceof String) {
    return code.toString();
  }
  const isolate = new vm.Isolate({ memoryLimit: opts.memoryLimit });
  const isolatedContext = isolate.createContextSync();
  code = `(${clearContext.toString()})(); ${code}`;
  if (context) {
    Object.keys(context).forEach(function (key) {
      return isolatedContext.global.setSync(key, context[key]);
    });
  }
  try {
    const res = isolate.compileScriptSync(code);
    return res.runSync(isolatedContext, { copy: true, timeout: opts.timeout });
  } finally {
    isolatedContext.release();
    isolate.dispose();
  }
}

function clearContext() {
  Function = null;
  globalThis.__proto__ = null;
  const keys = Object.getOwnPropertyNames(this).concat(["constructor"]);
  keys.forEach((key) => {
    const item = this[key];
    if (!item || typeof item.constructor !== "function") return;
    this[key].constructor = null;
  });
}
