import { Collector } from "./collector.ts";
import { Output } from "./metric.ts";

export type Exposition = (collectors: Collector[]) => string;

export const rawOutputsExposition: Exposition = (collectors) => {
  let allOutputs: Output[] = [];

  for (const collector of collectors) {
    for (const metric of collector.collect()) {
      const outputs = metric.outputs();

      if (outputs) {
        allOutputs = allOutputs.concat(outputs);
      }
    }
  }

  return JSON.stringify(allOutputs);
};

export const defaultExposition: Exposition = (collectors) => {
  let text = "";

  for (const collector of collectors) {
    let collectorText =
      `# HELP ${collector.name} ${collector.help}\n# TYPE ${collector.name} ${collector.type}\n`;

    let count = 0;

    for (const metric of collector.collect()) {
      const outputs = metric.outputs();

      if (outputs !== undefined) {
        const metricText = outputs.map((output) => {
          let labels = Object.entries(output[1]).map(([name, value]) => {
            return `${name}="${value}"`;
          }).join(",");

          if (labels.length > 0) {
            labels = `{${labels}}`;
          }

          return `${output[0]}${labels} ${output[2]}`;
        }).join("\n");

        collectorText += metricText + "\n";
        count++;
      }
    }

    if (count > 0) {
      text += collectorText + "\n";
    }
  }

  text = text.slice(0, -1); // remove last new line
  return text;
};
