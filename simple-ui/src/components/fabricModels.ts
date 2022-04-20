import { fabric } from 'fabric';
import { event } from 'quasar';
import { useCanvasStore } from 'stores/canvasStore';
import { useConfigStore } from 'stores/configStore';

export enum IOType {
  INPUT,
  OUTPUT,
}

export abstract class FabricPort extends fabric.Circle {
  public getAbsoluteXY = () => {
    return fabric.util.transformPoint(
      new fabric.Point(this.left, this.top),
      this.group.calcTransformMatrix()
    );
  };

  public containsMousePoint = (point: fabric.Point) => {
    const pt = this.getAbsoluteXY();
    return new fabric.Object({
      left: pt.x,
      top: pt.y,
      width: this.width,
      height: this.height,
    }).containsPoint(point);
  };

  public abstract isConnected(): boolean;

  constructor(
    name: string,
    public readonly paramName: string,
    public readonly paramType: string,
    public readonly ioType: IOType,
    radius: number,
    left: number,
    top: number,
    objectStrokeWidth: number
  ) {
    super({
      name: name,
      type: 'port',
      radius: radius,
      left: left,
      top: top,
      stroke: 'black',
      strokeWidth: objectStrokeWidth,
      fill: 'gray',
      hoverCursor: 'pointer',
    });

    this.on('mousedown', (opt: fabric.IEvent<Event>) => {
      const canvasStore = useCanvasStore();

      if (event.leftClick(opt.e as MouseEvent)) {
        if (canvasStore.selectedPort == null) {
          canvasStore.selectedPort = this;
        }
      }
    });
  }
}

export class InputFabricPort extends FabricPort {
  private _edge: FabricEdge;
  public get edge(): FabricEdge {
    return this._edge;
  }
  public set edge(v: FabricEdge) {
    this._edge = v;
    this.fill = v ? '#5DFF77' : 'gray';
    this.group.dirty = true;
  }

  public isConnected(): boolean {
    return this.edge != null;
  }

  constructor(
    name: string,
    public readonly paramName: string,
    public readonly paramType: string,
    radius: number,
    left: number,
    top: number,
    objectStrokeWidth: number
  ) {
    super(
      name,
      paramName,
      paramType,
      IOType.INPUT,
      radius,
      left,
      top,
      objectStrokeWidth
    );
  }
}

export class OutputFabricPort extends FabricPort {
  static CustomArray = class extends Array<FabricEdge> {
    constructor(private port: FabricPort) {
      super();
    }

    push(...items: FabricEdge[]): number {
      const oldLength = this.length;
      const res = super.push(...items);
      if (oldLength == 0) {
        this.port.fill = '#5DFF77';
        this.port.group.dirty = true;
      }
      return res;
    }

    splice(start: number, deleteCount?: number): FabricEdge[] {
      const res = super.splice(start, deleteCount);
      if (this.length == 0) {
        this.port.fill = 'gray';
        this.port.group.dirty = true;
      }
      return res;
    }
  };

  private _edges = new OutputFabricPort.CustomArray(this);
  public get edges(): FabricEdge[] {
    return this._edges;
  }

  public isConnected(): boolean {
    return this.edges.length > 0;
  }

  constructor(
    name: string,
    public readonly paramName: string,
    public readonly paramType: string,
    radius: number,
    left: number,
    top: number,
    objectStrokeWidth: number
  ) {
    super(
      name,
      paramName,
      paramType,
      IOType.OUTPUT,
      radius,
      left,
      top,
      objectStrokeWidth
    );
  }
}

export class FabricNode extends fabric.Group {
  private readonly rectPadding = 20;
  private readonly ioSize = 16;
  private readonly ioPadding = 20;
  private readonly textPadding = 10;
  private readonly separatorPadding = 50;
  private readonly nodeNameFontSize = 32;
  private readonly portNameFontSize = 24;
  private readonly objectStrokeWidth = 2;
  private _outputPorts = [] as OutputFabricPort[];
  public get outputPorts(): OutputFabricPort[] {
    return this._outputPorts;
  }
  private _inputPorts = [] as InputFabricPort[];
  public get inputPorts(): InputFabricPort[] {
    return this._inputPorts;
  }

