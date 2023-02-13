import { assertEquals, assertThrows, test } from "./test_deps.ts";
import { Registry } from "./registry.ts";
import { Histogram } from "./histogram.ts";

test("Histogram.with", () => {
  const registry = new Registry();

  const histogram = Histogram.with({
    name: "histogram_without_labels_and_buckets",
    help: "help",
    buckets: [],
    registries: [registry],
  });

  assertEquals(histogram.outputs(), undefined);

  // NOTE: duplicate collectors in a single registry will throw
  assertThrows(() => {
    Histogram.with({
      name: "histogram_without_labels_and_buckets",
      help: "help",
      buckets: [],
      registries: [registry],
    });
  });
});

// Reference: https://github.com/open-telemetry/opentelemetry-go/blob/d5fca833d6f6fc75e092c2108e0265aa778b8923/exporters/prometheus/testdata/histogram.txt
//       and: https://github.com/open-telemetry/opentelemetry-go/blob/d5fca833d6f6fc75e092c2108e0265aa778b8923/exporters/prometheus/exporter_test.go#L93-L112

const expectedExpositionText = `
# HELP histogram_baz_bytes a very nice histogram
# TYPE histogram_baz_bytes histogram
histogram_baz_bytes_bucket{A="B",C="D",le="0"} 0
histogram_baz_bytes_bucket{A="B",C="D",le="5"} 0
histogram_baz_bytes_bucket{A="B",C="D",le="10"} 1
histogram_baz_bytes_bucket{A="B",C="D",le="25"} 2
histogram_baz_bytes_bucket{A="B",C="D",le="50"} 2
histogram_baz_bytes_bucket{A="B",C="D",le="75"} 2
histogram_baz_bytes_bucket{A="B",C="D",le="100"} 2
histogram_baz_bytes_bucket{A="B",C="D",le="250"} 4
histogram_baz_bytes_bucket{A="B",C="D",le="500"} 4
histogram_baz_bytes_bucket{A="B",C="D",le="1000"} 4
histogram_baz_bytes_bucket{A="B",C="D",le="+Inf"} 4
histogram_baz_bytes_sum{A="B",C="D"} 236
histogram_baz_bytes_count{A="B",C="D"} 4
`.trimStart();

test("Histogram with labels outputs the correct format for prometheus", () => {
  const registry = new Registry();

  const histogram = Histogram.with({
    name: "histogram_baz_bytes",
    help: "a very nice histogram",
    buckets: [0, 5, 10, 25, 50, 75, 100, 250, 500, 1000],
    labels: ["A", "C"],
    registries: [registry],
  });

  const labels = { A: "B", C: "D" };

  histogram.labels(labels).observe(23);
  histogram.labels(labels).observe(7);
  histogram.labels(labels).observe(101);
  histogram.labels(labels).observe(105);

  assertEquals(registry.metrics(), expectedExpositionText);
});
