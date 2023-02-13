export type Labels = { [key: string]: string };
export type Output = [string, Labels, number];

export abstract class Metric {
  protected labelNames: string[];
  protected labelValues: string[];

  constructor(
    labelNames: string[] = [],
    labelValues: string[] = [],
  ) {
    if (labelNames.length !== labelValues.length) {
      throw new Error("invalid number of arguments");
    }

    for (const label of labelNames) {
      if (!isValidLabelName(label)) {
        throw new Error(`invalid label name: ${label}`);
      }
    }

    this.labelNames = labelNames;
    this.labelValues = labelValues;
  }

  getLabels(additionalLabels: Labels = {}): Labels {
    const labels: Labels = {};

    for (let i = 0; i < this.labelNames.length; i++) {
      if (this.labelValues[i]) {
        labels[this.labelNames[i]] = this.labelValues[i];
      }
    }

    for (const labelName of Object.keys(additionalLabels)) {
      labels[labelName] = additionalLabels[labelName];
    }

    return labels;
  }

  getLabelsAsString(additionalLabels: Labels = {}): string {
    const labels = this.getLabels(additionalLabels);

    const labelsAsString = Object.entries(labels).map(([name, value]) => {
      return `${name}="${value}"`;
    }).join(",");

    if (labelsAsString.length > 0) {
      return `{${labelsAsString}}`;
    } else {
      return "";
    }
  }

  abstract get description(): string;
  abstract outputs(): Output[] | undefined;
}

export function isValidLabelName(label: string) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(label);
}

export interface Inc {
  inc(): void;
  inc(n: number): void;
}

export interface Dec {
  dec(): void;
  dec(n: number): void;
}

export interface Set {
  set(n: number): void;
}

export interface Observe {
  observe(n: number): void;
}

export interface Value {
  value(): number | undefined;
}
