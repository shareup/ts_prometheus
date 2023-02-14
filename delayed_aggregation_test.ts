import { assertEquals, assertThrows, test } from "./test_deps.ts";
import { Registry } from "./registry.ts";
import { DelayedAggregation } from "./delayed_aggregation.ts";

test("DelayedAggregation.with", () => {
  const registry = new Registry();

  const da = DelayedAggregation.with({
    name: "da_without_labels",
    help: "help",
    registries: [registry],
  });

  assertEquals(da.outputs(), undefined);

  // NOTE: duplicate collectors in a single registry will throw
  assertThrows(() => {
    DelayedAggregation.with({
      name: "da_without_labels",
      help: "help",
      registries: [registry],
    });
  });
});

test("DelayedAggregation.observe", () => {
  const da = DelayedAggregation.with({
    name: "da_without_labels",
    help: "help",
    registries: [],
  });

  assertEquals(da.outputs(), undefined);

  for (let i = 0; i < 5; ++i) {
    da.observe(i * 2);
  }

  assertEquals(da.peekValues(), [0, 2, 4, 6, 8]);
});

const daText = `
# HELP delayed_aggregation_baz a very nice delayed aggregation
# TYPE delayed_aggregation_baz delayed_aggregation
delayed_aggregation_baz{A="B",C="D",o="0"} 2
delayed_aggregation_baz{A="B",C="D",o="1"} 4
delayed_aggregation_baz{A="B",C="D",o="2"} 6
delayed_aggregation_baz{A="B",C="D",o="3"} 8
delayed_aggregation_baz{A="B",C="D",o="4"} 10
`.trimStart();

test("DelayedAggregation with labels outputs the correct format", () => {
  const registry = new Registry();

  const da = DelayedAggregation.with({
    name: "delayed_aggregation_baz",
    help: "a very nice delayed aggregation",
    labels: ["A", "C"],
    registries: [registry],
  });

  const labeled = da.labels({ A: "B", C: "D" });

  labeled.observe(2);
  labeled.observe(4);
  labeled.observe(6);
  labeled.observe(8);
  labeled.observe(10);

  assertEquals(registry.metrics(), daText);
});
