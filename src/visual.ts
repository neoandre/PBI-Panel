/* eslint-disable */
/* Simple Card Visual - value + optional condition coloring + optional inline SVG icon */
import powerbi from "powerbi-visuals-api";
import IVisual = powerbi.extensibility.IVisual;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import DataView = powerbi.DataView;
import DataViewTable = powerbi.DataViewTable;
import DataViewMetadataColumn = powerbi.DataViewMetadataColumn;

export class Visual implements IVisual {
  private host: powerbi.extensibility.IVisualHost;
  private container: HTMLDivElement;
  private nameEl: HTMLDivElement;
  private valueEl: HTMLDivElement;
  private iconEl: HTMLDivElement;

  constructor(options: VisualConstructorOptions) {
    this.host = options.host;
    this.container = document.createElement('div');
    this.container.className = 'card-root';
    options.element.appendChild(this.container);

    this.nameEl = document.createElement('div');
    this.nameEl.className = 'name';
    this.container.appendChild(this.nameEl);

    this.valueEl = document.createElement('div');
    this.valueEl.className = 'value';
    this.container.appendChild(this.valueEl);

    this.iconEl = document.createElement('div');
    this.iconEl.className = 'icon';
    this.container.appendChild(this.iconEl);
  }

  public update(options: VisualUpdateOptions) {
    const dv: DataView | undefined = options.dataViews && options.dataViews[0];
    const table: DataViewTable | undefined = dv && dv.table;

    const width = Math.max(24, options.viewport.width);
    const height = Math.max(24, options.viewport.height);

    const objects = dv && dv.metadata && dv.metadata.objects || {} as powerbi.DataViewObjects;

    const gap = this.getNumber(objects, 'layout', 'gap', 6);
    const padding = this.getNumber(objects, 'layout', 'padding', 8);

    const nameFont = this.getText(objects, 'nameText', 'fontFamily', 'Segoe UI, Arial');
    const nameSize = this.getNumber(objects, 'nameText', 'fontSize', 14);
    const nameColor = this.getColor(objects, 'nameText', 'color', '#0F172A');
    const namePlacement = this.getText(objects, 'nameText', 'placement', 'top');

    const valFont = this.getText(objects, 'valueText', 'fontFamily', 'Segoe UI, Arial');
    const valSize = this.getNumber(objects, 'valueText', 'fontSize', 28);
    const valColorDefault = this.getColor(objects, 'valueText', 'color', '#0F172A');

    const iconSize = this.getNumber(objects, 'icon', 'size', 18);
    const iconPlacement = this.getText(objects, 'icon', 'placement', 'left');

    // Layout container spacing
    (this.container.style as any).gap = `${gap}px`;
    this.container.style.padding = `${padding}px`;

    // Read first row from table mapping
    let value: any = '';
    let condition: any = undefined;
    let iconSvg: string | undefined = undefined;
    let measureName: string = 'Measure';

    if (table && table.rows && table.rows.length > 0) {
      const row = table.rows[0];
      const cols = table.columns || [] as DataViewMetadataColumn[];

      const idxMeasure = cols.findIndex(c => c.roles && (c.roles as any)['measure']);
      const idxCond = cols.findIndex(c => c.roles && (c.roles as any)['condition']);
      const idxIcon = cols.findIndex(c => c.roles && (c.roles as any)['iconSvg']);

      if (idxMeasure >= 0) {
        value = row[idxMeasure];
        measureName = cols[idxMeasure].displayName || measureName;
      }
      if (idxCond >= 0) condition = row[idxCond];
      if (idxIcon >= 0) iconSvg = (row[idxIcon] != null) ? String(row[idxIcon]) : undefined;
    }

    // Format the value
    const formatted = this.formatValue(value);

    // Determine value color possibly from condition
    const valueColor = this.colorFromCondition(condition, valColorDefault);

    // Apply name styles/content
    this.nameEl.textContent = measureName || '';
    this.nameEl.style.fontFamily = nameFont;
    this.nameEl.style.fontSize = `${nameSize}px`;
    this.nameEl.style.color = nameColor;

    // Apply value styles/content
    this.valueEl.textContent = formatted;
    this.valueEl.style.fontFamily = valFont;
    this.valueEl.style.fontSize = `${valSize}px`;
    this.valueEl.style.color = valueColor;

    // Render icon (from inline SVG string)
    this.iconEl.innerHTML = '';
    if (iconSvg && iconSvg.trim().length > 0) {
      const svg = this.ensureSvg(iconSvg);
      if (svg) {
        svg.setAttribute('width', String(iconSize));
        svg.setAttribute('height', String(iconSize));
        this.iconEl.appendChild(svg);
      }
    }

    // Position elements in 3x3 grid
    this.positionElement(this.iconEl, iconPlacement);
    this.positionElement(this.nameEl, namePlacement);
    this.valueEl.style.gridRow = '2';
    this.valueEl.style.gridColumn = '2';

    // Align container
    this.container.style.width = `${width}px`;
    this.container.style.height = `${height}px`;
  }

