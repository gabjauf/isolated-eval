import { describe, test, expect } from "vitest";
import { isolatedEvalSync } from "./isolated-eval-sync";

describe("isolatedEvalSync", () => {
  test.concurrent("should perform string concatenation", async function () {
    const code = '"app" + "le"';
    const evaluated = await isolatedEvalSync(code);
    expect(evaluated).toBe("apple");
  });

  test.concurrent("should perform simple math", async function () {
    const code = "9 + 1";
    const evaluated = await isolatedEvalSync(code);
    expect(evaluated).toBe(10);
  });

  test.concurrent("should return computed number input", function () {
    const code = 2 + 8;
    const evaluated = isolatedEvalSync(code);
    expect(evaluated).toBe(10);
  });

  test.concurrent("should return the object itself", function () {
    const code = { a: "test" };
    const evaluated = isolatedEvalSync(code);
    expect(evaluated).toBe(code);
  });

  test.concurrent("should work with nested objects context", async function () {
    const code = "obj";
    const context = { obj: { hello: { world: '!'}}}
    const evaluated = isolatedEvalSync(code, context);
    expect(evaluated).toStrictEqual(context.obj);
  });

  test.concurrent(
    "should have access to standard JavaScript library",
    async () => {
      const code = "Math.floor(22/7)";
      const evaluated = await isolatedEvalSync(code);
      expect(evaluated).toBe(3);
    }
  );

  test.concurrent("should parse JSON", async function () {
    const code = '({name: "Borat", hobbies: ["disco dance", "sunbathing"]})';
    const evaluated = await isolatedEvalSync(code);
    expect(evaluated.name).toBe("Borat");
    expect(evaluated.hobbies[0]).toBe("disco dance");
    expect(evaluated.hobbies[1]).toBe("sunbathing");
  });

  test.concurrent("should parse a function expression", async function () {
    const code = "(function square(b) { return b * b; })(5)";
    const evaluated = await isolatedEvalSync(code);
    expect(evaluated).toBe(25);
  });

  test.concurrent(
    "should not have access to Node.js objects",
    async function () {
      const code = "process";
      expect(() => isolatedEvalSync(code)).toThrow();
    }
  );

  test.concurrent(
    "should not have access to Node.js objects (CWE-265)",
    async function () {
      const code = "this.constructor.constructor('return process')()";
      expect(() => isolatedEvalSync(code)).toThrow();
    }
  );

  test.concurrent("should support context API", function () {
    const code = "({ pid: pid, apple: a() })";
    const context = {
      pid: process.pid,
      a() {
        return "APPLE";
      },
    };
    const evaluated = isolatedEvalSync(code, context);
    expect(evaluated.pid).toBeGreaterThan(0);
    expect(evaluated.apple).toBe("APPLE");
  });

  test.concurrent("should support variable declaration", function () {
    const code = "let hey = { pid: pid, apple: a() }; hey";
    const context = {
      pid: process.pid,
      a() {
        return "APPLE";
      },
    };
    const evaluated = isolatedEvalSync(code, context);
    expect(evaluated.pid).toBeGreaterThan(0);
    expect(evaluated.apple).toBe("APPLE");
  });

  test.concurrent("should support String instance as input", function () {
    const code = new String("2 + 2");
    const evaluated = isolatedEvalSync(code);
    expect(evaluated).toBe("2 + 2");
  });

  test.concurrent(
    "should support String instance evaluation work around",
    function () {
      const code = new String("2 + 2");
      const evaluated = isolatedEvalSync(String(code));
      expect(evaluated).toBe(4);
    }
  );

  test.concurrent(
    "should not have access to Node.js objects (CWE-265)",
    function () {
      const code = `(function () {
      let ret = hasOwnProperty;
      ret.constructor('return process')().mainModule.require('child_process').execSync('touch flag');
  }());`;
      expect(() => isolatedEvalSync(code)).toThrow();
    }
  );
  describe("prototype pollution", () => {
    test.concurrent("should not be able to inject __proto__", function () {
      const code =
        '({ pid: "pid", __proto__: { valueOf: () => { return "hacked"}, toString: () => { return "hacked"} } })';
      const evaluated = isolatedEvalSync(code);
      expect(evaluated).toStrictEqual({ pid: "pid" });
      expect(evaluated.__proto__).toStrictEqual({});
      expect(evaluated.toString()).toBe("[object Object]");
    });

    test.concurrent("should not have access to globalThis", async function () {
      const code = `
      (function() { 
          let ret = globalThis;
          ret.__proto__.polluted = "ret.__proto__.polluted";
      })()
      `;
      expect(() => isolatedEvalSync(code)).toThrow();
    });

    test.concurrent("should not have access to __proto__", async function () {
      const code = `
      (function() { 
          __proto__.polluted = "ret.polluted"
          return (new Object()).__proto__;
      })()
      `;
      expect(() => isolatedEvalSync(code)).toThrow();
    });

    test.concurrent("should not be able pollute prototype in global this", function () {
      const code = `
      function getRootPrototype(obj) {        
        while (obj.__proto__) {
            obj = obj.__proto__;
        }
        return obj;    
      }
      function stack(ref, cb) {
          let stack = new Error().stack;
          stack.match(/checkReferenceRecursive/g);        
      }
      try {            
          global.temp0 = RegExp.prototype.__defineGetter__('global', () => {    
              getRootPrototype(this);                
              stack(this);        
              return true;
          }), function functionInvocationAnalysis(r) {        
              stack(r);
          }(temp0), global.temp0;
          RegExp.prototype.exec = function (str) {        
              stack(arguments);        
          };    
      } catch (e) {    
          getRootPrototype(e).polluted = "success";   
      }
      `;
      isolatedEvalSync(code);
      expect(globalThis.polluted).toBe(undefined);
    });

    test.concurrent("should not have access to __proto__", function () {
      const code = `
      function foo(ref) {
        new Error().stack;    
      }
      let obj = {};
      Object.defineProperty(Object.prototype, 0, {
          set: function () {                        
              foo(this);
              try {      
                  obj[0] = 0;
              } catch (e) {
                  e.__proto__.__proto__.__proto__.polluted = 'success';            
              }
          }
      })
      `;
      isolatedEvalSync(code);
      expect(globalThis.polluted).toBe(undefined);
    });

    test.concurrent(
      "should not be able to pollute prototype of global this",
      function () {
        const code = `
      let res = eval("import('./foo.js');");
      res.__proto__.__proto__.polluted = res.__proto__.__proto__.toString.constructor("return this")().process.mainModule.require("child_process").execSync("touch HACKED").toString();
      `;
        expect(() => isolatedEvalSync(code)).toThrow();
        expect(globalThis.polluted).toBe(undefined);
      }
    );

    test.concurrent(
      "should not be able to pollute prototype of context object",
      function () {
        const code = `
        obj.__proto__.polluted = "polluted";
        obj
      `;
        const context = { obj: { hello: "world!" } };
        isolatedEvalSync(code, context);
        expect(context.obj["polluted"]).toBe(undefined);
      }
    );
  });

  test.concurrent(
    "should not have access to process via constructors",
    async function () {
      const code = `
    (function() { 
    try{ 
      propertyIsEnumerable.call();
     } catch(pp){
    
       pp.constructor.constructor('return process')().mainModule.require('child_process').execSync('touch flag');
    
    }
    })()
    `;
      expect(() => isolatedEvalSync(code)).toThrow();
    }
  );

  test.concurrent(
    "should not be able to use async function",
    async function () {
      const code = `
      Promise.resolve('Hey');
    `;
      expect(() => isolatedEvalSync(code)).toThrow();
    }
  );

  test.concurrent(
    "should timeout when the script is long running",
    async function () {
      const code = `/^(A+)*B/.test('A'.repeat(100));`;
      expect(() => isolatedEvalSync(code, {}, { timeout: 1 })).toThrow();
    }
  );

  test.concurrent("should not be able to inject constructor", async function () {
    const code = "obj.constructor = () => {}; obj";
    const context = { obj: { hello: { world: '!'}}}
    expect(() => isolatedEvalSync(code, context)).toThrow();
  });
});
