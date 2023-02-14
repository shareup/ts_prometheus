import { assertEquals, test } from "./test_deps.ts";
import { defaultExposition, rawOutputsExposition } from "./exposition.ts";
import { Counter } from "./counter.ts";
import { Registry } from "./registry.ts";

const expectedText = `
# HELP the_count1 help
# TYPE the_count1 counter
the_count1 5

# HELP the_count2 help
# TYPE the_count2 counter
the_count2 7
`.trimStart();

const expectedRawOutputs = `
[["the_count1",{},5],["the_count2",{},7]]
`.trim();

test("defaultExposition and rawOutputsExposition", () => {
  const defaultRegistry = new Registry(defaultExposition);
  const rawOutputsRegistry = new Registry(rawOutputsExposition);

  const counter1 = Counter.with({
    name: "the_count1",
    help: "help",
    registries: [defaultRegistry, rawOutputsRegistry],
  });

  counter1.inc(5);

  const counter2 = Counter.with({
    name: "the_count2",
    help: "help",
    registries: [defaultRegistry, rawOutputsRegistry],
  });

  counter2.inc(7);

  assertEquals(expectedText, defaultRegistry.metrics());
  assertEquals(expectedRawOutputs, rawOutputsRegistry.metrics());
});
