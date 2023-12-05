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

## Roadmap

- Fuzzy testing
- Unifying async and sync interfaces


