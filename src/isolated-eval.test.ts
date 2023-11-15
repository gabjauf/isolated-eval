import { describe, test, expect } from "vitest";
import { isolatedEval } from "./isolated-eval";

describe("isolatedEval", () => {
  test("should perform string concatenation", async function () {
    const code = '"app" + "le"';
    const evaluated = await isolatedEval(code);
    expect(evaluated).toBe("apple");
  });

  test("should perform simple math", async function () {
    const code = "9 + 1";
    const evaluated = await isolatedEval(code);
    expect(evaluated).toBe(10);
  });

  test("should have access to standard JavaScript library", async () => {
    const code = "Math.floor(22/7)";
    const evaluated = await isolatedEval(code);
    expect(evaluated).toBe(3);
  });

  test("should parse JSON", async function () {
    const code = '{name: "Borat", hobbies: ["disco dance", "sunbathing"]}';
    const evaluated = await isolatedEval(code);
    expect(evaluated.name).toBe("Borat");
    expect(evaluated.hobbies[0]).toBe("disco dance");
    expect(evaluated.hobbies[1]).toBe("sunbathing");
  });

  test("should parse a function expression", async function () {
    const code = "(function square(b) { return b * b; })(5)";
    const evaluated = await isolatedEval(code);
    expect(evaluated).toBe(25);
  });

  test("should not have access to Node.js objects", async function () {
    const code = "process";
    await expect(() => isolatedEval(code)).rejects.toThrow();
  });

  test("should not have access to Node.js objects (CWE-265)", async function () {
    const code = "this.constructor.constructor('return process')()";
    await expect(() => isolatedEval(code)).rejects.toThrow();
  });

  test("should support context API", async function () {
    const code = "{pid: pid, apple: a()}";
    const context = {
      pid: process.pid,
      a() {
        return "APPLE";
      },
    };
    const evaluated = await isolatedEval(code, context);
    expect(evaluated.pid).toBeGreaterThan(0);
    expect(evaluated.apple).toBe("APPLE");
  });

  test("should not have access to Node.js objects (CWE-265)", async function () {
    const code = `(async function () {
      let ret = hasOwnProperty;
      ret.constructor('return process')().mainModule.require('child_process').execSync('touch flag');
  }());`;
    await expect(() => isolatedEval(code)).rejects.toThrow();
  });

  test("should not have access to globalThis", async function () {
    const code = `
    (function() { 
        let ret = globalThis;
        ret.__proto__.polluted = "ret.__proto__.polluted";
    })()
    `;
    await expect(() => isolatedEval(code)).rejects.toThrow();
  });

  test("should not have access to __proto__", async function () {
    const code = `
    (function() { 
        __proto__.polluted = "ret.polluted"
        return (new Object()).__proto__;
    })()
    `;
    await expect(() => isolatedEval(code)).rejects.toThrow();
  });

  test("should not have access to process via constructors", async function () {
    const code = `
    (function() { 
    try{ 
      propertyIsEnumerable.call();
     } catch(pp){
    
       pp.constructor.constructor('return process')().mainModule.require('child_process').execSync('touch flag');
    
    }
    })()
    `;
    await expect(() => isolatedEval(code)).rejects.toThrow();
  });

  test("should be able to use async function", async function () {
    const code = `
      Promise.resolve('Hey');
    `;
    expect(await isolatedEval(code)).toBe("Hey");
  });
});
