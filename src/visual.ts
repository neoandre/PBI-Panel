/* eslint-disable */
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;

export class Visual implements IVisual {
  private container: HTMLDivElement;
  constructor(options?: VisualConstructorOptions) {
    const hostEl = options?.element ?? document.createElement('div');
    this.container = document.createElement('div');
    this.container.className = 'card-root';
    this.container.textContent = 'Simple Card — packaging check';
    hostEl.appendChild(this.container);
  }
  public update(options: VisualUpdateOptions): void {
    this.container.style.display = 'flex';
    this.container.style.alignItems = 'center';
    this.container.style.justifyContent = 'center';
    this.container.style.font = '600 14px Segoe UI, Arial, sans-serif';
    this.container.style.width = options.viewport.width + 'px';
    this.container.style.height = options.viewport.height + 'px';
  }
}
