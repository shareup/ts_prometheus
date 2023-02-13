import { Collector } from "./collector.ts";
import { Labels, Metric, Observe, Output } from "./metric.ts";
import { Registry } from "./registry.ts";

export class Histogram extends Metric implements Observe {
  private collector: Collector;
  private buckets: number[];
  private count: number;
  private sum: number;
  private values: number[];

  static with(
    config: {
      name: string;
      help: string;
      labels?: string[];
      buckets: number[];
      registries?: Registry[];
    },
  ): Histogram {
    const collector = new Collector(
      config.name,
      config.help,
      "histogram",
      config.registries,
    );

    const labels = config.labels || [];
    const buckets = config.buckets || [];
    buckets.push(Infinity);

    return new Histogram(collector, labels, buckets);
  }

  private constructor(
    collector: Collector,
    labels: string[],
    buckets: number[],
  ) {
    super(labels, new Array(labels.length).fill(undefined));
    this.collector = collector;
    this.buckets = buckets.sort((a, b) => a < b ? -1 : 1);
    this.count = 0;
    this.sum = 0;
    this.values = new Array(this.buckets.length).fill(0);
    this.collector.getOrSetMetric(this);
  }

  get description(): string {
    const labels = this.getLabelsAsString();
    return `${this.collector.name}${labels}`;
  }

  outputs(): Output[] | undefined {
    if (this.count == 0) {
      return undefined;
    }

    const output: Output[] = [];

    for (let i = 0; i < this.buckets.length; i++) {
      const labels = this.getLabels({ le: `${this.buckets[i]}` });

      if (labels["le"] === "Infinity") {
        labels["le"] = "+Inf";
      }

      output.push([`${this.collector.name}_bucket`, labels, this.values[i]]);
    }

    const labels = this.getLabels();

    output.push([`${this.collector.name}_sum`, labels, this.sum]);
    output.push([`${this.collector.name}_count`, labels, this.count]);

    return output;
  }

  labels(labels: Labels): Observe {
    const child = new Histogram(this.collector, this.labelNames, this.buckets);

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
    const index = this.buckets.findIndex((v) => v >= n);

    for (let i = index; i < this.values.length; i++) {
      this.values[i] += 1;
    }

    this.sum += n;
    this.count += 1;
  }
}
