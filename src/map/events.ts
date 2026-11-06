export type MapEvents = {
  /** The user clicked a world, or empty space (slug is null). */
  select: { slug: string | null };
  /** The pointer moved onto or off a world. x and y are in CSS pixels, relative to the canvas. */
  hover: { slug: string | null; x: number; y: number };
};

export interface EventBus<Events extends Record<string, unknown>> {
  /** Returns a function that removes the handler. */
  on<Type extends keyof Events>(type: Type, handler: (payload: Events[Type]) => void): () => void;
  emit<Type extends keyof Events>(type: Type, payload: Events[Type]): void;
  clear(): void;
}

export function createEventBus<Events extends Record<string, unknown>>(): EventBus<Events> {
  const handlers: { [Type in keyof Events]?: Set<(payload: Events[Type]) => void> } = {};

  return {
    on(type, handler) {
      const set = handlers[type] ?? new Set();
      handlers[type] = set;
      set.add(handler);
      return () => set.delete(handler);
    },
    emit(type, payload) {
      for (const handler of [...(handlers[type] ?? [])]) handler(payload);
    },
    clear() {
      for (const type of Object.keys(handlers) as (keyof Events)[]) delete handlers[type];
    },
  };
}
