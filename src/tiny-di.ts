export type Type<T = any> = abstract new (...args: any) => T;
export type InjectableToken<T> = string & { __type: T };

export type Resolve<T> = T extends Type ? InstanceType<T> : T;
export type ResolveInjectableToken<T extends InjectableToken<any>> = Resolve<T["__type"]>;

export type InjectableTokenValueSetter<T> = T extends InjectableToken<infer R> ? R | (() => R) : never;

function tryCreateInstance(reg: any) {
  try {
    return reg();
  } catch {
    return new reg();
  }
}

/**
 * @property strict: Throw error when the token is already registered.
 */
export interface ContainerConfigs {
  strict?: boolean;
}

export const createDependencyInjectionContainer = (config?: ContainerConfigs) => {
  const registry = new Map();
  const namedRegistry = new Map();
  const instances = new Map();
  const namedInstances = new Map();

  function clearInstances() {
    instances.clear();
    namedInstances.clear();
  }

  function inject<T extends Type>(target: T, options: { multi: true }): InstanceType<T>[];
  function inject<T extends Type>(target: T, options?: { name?: string }): InstanceType<T>;
  function inject<T extends InjectableToken<any>>(target: T, options: { multi: true }): ResolveInjectableToken<T>[];
  function inject<T extends InjectableToken<any>>(target: T, options?: { name?: string }): ResolveInjectableToken<T>;
  function inject<T extends Type>(target: T, options?: { multi?: boolean; name?: string }): Resolve<T> {
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

      if (registry.has(options.name)) {
        const reg = registry.get(options.name);
        if (typeof reg === "function") {
          instances.set(options.name, tryCreateInstance(reg));
        } else {
          instances.set(options.name, reg);
        }

        return instances.get(options.name);
      }

      throw Error(`Value '${target}' has not '${options.name}' named tag registered!`);
    }

    if (instances.has(target)) {
      return instances.get(target);
    }

    if (registry.has(target)) {
      const reg = registry.get(target);

      const val = (() => {
        if (Array.isArray(reg)) {
          return reg.map(x => (typeof x === "function" ? tryCreateInstance(x) : x));
        } else {
          if (typeof reg === "function") {
            return tryCreateInstance(reg);
          } else {
            return reg;
          }
        }
      })();

      instances.set(target, val);

      return instances.get(target);
    }

    throw Error(`Value '${target}' is not registered!`);
  }

  function makeInjectable<T extends Type>(target: T, options?: { multi?: boolean; name?: string }): void;
  function makeInjectable<T extends Type>(target: T, value: T, options?: { multi?: boolean; name?: string }): void;
  function makeInjectable<T extends InjectableToken<any>>(
    target: T,
    value: InjectableTokenValueSetter<T>,
    options?: { multi?: boolean; name?: string },
  ): void;
  function makeInjectable(target: any, value: any = target, options?: { multi?: boolean; name?: string }) {
    if (options?.name) {
      if (!namedRegistry.has(target)) namedRegistry.set(target, new Map());

      if (config?.strict && namedRegistry.get(target).has(options.name)) {
        throw Error(`'${target}' token has been already registered with '${options.name}' name`);
      }

      namedRegistry.get(target).set(options.name, value);
    } else if (options?.multi) {
      registry.set(target, [...(registry.get(target) || []), value]);
    } else {
      if (config?.strict && registry.has(target)) {
        throw Error(`'${target}' token has been already registered`);
      }

      registry.set(target, value);
    }
  }

  function injectable() {
    return <T extends Type>(value: T) => makeInjectable(value);
  }

  return { inject, makeInjectable, injectable, clearInstances };
};

export function createInjectableToken<T>(name: string): InjectableToken<T> {
  return name as InjectableToken<T>;
}
