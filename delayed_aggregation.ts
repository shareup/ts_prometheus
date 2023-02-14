import { Collector } from "./collector.ts";
import { Labels, Metric, Observe, Output } from "./metric.ts";
import { Registry } from "./registry.ts";

export class DelayedAggregation extends Metric implements Observe {
  private collector: Collector;
  private values: number[];

  static with(
    config: {
      name: string;
      help: string;
      labels?: string[];
      registries?: Registry[];
    },
  ): DelayedAggregation {
    const collector = new Collector(
      config.name,
      config.help,
      "delayed_aggregation",
      config.registries,
    );

    const labels = config.labels || [];

    return new DelayedAggregation(collector, labels);
  }

  private constructor(
    collector: Collector,
    labels: string[],
  ) {
    super(labels, new Array(labels.length).fill(undefined));
    this.collector = collector;
    this.values = [];
    this.collector.getOrSetMetric(this);
  }

  get description(): string {
    const labels = this.getLabelsAsString();
    return `${this.collector.name}${labels}`;
  }

  outputs(): Output[] | undefined {
    if (this.values.length == 0) {
      return undefined;
    }

    const outputs: Output[] = [];

    for (let i = 0; i < this.values.length; ++i) {
      const labels = this.getLabels({ o: `${i}` });
      outputs.push([this.collector.name, labels, this.values[i]]);
    }

    this.clear();

    return outputs;
  }

  labels(labels: Labels): Observe {
    const child = new DelayedAggregation(this.collector, this.labelNames);

    for (const key of Object.keys(labels)) {
      const index = child.labelNames.indexOf(key);

      if (index === -1) {
        throw new Error(`label with name ${key} not defined`);
      }

      child.labelValues[index] = labels[key];
    }

    return child.collector.getOrSetMetric(child);
  }

  observe(n: number): void {
    this.values.push(n);
  }

  clear(): void {
    this.values.length = 0;
  }

  peekValues(): number[] {
    return Array.from(this.values);
  }
}
