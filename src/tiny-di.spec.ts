import { describe, it } from "node:test";
import assert from "node:assert";

import { Type, createDependencyInjectionContainer, createInjectableToken } from "./tiny-di";

describe("Dependency Injection", () => {
  it("should make classes injectable", () => {
    const container = createDependencyInjectionContainer();

    class A {
      val = 5;
    }

    container.makeInjectable(A);

    assert.equal(container.inject(A).val, 5);
  });

  it("should only create class when injected", () => {
    const container = createDependencyInjectionContainer();

    let invoked = 0;

    class A {
      constructor() {
        invoked++;
      }

      val = 5;
    }

    container.makeInjectable(A);

    assert.equal(invoked, 0);

    assert.equal(container.inject(A).val, 5);

    assert.equal(invoked, 1);
  });

  it("should override the original target", () => {
    const container = createDependencyInjectionContainer();

    class A {
      val = 5;
    }

    class B {
      val = 6;
    }

    container.makeInjectable(A, B);

    assert.equal(container.inject(A).val, 6);
  });

  it("should have strong typings for non class tokens", () => {
    const container = createDependencyInjectionContainer();

    type Config = { id: string };

    const token = createInjectableToken<Config>("config");

    container.makeInjectable(token, { id: "test" });

    assert.equal(container.inject(token).id, "test");
  });

  it("should regiter injectable classes", () => {
    const container = createDependencyInjectionContainer();

    @container.injectable()
    class A {
      val = 5;
    }

    assert.equal(container.inject(A).val, 5);
  });

  it("should allow injections in class properties", () => {
    const container = createDependencyInjectionContainer();

    @container.injectable()
    class A {
      val = 5;
    }

    @container.injectable()
    class B {
      a = container.inject(A);
    }

    assert.equal(container.inject(B).a.val, 5);
  });

  it("should return the old instance", () => {
    const container = createDependencyInjectionContainer();

    let called = 5;

    @container.injectable()
    class A {
      val = called++;
    }

    assert.equal(container.inject(A).val, 5);
    assert.equal(container.inject(A).val, 5);
  });

  it("should handle multiple injections", () => {
    const container = createDependencyInjectionContainer();

    const token = createInjectableToken<number>("numbers");

    container.makeInjectable(token, 1, { multi: true });
    container.makeInjectable(token, 2, { multi: true });

    assert.deepEqual(container.inject(token, { multi: true }), [1, 2]);
  });

  it("should allow callback type", () => {
    const container = createDependencyInjectionContainer();

    const token = createInjectableToken<number>("numbers");

    container.makeInjectable(token, () => 1);

    assert.equal(container.inject(token), 1);
  });

  it("should allow to name instances", () => {
    const container = createDependencyInjectionContainer();

    const token = createInjectableToken<number>("numbers");

    container.makeInjectable(token, 1, { name: "first" });
    container.makeInjectable(token, 2, { name: "second" });
    container.makeInjectable(token, 3, { name: "third" });

    assert.equal(container.inject(token, { name: "second" }), 2);
  });

  it("should allow to name instances", () => {
    const container = createDependencyInjectionContainer();

    const token = createInjectableToken<Type<{ val: number }>>("classes");

    class A {
      val = 1;
    }
    class B {
      val = 2;
    }
    class C {
      val = 3;
    }

    container.makeInjectable(token, A, { name: "first" });
    container.makeInjectable(token, B, { name: "second" });
    container.makeInjectable(token, C, { name: "third" });

    assert.equal(container.inject(token, { name: "second" }).val, 2);
  });

  it("should class be resolved to instance", () => {
    const container = createDependencyInjectionContainer();

    class A {
      val = 5;
    }
    interface AA {
      val: number;
    }

    const token = createInjectableToken<Type<AA>>("A Token");

    container.makeInjectable(token, A);

    assert.equal(container.inject(token).val, 5);
  });

  it("should return the same instance", () => {
    const container = createDependencyInjectionContainer();

    @container.injectable()
    class A {
      val = 5;
    }

    const a = container.inject(A);
    const b = container.inject(A);

    assert.strictEqual(a, b);
  });

  it("should be able clear the instances", () => {
    const container = createDependencyInjectionContainer();

    @container.injectable()
    class A {
      val = 5;
    }

    const a = container.inject(A);
    container.clearInstances();
    const b = container.inject(A);

    assert.notStrictEqual(a, b);
  });

  it("should throw error on duplication when it is in strict mode", () => {
    const container = createDependencyInjectionContainer({ strict: true });

    class A {
      val = 5;
    }

    container.makeInjectable(A);

    assert.throws(() => container.makeInjectable(A));
  });

  it("should resolve multi classes", () => {
    const container = createDependencyInjectionContainer();

    const token = createInjectableToken<Type<{ val: number }>>("classes");

    class A {
      val = 5;
    }

    class B {
      val = 6;
    }

    container.makeInjectable(token, A, { multi: true });
    container.makeInjectable(token, B, { multi: true });

    const classes = container.inject(token, { multi: true });

    assert.deepEqual(
      classes.map(x => x.val),
      [5, 6],
    );
  });
});
