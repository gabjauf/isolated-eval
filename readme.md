# Isolated-eval

Based on the great module [isolated-vm](https://github.com/laverdet/isolated-vm).

This module attempts to mimic the eval function with the following objectives:
- [x] Isolate the execution
- [x] Timeout long running scripts
- [x] Resolve promises (only in async)
- [x] Restrain the context (no access to globalThis, process)

These should make the execution much more secure with arbitrary input scripts coming from the user.

## Usage

### Synchronous

```js
import { isolatedEvalSync } from 'isolated-eval';

const context = { data: 1 }

const evaluated = isolatedEvalSync(
  "data + 1",
  context
)
console.log(evaluated); // 2
```

### Asynchronous

```js
import { isolatedEval } from 'isolated-eval';

const context = { data: 1 }

const evaluated = await isolatedEval(
  "Promise.resolve(1 + data)",
  context
)
console.log(evaluated); // 2
```

## Security Notice

This module deals with probably the [most sensitive part of javascript](https://javascript.plainenglish.io/javascript-eval-is-it-evil-a8cd935d0daa) because it opens a lot of possibilities. You should always be aware of the risks of using it, past has proven that no use of this kind of module can be made bullet proof for a very long time (see [eval](https://www.npmjs.com/package/eval), [safe-eval](https://www.npmjs.com/package/safe-eval), [safer-eval](https://www.npmjs.com/package/safer-eval), they all have vulnerabilities).

When using this module, you should always make sure to apply the following principles :
- Never give the user the ability to set the context unless you have very strict validation
- When giving the user the ability to set the code (for a lambda for example), make sure a timeout is set to mitigate possibilities of DOS

Any security issue should be reported in the security tab, I will do my best to mitigate them as much as possible.

## Roadmap

- Fuzzy testing
- Unifying async and sync interfaces