  private positionElement(el: HTMLElement, placement: string) {
    el.classList.remove('center','right');
    switch ((placement || 'left').toLowerCase()) {
      case 'left':
        el.style.gridRow = '2'; el.style.gridColumn = '1'; break;
      case 'right':
        el.style.gridRow = '2'; el.style.gridColumn = '3'; el.classList.add('right'); break;
      case 'top':
      case 'above':
        el.style.gridRow = '1'; el.style.gridColumn = '2'; el.classList.add('center'); break;
      case 'bottom':
      case 'below':
        el.style.gridRow = '3'; el.style.gridColumn = '2'; el.classList.add('center'); break;
      default:
        el.style.gridRow = '2'; el.style.gridColumn = '1';
    }
  }

  private ensureSvg(input: string): SVGSVGElement | null {
    try {
      const trimmed = input.trim();
      if (trimmed.startsWith('data:image/svg+xml')) {
        const comma = trimmed.indexOf(',');
        const svgText = decodeURIComponent(trimmed.slice(comma + 1));
        return this.ensureSvg(svgText);
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(trimmed, 'image/svg+xml');
      const svg = doc.documentElement as unknown as SVGSVGElement;
      if (svg && svg.tagName.toLowerCase() === 'svg') return svg;
    } catch {}
    return null;
  }

  private formatValue(v: any): string {
    if (v == null) return '';
    if (typeof v === 'number') return this.compact(v);
    const num = Number(v);
    if (!isNaN(num)) return this.compact(num);
    return String(v);
  }

  private compact(n: number): string {
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n/1e9).toFixed(2).replace(/\.00$/,'') + 'B';
    if (abs >= 1e6) return (n/1e6).toFixed(2).replace(/\.00$/,'') + 'M';
    if (abs >= 1e3) return (n/1e3).toFixed(2).replace(/\.00$/,'') + 'K';
    return n.toLocaleString();
  }

  private getNumber(objects: powerbi.DataViewObjects, obj: string, prop: string, def: number): number {
    try {
      const v = ((objects as any)[obj]?.[prop] as any);
      const n = typeof v === 'number' ? v : Number(v);
      return isFinite(n) ? n : def;
    } catch { return def; }
  }
  private getText(objects: powerbi.DataViewObjects, obj: string, prop: string, def: string): string {
    try { const v = ((objects as any)[obj]?.[prop] as any); return (v!=null? String(v): def); } catch { return def; }
  }
  private getColor(objects: powerbi.DataViewObjects, obj: string, prop: string, def: string): string {
    try {
      const c: any = (objects as any)[obj]?.[prop];
      if (typeof c === 'string') return c;
      if (c && c.solid && c.solid.color) return String(c.solid.color);
      return def;
    } catch { return def; }
  }

  private colorFromCondition(cond: any, fallback: string): string {
    if (cond == null) return fallback;
    const s = String(cond).trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(s)) return s;
    const key = s.toLowerCase();
    if (["good","ok","green","pass","true"].includes(key)) return '#28FF18';
    if (["warn","warning","yellow","amber"].includes(key)) return '#FFEA04';
    if (["bad","red","fail","false"].includes(key)) return '#FF2C2C';
    const n = Number(s);
    if (!isNaN(n)) { if (n>0) return '#28FF18'; if (n===0) return '#FFEA04'; return '#FF2C2C'; }
    return fallback;
  }
}
