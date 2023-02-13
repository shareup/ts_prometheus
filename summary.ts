import { Collector } from "./collector.ts";
import { Labels, Metric, Observe, Output } from "./metric.ts";
import { Registry } from "./registry.ts";

class Sample {
  private timestamp: number;
  private value: number;

  constructor(value: number) {
    this.timestamp = new Date().getTime();
    this.value = value;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  getValue(): number {
    return this.value;
  }
}

export class Summary extends Metric implements Observe {
  private collector: Collector;
  private quantiles: number[];
  private values: Sample[];
  private maxAge?: number;
  private ageBuckets?: number;

  static with(
    config: {
      name: string;
      help: string;
      labels?: string[];
      quantiles?: number[];
      maxAge?: number;
      ageBuckets?: number;
      registries?: Registry[];
    },
  ): Summary {
    const collector = new Collector(
      config.name,
      config.help,
      "summary",
      config.registries,
    );

    const labels = config.labels || [];
    const quantiles = config.quantiles || [.01, .05, .5, .95, .99];

    return new Summary(
      collector,
      labels,
      quantiles,
      config.maxAge,
      config.ageBuckets,
    );
  }

  private constructor(
    collector: Collector,
    labels: string[],
    quantiles: number[],
    maxAge?: number,
    ageBuckets?: number,
  ) {
    super(labels, new Array(labels.length).fill(undefined));
    this.collector = collector;
    this.quantiles = quantiles.sort((a, b) => a < b ? -1 : 1);
    this.values = [];
    this.maxAge = maxAge;
    this.ageBuckets = ageBuckets;
    this.collector.getOrSetMetric(this);

    quantiles.forEach((v) => {
      if (v < 0 || v > 1) {
        throw new Error(`invalid quantiles: ${v} not in [0,1]`);
      }
    });
  }

  get description(): string {
    const labels = this.getLabelsAsString();
    return `${this.collector.name}${labels}`;
  }

  private clean() {
    // Remove older than maxAge
    if (this.maxAge !== undefined) {
      const limit = new Date().getTime() - this.maxAge;
      let i = 0;
      while (i < this.values.length) {
        if (this.values[i].getTimestamp() > limit) {
          break;
        }
        i++;
      }
      this.values = this.values.slice(i);
    }

    // Remove extra values
    if (this.ageBuckets !== undefined) {
      const index = this.values.length - this.ageBuckets;
      this.values = this.values.splice(index);
    }
  }

  outputs(): Output[] | undefined {
    if (this.values.length === 0) {
      return undefined;
    }

    this.clean();

    const output: Output[] = [];

    const sorted = this.values.slice().sort((a, b) =>
      a.getValue() - b.getValue()
    );

    for (const p of this.quantiles) {
      const labels = this.getLabels({ quantile: p.toString() });
      let index = Math.ceil(p * sorted.length);
      index = index == 0 ? 0 : index - 1;
      const value = sorted[index].getValue();

      output.push([this.collector.name, labels, value]);
    }

    const labels = this.getLabels();
    const sum = this.values.reduce((sum, v) => sum + v.getValue(), 0);

    output.push([`${this.collector.name}_sum`, labels, sum]);
    output.push([`${this.collector.name}_count`, labels, sorted.length]);

    return output;
  }

  labels(labels: Labels): Observe {
    const child = new Summary(this.collector, this.labelNames, this.quantiles);

    for (const key of Object.keys(labels)) {
      const index = child.labelNames.indexOf(key);

      if (index === -1) {
        throw new Error(`label with name ${key} not defined`);
      }

      child.labelValues[index] = labels[key];
    }

    return child.collector.getOrSetMetric(child);
  }

  observe(n: number) {
    this.values.push(new Sample(n));
  }

  getCount(): number {
    this.clean();
    return this.values.length;
  }

  getSum(): number {
    this.clean();
    return this.values.reduce((sum, v) => sum + v.getValue(), 0);
  }

  getValues(): number[] {
    this.clean();
    return this.values.map((s) => s.getValue());
  }
}
