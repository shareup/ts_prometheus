import { Metric } from "./metric.ts";
import { Registry } from "./registry.ts";

export class Collector {
  private _name: string;
  private _help: string;
  private _type: string;
  private metrics: Map<string, Metric>;
  private registries: Registry[];

  constructor(
    name: string,
    help: string,
    type: string,
    registries?: Registry[],
  ) {
    if (!isValidMetricName(name)) {
      throw new Error("invalid metric name");
    }

    this._name = name;
    this._help = escapeHelpString(help);
    this._type = type;
    this.metrics = new Map();
    this.registries = registries || [Registry.default];
    this.registries.forEach((registry) => registry.register(this));
  }

  get name(): string {
    return this._name;
  }

  get help(): string {
    return this._help;
  }

  get type(): string {
    return this._type;
  }

  collect(): Metric[] {
    return [...this.metrics.values()];
  }

  getOrSetMetric<M extends Metric>(metric: M): M {
    const saved = this.metrics.get(metric.description);

    if (saved !== undefined) {
      return saved as M;
    }

    this.metrics.set(metric.description, metric);
    return metric;
  }
}

export function isValidMetricName(name: string): boolean {
  return /^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(name);
}

export function escapeHelpString(help: string): string {
  return help
    .replace(/\\/g, "\\\\") // backslash
    .replace(/\n/g, "\\\n"); // new line
}