  constructor(
    nodeName: string,
    private readonly nodeText: string,
    public readonly nodePackage: string,
    centerX: number,
    centerY: number,
    public readonly inputs: Map<string, string> = new Map<string, string>(),
    public readonly outputs: Map<string, string> = new Map<string, string>()
  ) {
    super([], {
      name: nodeName,
      type: 'node',
      subTargetCheck: true,
    });
    this.setControlsVisibility({
      bl: false,
      br: false,
      mb: false,
      ml: false,
      mr: false,
      mt: false,
      tl: false,
      tr: false,
      mtr: false,
    });
    const t = new fabric.IText(nodeText, {
      fontSize: this.nodeNameFontSize,
    });
    const s = new fabric.Path(
      'M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z',
      {
        left: t.left + t.width + this.textPadding,
        top: t.top,
      }
    );
    const canvasStore = useCanvasStore();
    s.on('mouseup', (e: fabric.IEvent<Event>) => {
      if (e.isClick) {
        canvasStore.selectedNodes = [
          {
            name: this.name,
            package: this.nodePackage,
          },
        ];
        canvasStore.doubleClick = true;
      }
    });
    const br = new fabric.Rect({
      width:
        t.getBoundingRect().width +
        this.textPadding +
        s.width +
        this.rectPadding,
      height: t.getBoundingRect().height + this.rectPadding,
      fill: '#F5F5F5',
      stroke: 'black',
      strokeWidth: this.objectStrokeWidth,
      rx: 10,
      ry: 10,
    });
    br.left -= this.rectPadding / 2;
    br.top -= this.rectPadding / 2;

    let maxInputWidth = 0;
    let maxOutputWidth = 0;
    const outTexts = [] as fabric.Text[];
    const outIter = this.outputs.keys();
    for (let o = 0; o < this.outputs.size; o++) {
      const next = outIter.next();

      const op = new OutputFabricPort(
        `${this.name}-{out}-${next.value as string}`,
        next.value,
        this.outputs.get(next.value),
        this.ioSize,
        br.left + br.width - this.ioSize,
        br.top +
          br.height +
          this.ioPadding / 2 +
          o * (this.ioSize * 2 + this.ioPadding),
        this.objectStrokeWidth
      );
      this._outputPorts.push(op);

      const ot = new fabric.Text(next.value, {
        fontSize: this.portNameFontSize,
      });
      ot.top = op.top + (op.height - ot.height) / 2;
      ot.left = op.left - ot.width - this.textPadding;
      outTexts.push(ot);

      if (ot.width + this.textPadding + op.width / 2 > maxOutputWidth) {
        maxOutputWidth = ot.width + this.textPadding + op.width / 2;
      }
    }

    const inTexts = [] as fabric.Text[];
    const inIter = this.inputs.keys();
    for (let i = 0; i < this.inputs.size; i++) {
      const next = inIter.next();

      const ip = new InputFabricPort(
        `${this.name}-{in}-${next.value as string}`,
        next.value,
        this.inputs.get(next.value),
        this.ioSize,
        br.left - this.ioSize,
        br.top +
          br.height +
          this.ioPadding / 2 +
          i * (this.ioSize * 2 + this.ioPadding),
        this.objectStrokeWidth
      );
      this._inputPorts.push(ip);

      const it = new fabric.Text(next.value, {
        fontSize: this.portNameFontSize,
      });
      it.top = ip.top + (ip.height - it.height) / 2;
      it.left = ip.left + ip.width + this.textPadding;
      inTexts.push(it);

      if (ip.width / 2 + this.textPadding + it.width > maxInputWidth) {
        maxInputWidth = ip.width / 2 + this.textPadding + it.width;
      }
    }

    br.height +=
      Math.max(this._inputPorts.length, this._outputPorts.length) *
      (this.ioSize * 2 + this.ioPadding);

    let maxWidth = maxInputWidth + maxOutputWidth;
    if (
      (this._inputPorts.length == 0 || this._outputPorts.length == 0) &&
      !(this._inputPorts.length == 0 && this._outputPorts.length == 0)
    ) {
      maxWidth += this.textPadding;
    }

    if (this._inputPorts.length > 0 && this._outputPorts.length > 0) {
      maxWidth += this.separatorPadding;
    }

    if (maxWidth > br.width) {
      const delta = maxWidth - br.width;
      br.width += delta;
      t.left += delta / 2;
      this._outputPorts.forEach((op) => (op.left += delta));
      outTexts.forEach((ot) => (ot.left += delta));
    }

    const tr = new fabric.Rect({
      width: br.width,
      height: t.getBoundingRect().height + this.rectPadding,
      fill: '#FF8038',
      stroke: 'black',
      strokeWidth: this.objectStrokeWidth,
      rx: 10,
      ry: 10,
    });
    tr.left -= this.rectPadding / 2;
    tr.top -= this.rectPadding / 2;

    s.left = tr.left + tr.width - this.textPadding - s.width;

    let vl;
    if (this._inputPorts.length > 0 && this._outputPorts.length > 0) {
      vl = new fabric.Line(
        [
          (br.left + maxInputWidth + br.left + br.width - maxOutputWidth) / 2,
          tr.top + tr.height,
          (br.left + maxInputWidth + br.left + br.width - maxOutputWidth) / 2,
          br.top + br.height,
        ],
        {
          stroke: 'black',
          strokeWidth: this.objectStrokeWidth,
        }
      );
    }

    this.addWithUpdate(br);
    this.addWithUpdate(tr);
    this.addWithUpdate(t);
    this.addWithUpdate(s);
    this.addWithUpdate(vl);
    this._outputPorts.forEach((op) => this.addWithUpdate(op));
    outTexts.forEach((ot) => this.addWithUpdate(ot));
    this._inputPorts.forEach((ip) => this.addWithUpdate(ip));
    inTexts.forEach((it) => this.addWithUpdate(it));

    this.left = centerX - this.width / 2;
    this.top = centerY - this.height / 2;
  }

