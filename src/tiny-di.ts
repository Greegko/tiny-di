export type Type<T = any> = abstract new (...args: any) => T;
export type InjectableToken<T> = string & { __type: T };

export type Resolve<T> = T extends Type ? InstanceType<T> : T;
export type ResolveInjectableToken<T extends InjectableToken<any>> = Resolve<
  T["__type"]
>;

export type InjectableTokenValueSetter<T> =
  T extends InjectableToken<infer R> ? R | (() => R) : never;

function tryCreateInstance(reg: any) {
  try {
    return reg();
  } catch {
    return new reg();
  }
}

export const createDependencyInjectionContainer = () => {
  const registry = new Map();
  const namedRegistry = new Map();
  const instances = new Map();
  const namedInstances = new Map();

  function inject<T extends Type>(
    target: T,
    options: { multi: true }
  ): InstanceType<T>[];
  function inject<T extends Type>(
    target: T,
    options?: { name?: string }
  ): InstanceType<T>;
  function inject<T extends InjectableToken<any>>(
    target: T,
    options: { multi: true }
  ): ResolveInjectableToken<T>[];
  function inject<T extends InjectableToken<any>>(
    target: T,
    options?: { name?: string }
  ): ResolveInjectableToken<T>;
  function inject<T extends Type>(
    target: T,
    options?: { multi?: boolean; name?: string }
  ): Resolve<T> {
    if (options?.name) {
      let instances = namedInstances.get(target);
      if (!instances) {
        instances = new Map();
        namedInstances.set(target, instances);
      }

      if (instances.has(options.name)) {
        return instances.get(options.name);
      }

      let registry = namedRegistry.get(target);

      if (!registry) {
        registry = new Map();
        namedRegistry.set(target, registry);
      }

      const reg = registry.get(options.name);

      if (reg) {
        const val = Array.isArray(reg)
          ? reg.map(tryCreateInstance)
          : tryCreateInstance(reg);

        instances.set(options.name, val);
        return val;
      }

      throw Error(
        `Value '${target}' has not '${options.name}' named tag registered!`
      );
    }

    if (instances.has(target)) {
      return instances.get(target);
    }

    const reg = registry.get(target);

    if (reg) {
      const val = Array.isArray(reg)
        ? reg.map(tryCreateInstance)
        : tryCreateInstance(reg);
      instances.set(target, val);

      return val;
    }

    throw Error(`Value '${target}' is not registered!`);
  }

  function makeInjectable<T extends Type>(
    target: T,
    options?: { multi?: boolean; name?: string }
  ): void;
  function makeInjectable<T extends Type>(
    target: T,
    value: T,
    options?: { multi?: boolean; name?: string }
  ): void;
  function makeInjectable<T extends InjectableToken<any>>(
    target: T,
    value: InjectableTokenValueSetter<T>,
    options?: { multi?: boolean; name?: string }
  ): void;
  function makeInjectable(
    target: any,
    value: any = target,
    options?: { multi?: boolean; name?: string }
  ) {
    if (typeof value === "function") {
      if (options?.name) {
        if (!namedRegistry.has(target)) namedRegistry.set(target, new Map());

        if (namedRegistry.get(target).has(options.name)) {
          throw Error(
            `'${target}' token has been already registered with '${options.name}' name`
          );
        }

        namedRegistry.get(target).set(options.name, value);
      } else if (options?.multi) {
        registry.set(target, [...(registry.get(target) || []), value]);
      } else {
        if (registry.has(target)) {
          throw Error(`'${target}' token has been already registered`);
        }

        registry.set(target, value);
      }
    } else {
      if (options?.multi) {
        instances.set(target, [...(instances.get(target) || []), value]);
      } else if (options?.name) {
        if (!namedInstances.has(target)) namedInstances.set(target, new Map());

        if (namedInstances.get(target).has(options.name)) {
          throw Error(
            `'${target}' token has been already registered with '${options.name}' name`
          );
        }

        namedInstances.get(target).set(options.name, value);
      } else {
        if (instances.has(target)) {
          throw Error(`'${target}' token has been already registered`);
        }

        instances.set(target, value);
      }
    }
  }

  function createInjectableToken<T>(name: string): InjectableToken<T> {
    return name as InjectableToken<T>;
  }

  function injectable() {
    return <T extends Type>(value: T) => makeInjectable(value);
  }

  return { inject, makeInjectable, createInjectableToken, injectable };
};
