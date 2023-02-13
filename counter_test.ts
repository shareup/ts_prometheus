import { assertEquals, assertThrows, test } from "./test_deps.ts";
import { Counter } from "./counter.ts";
import { Registry } from "./registry.ts";

test("Counter", () => {
  const registry = new Registry();

  const counter1 = Counter.with({
    name: "counter_without_labels",
    help: "help",
    registries: [registry],
  });

  assertEquals(counter1.description, "counter_without_labels");
  assertEquals(counter1.outputs(), undefined);
  assertEquals(counter1.value(), undefined);

  counter1.inc();
  assertEquals(counter1.outputs(), [["counter_without_labels", {}, 1]]);

  counter1.inc(42);
  assertEquals(counter1.outputs(), [["counter_without_labels", {}, 43]]);

  // NOTE: duplicate collectors in a single registry will throw
  assertThrows(() => {
    Counter.with({
      name: "counter_without_labels",
      help: "help",
      labels: [],
      registries: [registry],
    });
  });

  const counter2 = Counter.with({
    name: "counter_with_labels",
    help: "help",
    labels: ["label1", "label2"],
    registries: [registry],
  });

  assertEquals(counter2.description, "counter_with_labels");
  assertEquals(counter2.outputs(), undefined);
  assertEquals(counter2.value(), undefined);

  assertThrows(() => {
    counter2.inc(-1);
  });

  const counterLabel1 = counter2.labels({ label1: "value1" });
  counterLabel1.inc();
  assertEquals(counterLabel1.value(), 1);
  counterLabel1.inc(42);
  assertEquals(counterLabel1.value(), 43);
  assertEquals(counterLabel1.outputs(), [["counter_with_labels", {
    label1: "value1",
  }, 43]]);
});

const expectedExpositionFormat = `
# HELP counter_with_labels help
# TYPE counter_with_labels counter
counter_with_labels{label1="value1"} 5
`.trimStart();

test("Counter exposition", () => {
  const registry = new Registry();

  const counter = Counter.with({
    name: "counter_with_labels",
    help: "help",
    labels: ["label1", "label2"],
    registries: [registry],
  }).labels({ label1: "value1" });

  counter.inc(5);

  const text = registry.metrics();
  assertEquals(text, expectedExpositionFormat);
});
