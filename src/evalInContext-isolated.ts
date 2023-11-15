import vm from 'isolated-vm';

export async function isolatedEval(code: string, context: Object = {}, opts = { memoryLimit: 128, copy: true}) {
  const isolate = new vm.Isolate({ memoryLimit: opts.memoryLimit });
  const isolatedContext = await isolate.createContext();
  const resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000);
  code = `(${clearContext.toString()})(); ${resultKey} = ${code};`;
  if (context) {
    await Promise.all(Object.keys(context).map(function (key) {
      return isolatedContext.global.set(key, context[key]);
    }));
  }
  try {
    const res = await isolate.compileScript(code);
    return await res.run(isolatedContext, { promise: true, copy: true });
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
