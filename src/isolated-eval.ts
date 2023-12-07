import vm from "isolated-vm";
import { IsolatedEvalOptions } from "./options";

export async function isolatedEval(
  code: any,
  context: Object = {},
  opts: IsolatedEvalOptions = { }
) {
  const options = { memoryLimit: 128, ...opts };
  if (code instanceof String) {
    return code.toString();
  }
  if (typeof code !== "string") {
    return code;
  }
  const isolate = new vm.Isolate({ memoryLimit: options.memoryLimit });
  const isolatedContext = await isolate.createContext();
  code = `(${clearContext.toString()})(); ${code}`;
  if (context) {
    await setContext(context, isolatedContext);
  }
  try {
    const res = await isolate.compileScript(code as string);
    return await res.run(isolatedContext, {
      promise: true,
      copy: true,
      timeout: options.timeout,
    });
  } finally {
    isolatedContext.release();
    isolate.dispose();
  }
}

async function setContext(context: Object, isolatedContext: vm.Context) {
  await Promise.all(
    Object.keys(context).map(function (key) {
      let data;
      if (typeof context[key] === 'object') {
        const thing = new vm.ExternalCopy(context[key]).copyInto();
        data = thing;
      } else {
        data = context[key];
      }
      return isolatedContext.global.set(key, data);
    })
  );
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
