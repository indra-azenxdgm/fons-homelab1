declare module "cal-heatmap" {
  export default class CalHeatmap {
    paint(options: unknown): Promise<void>;
    destroy(): void;
  }
}
