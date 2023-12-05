import vm from "isolated-vm";
import { IsolatedEvalOptions } from "./options";

export function isolatedEvalSync(
  code: any,
  context: Object = {},
  opts: IsolatedEvalOptions = { }
) {
  const options = {...opts, memoryLimit: 128 };
  if (code instanceof String) {
    return code.toString();
  }
  if (typeof code !== 'string') {
    return code;
  }
  const isolate = new vm.Isolate({ memoryLimit: options.memoryLimit });
  const isolatedContext = isolate.createContextSync();
  code = `(${clearContext.toString()})(); ${code}`;
  if (context) {
    Object.keys(context).forEach(function (key) {
      return isolatedContext.global.setSync(key, context[key]);
    });
  }
  try {
    const res = isolate.compileScriptSync(code as string);
    return res.runSync(isolatedContext, { copy: true, timeout: options.timeout });
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
