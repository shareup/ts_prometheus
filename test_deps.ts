import { Metric, Output } from "./metric.ts";

export const test = Deno.test;

export {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.106.0/testing/asserts.ts";

export {
  bench,
  runBenchmarks,
} from "https://deno.land/std@0.106.0/testing/bench.ts";

export { delay } from "https://deno.land/std@0.106.0/async/delay.ts";

export class MetricMock extends Metric {
  constructor(labelNames: string[] = [], labelValues: string[] = []) {
    super(labelNames, labelValues);
  }

  get description(): string {
    return this.labelNames.concat(this.labelValues).toString();
  }

  outputs(): Output[] {
    return [["mock", this.getLabels(), 1]];
  }

  expose(): string {
    return this.labelNames.concat(this.labelValues).toString();
  }
}