  getAbsoluteXY = () => {
    return fabric.util.transformPoint(
      new fabric.Point(this.left, this.top),
      this.group.calcTransformMatrix()
    );
  };

  removeNode = () => {
    const canvasStore = useCanvasStore();
    const configStore = useConfigStore();
    (this.getObjects('port') as FabricPort[]).forEach((p) => {
      if (p.ioType == IOType.INPUT) {
        const ip = p as InputFabricPort;
        if (ip.edge) {
          disconnectEdge(ip.edge);
        }
      } else {
        const op = p as OutputFabricPort;
        if (op.edges.length > 0) {
          [...op.edges].forEach((e) => disconnectEdge(e));
        }
      }
    });
    canvasStore.removeCanvasNode(this.name);
    [
      ...this.canvas.getObjects('node').filter((n) => n.name === this.name),
    ].forEach((n) => {
      n.selectable = false;
      this.canvas.fxRemove(n);
    });
    configStore.removeNodeConfig(this);
  };

  cloneNode = (cloneNodeId: string) => {
    return new FabricNode(
      cloneNodeId,
      this.nodeText,
      this.nodePackage,
      this.group
        ? this.getAbsoluteXY().x + this.width / 2 + 100
        : this.left + this.width / 2 + 100,
      this.group
        ? this.getAbsoluteXY().y + this.height / 2 + 100
        : this.top + this.height / 2 + 100,
      this.inputs,
      this.outputs
    );
  };

  removeGroupInfoIfInsideGroup = () => {
    if (!this.group) {
      return;
    }
    const point = this.getAbsoluteXY();
    this.group = null;
    this.left = point.x;
    this.top = point.y;
  };

