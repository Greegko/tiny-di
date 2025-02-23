# Zero dependency injection with only essential functionalities

Design goal: Emulates features essential features from `InversifyJS` without having `reflect-metadata` package usage requirement, it allows to be used via `vite` / `vitest`. Connect classes without having passing down all the constructor creation parameters. Forces that design pattern, when the object is only defined once.

Note: Not meant for heavy production use, target is to have a simplified class dependency share between logic classes.

Restrictions:

- Only singletons
- Token value override is not supported (Throws Error)
- Error when the looked up token is not available

## Features

- Named injection mapping
- Function / Class value resolve
- Multi resolved value support
- Class decorators support

## Example

### Base

```ts
import { createDependencyInjectionContainer } from "@greegko/tiny-di";

const container = createDependencyInjectionContainer();

const numberToken = container.createInjectionToken<number>("number-token-name");

container.makeInjectable(numberToken, 5);

container.inject(numberToken); //=> 5
```

### Classes and decorator usage

```ts
import { createDependencyInjectionContainer } from "@greegko/tiny-di";

const container = createDependencyInjectionContainer();
const injectable = container.injectable;
const inject = container.inject;

@injectable()
class A {
  val = 5;
}

@injectable()
class B {
  private a = inject(A);

  getVal() {
    return this.a.val;
  }
}

const b = inject(B);
console.log(b.getVal()); //=> 5
```

### Named injection

```ts
import { createDependencyInjectionContainer } from "@greegko/tiny-di";

const container = createDependencyInjectionContainer();

class Abs {
  abstract val: number;
}
class A {
  val = 5;
}
class B {
  val = 6;
}

container.makeInjectable(Abs, A, { name: "AClass" });
container.makeInjectable(Abs, B, { name: "BClass" });

container.inject(Abs, { name: "AClass" }).val; //=> 5
container.inject(Abs, { name: "BClass" }).val; //=> 6
```

### Multi option support

```ts
import { createDependencyInjectionContainer } from "@greegko/tiny-di";

const container = createDependencyInjectionContainer();

class Abs {
  abstract val: number;
}
class A {
  val = 5;
}
class B {
  val = 6;
}

container.makeInjectable(Abs, A, { multi: true });
container.makeInjectable(Abs, B, { multi: true });

container.inject(Abs, { multi: true }); //=> [A class instance, B class instance]; Note: not class declarations!
```
