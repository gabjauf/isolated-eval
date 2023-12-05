import vm from 'isolated-vm';
import { IsolatedEvalOptions } from './options';

export async function isolatedEval(code: any, context: Object = {}, opts: IsolatedEvalOptions = { memoryLimit: 128 }) {
  if (code instanceof String) {
    return code.toString();
  }
  if (typeof code !== 'string') {
    return code;
  }
  const isolate = new vm.Isolate({ memoryLimit: opts.memoryLimit });
  const isolatedContext = await isolate.createContext();
  code = `(${clearContext.toString()})(); ${code}`;
  if (context) {
    await Promise.all(Object.keys(context).map(function (key) {
      return isolatedContext.global.set(key, context[key]);
    }));
  }
  try {
    const res = await isolate.compileScript(code as string);
    return await res.run(isolatedContext, { promise: true, copy: true, timeout: opts.timeout });
  } finally {
    isolatedContext.release();
    isolate.dispose();
  }
}

function clearContext() {
  Function = null;
  globalThis.__proto__ = null;
  const keys = Object.getOwnPropertyNames(this).concat(['constructor']);
  keys.forEach((key) => {
    const item = this[key];
    if (!item || typeof item.constructor !== 'function') return;
    this[key].constructor = null;
  });
}
