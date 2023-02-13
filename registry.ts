import { Collector } from "./collector.ts";
import { defaultExposition, Exposition } from "./exposition.ts";

export class Registry {
  // The default CollectorRegistry
  static default = new Registry();

  private collectors: Map<string, Collector>;
  private exposition: Exposition;

  constructor(exposition: Exposition = defaultExposition) {
    this.collectors = new Map();
    this.exposition = exposition;
  }

  register(collector: Collector) {
    const found = this.collectors.has(collector.name);

    if (found) {
      throw new Error(
        `a collector with name ${collector.name} has been registered`,
      );
    }

    this.collectors.set(collector.name, collector);
  }

  unregister(collector: Collector) {
    this.collectors.delete(collector.name);
  }

  clear() {
    this.collectors = new Map();
  }

  metrics(): string {
    return this.exposition(Array.from(this.collectors.values()));
  }
}