  toJSONObject = () => {
    this.removeGroupInfoIfInsideGroup();
    return {
      name: this.name,
      package: this.nodePackage,
      centerX: this.left + this.width / 2,
      centerY: this.top + this.height / 2,
    };
  };

  getPortFromParamName = (ioType: IOType, paramName: string) => {
    return ioType == IOType.INPUT
      ? this._inputPorts.find((ip) => ip.paramName === paramName)
      : this._outputPorts.find((op) => op.paramName === paramName);
  };
}

export function disconnectEdge(edge: FabricEdge) {
  const canvasStore = useCanvasStore();
  const toPort = edge.to;
  toPort.canvas
    .getObjects('edge')
    .filter((e) => e.name === edge.name)
    .forEach((e) => toPort.canvas.fxRemove(e));
  canvasStore.removeCanvasEdge(edge.name);
  const index = edge.from.edges.findIndex((e) => e.name === edge.name);
  if (index != -1) {
    const edgeToRemove = edge.from.edges.splice(index, 1)[0];
    toPort.canvas.fxRemove(edgeToRemove);
    canvasStore.removeCanvasEdge(edgeToRemove.name);
  }
  toPort.edge = null;
}

export class FabricEdge extends fabric.Path {
  private _from: OutputFabricPort;
  public get from(): OutputFabricPort {
    return this._from;
  }
  public set from(v: OutputFabricPort) {
    this._from = v;
  }

  private _to: InputFabricPort;
  public get to(): InputFabricPort {
    return this._to;
  }
  public set to(v: InputFabricPort) {
    this._to = v;
  }

  constructor(
    port: FabricPort,
    private initialX: number = 0,
    private initialY: number = 0
  ) {
    super([], {
      type: 'edge',
      fill: '',
      stroke: 'black',
      strokeWidth: 3,
      selectable: false,
      evented: false,
    });

    if (port.ioType == IOType.INPUT) {
      this.to = port as InputFabricPort;
    } else {
      this.from = port as OutputFabricPort;
    }

    this.updatePath(this.initialX, this.initialY, this.initialX, this.initialY);
  }

  private updatePath = (p1x: number, p1y: number, p2x: number, p2y: number) => {
    const newPath = new fabric.Path(
      `L${p1x},${p1y} C${(p1x + p2x) / 2},${p1y} ${
        (p1x + p2x) / 2
      },${p2y} ${p2x},${p2y}`
    );
    this.path = newPath.path;
    this.width = Math.abs(p1x - p2x);
    this.height = Math.abs(p1y - p2y);
    this.left = Math.min(p1x, p2x);
    this.top = Math.min(p1y, p2y);
    this.pathOffset.x = (p1x + p2x) / 2;
    this.pathOffset.y = (p1y + p2y) / 2;
    this.dirty = true;
  };

  updateCoords = (newX: number, newY: number) => {
    this.from
      ? this.updatePath(this.initialX, this.initialY, newX, newY)
      : this.updatePath(newX, newY, this.initialX, this.initialY);
  };

  updateEdge = () => {
    const inputX = this.to.getAbsoluteXY().x;
    const inputY = this.to.getAbsoluteXY().y + this.to.width / 2;
    const outputX = this.from.getAbsoluteXY().x + this.from.width;
    const outputY = this.from.getAbsoluteXY().y + this.from.height / 2;
    this.updatePath(outputX, outputY, inputX, inputY);
  };

  connectToPort = (port: FabricPort) => {
    const canvasStore = useCanvasStore();
    if (port.ioType == IOType.INPUT) {
      this.to = port as InputFabricPort;
    } else {
      this.from = port as OutputFabricPort;
    }
    this.name = this.from.name + '|' + this.to.name;
    if (this.to.edge) {
      disconnectEdge(this.to.edge);
    }
    this.from.edges.push(this);
    this.to.edge = this;
    canvasStore.addCanvasEdge(this);
    this.updateEdge();

    this.from.group.on('moving', () => {
      this.updateEdge();
    });

    this.to.group.on('moving', () => {
      this.updateEdge();
    });
  };
}
