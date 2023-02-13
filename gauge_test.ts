import { assertEquals, assertThrows, test } from "./test_deps.ts";
import { Gauge } from "./gauge.ts";
import { Registry } from "./registry.ts";

test("Gauge", () => {
  const registry = new Registry();

  const gauge1 = Gauge.with({
    name: "gauge_without_labels",
    help: "help",
    registries: [registry],
  });

  assertEquals(gauge1.description, "gauge_without_labels");
  assertEquals(gauge1.outputs(), undefined);
  assertEquals(gauge1.value(), undefined);

  gauge1.inc();
  assertEquals(gauge1.outputs(), [["gauge_without_labels", {}, 1]]);
  assertEquals(gauge1.value(), 1);
  gauge1.inc(42);
  assertEquals(gauge1.outputs(), [["gauge_without_labels", {}, 43]]);
  assertEquals(gauge1.value(), 43);

  gauge1.dec();
  assertEquals(gauge1.outputs(), [["gauge_without_labels", {}, 42]]);
  assertEquals(gauge1.value(), 42);
  gauge1.dec(42);
  assertEquals(gauge1.outputs(), [["gauge_without_labels", {}, 0]]);
  assertEquals(gauge1.value(), 0);

  // NOTE: duplicate collectors in a single registry will throw
  assertThrows(() => {
    Gauge.with({
      name: "gauge_without_labels",
      help: "help",
      labels: [],
      registries: [registry],
    });
  });

  const gauge2 = Gauge.with({
    name: "gauge_with_labels",
    help: "help",
    labels: ["label1", "label2"],
    registries: [registry],
  });

  assertEquals(gauge2.description, "gauge_with_labels");
  assertEquals(gauge2.outputs(), undefined);
  assertEquals(gauge2.value(), undefined);

  const gaugeLabel1 = gauge2.labels({ label1: "value1" });

  gaugeLabel1.inc();
  assertEquals(gaugeLabel1.value(), 1);
  gaugeLabel1.inc(42);
  assertEquals(gaugeLabel1.value(), 43);
  gaugeLabel1.dec();
  assertEquals(gaugeLabel1.value(), 42);
  gaugeLabel1.dec(17);
  assertEquals(gaugeLabel1.value(), 25);
});

const expectedExpositionText = `
# HELP gauge_with_labels help
# TYPE gauge_with_labels gauge
gauge_with_labels{label1="value1"} 42
`.trimStart();

test("Gauge exposition format", () => {
  const registry = new Registry();

  const gauge = Gauge.with({
    name: "gauge_with_labels",
    help: "help",
    labels: ["label1", "label2"],
    registries: [registry],
  }).labels({
    label1: "value1",
  });

  gauge.set(42);

  const text = registry.metrics();
  assertEquals(text, expectedExpositionText);
});
