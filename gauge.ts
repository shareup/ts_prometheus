import { Collector } from "./collector.ts";
import { Dec, Inc, Labels, Metric, Output, Value } from "./metric.ts";
import { Registry } from "./registry.ts";

export class Gauge extends Metric implements Inc, Dec, Value {
  private collector: Collector;
  private _value?: number;

  static with(
    config: {
      name: string;
      help: string;
      labels?: string[];
      registries?: Registry[];
    },
  ): Gauge {
    const collector = new Collector(
      config.name,
      config.help,
      "gauge",
      config.registries || [],
    );
    const labels = config.labels || [];
    return new Gauge(collector, labels);
  }

  private constructor(
    collector: Collector,
    labels: string[] = [],
  ) {
    super(labels, new Array(labels.length).fill(undefined));
    this.collector = collector;
    this._value = undefined;
    this.collector.getOrSetMetric(this);
  }

  get description(): string {
    const labels = this.getLabelsAsString();
    return `${this.collector.name}${labels}`;
  }

  outputs(): Output[] | undefined {
    if (this._value !== undefined) {
      return [[this.collector.name, this.getLabels(), this._value]];
    }

    return undefined;
  }

  labels(labels: Labels): Gauge {
    const child = new Gauge(this.collector, this.labelNames);

    for (const key of Object.keys(labels)) {
      const index = child.labelNames.indexOf(key);

      if (index === -1) {
        throw new Error(`label with name ${key} not defined`);
      }

      child.labelValues[index] = labels[key];
    }

    return child.collector.getOrSetMetric(child);
  }

  // deno-lint-ignore no-inferrable-types
  inc(n: number = 1) {
    if (this._value === undefined) {
      this._value = 0;
    }
    this._value += n;
  }

  // deno-lint-ignore no-inferrable-types
  dec(n: number = 1) {
    if (this._value === undefined) {
      this._value = 0;
    }
    this._value -= n;
  }

  set(n: number) {
    this._value = n;
  }

  value(): number | undefined {
    return this._value;
  }
}
