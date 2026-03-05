
/* eslint-disable */
import powerbi from "powerbi-visuals-api";

import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

export class Visual implements IVisual {
  private container: HTMLDivElement;

  constructor(options?: VisualConstructorOptions) {
    // options is optional to satisfy the pbiviz precompile typing on CI
    const hostEl = options?.element ?? document.createElement("div");

    this.container = document.createElement("div");
    this.container.className = "card-root";
    this.container.textContent = "Simple Card — build sanity check";
    hostEl.appendChild(this.container);
  }

  public update(options: VisualUpdateOptions): void {
    // Keep minimal to prove bundling works
    // You can put your full card logic back here once packaging is green
    const size = Math.min(options.viewport.width, options.viewport.height);
    this.container.style.font = "600 14px Segoe UI, Arial, sans-serif";
    this.container.style.display = "flex";
    this.container.style.alignItems = "center";
    this.container.style.justifyContent = "center";
    this.container.style.width = options.viewport.width + "px";
    this.container.style.height = options.viewport.height + "px";
    this.container.textContent = `Card ready (${Math.round(size)}px)`;
  }
}
