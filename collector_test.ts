import { assert, assertEquals, MetricMock, test } from "./test_deps.ts";
import { Collector, escapeHelpString, isValidMetricName } from "./collector.ts";

test("Collector", () => {
  const collector = new Collector("name", "help", "type");

  assertEquals(collector.name, "name");
  assertEquals(collector.help, "help");
  assertEquals(collector.type, "type");
  assertEquals(collector.collect(), []);

  const metric = new MetricMock(["some", "labels"], ["some", "values"]);

  assertEquals(collector.getOrSetMetric(metric), metric);
  assertEquals(collector.collect(), [metric]);

  const other = new MetricMock(["other", "labels"], ["other", "values"]);

  assertEquals(collector.getOrSetMetric(other), other);
  assertEquals(collector.getOrSetMetric(metric), metric);
  assertEquals(collector.collect(), [metric, other]);
});

test("isValidMetricName", () => {
  const validNames = [
    "valid_metric_name",
    "VALID_METRIC_NAME",
    "valid:metric:name",
    "_valid_metric_name_",
    ":valid:metric:name:",
    "valid_metric_name_2",
  ];

  for (const name of validNames) {
    assert(isValidMetricName(name));
  }

  const invalidNames = [
    "",
    "0_invalid_metric_name",
    "$@#!",
  ];

  for (const name of invalidNames) {
    assert(!isValidMetricName(name));
  }
});

test("escapeHelpString", () => {
  const backslash = "\\";
  const newLine = "\n";

  assertEquals(escapeHelpString(backslash), "\\\\");
  assertEquals(escapeHelpString(newLine), "\\\n");
});
