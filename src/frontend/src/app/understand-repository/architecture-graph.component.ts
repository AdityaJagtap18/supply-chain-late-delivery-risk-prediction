import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, signal } from '@angular/core';
import cytoscape, { Core, NodeSingular } from 'cytoscape';
import { ARCHITECTURE_EDGES, ARCHITECTURE_NODES } from '../shared/repository-metadata.data';
import { ArchitectureEdge, ArchitectureNode } from '../shared/repository-metadata.model';

const KIND_COLORS: Record<string, string> = {
  frontend: '#1263d6',
  backend: '#174a8b',
  'ml-service': '#0b8f6b',
  database: '#8a3ffc',
  artifacts: '#b45309',
  scripts: '#64748b',
  infra: '#0b1930',
  docs: '#64748b',
  tests: '#18a765',
};

type SelectedInfo =
  | { type: 'node'; node: ArchitectureNode }
  | { type: 'edge'; edge: ArchitectureEdge }
  | null;

/**
 * Interactive repository architecture graph, built with Cytoscape.js. Cytoscape was chosen over
 * D3.js or vis-network because it natively provides every interaction this view needs (zoom, pan,
 * drag, tap-to-select, programmatic fit/reset) with no hand-rolled physics or event plumbing, and
 * no Angular wrapper is needed -- it is driven directly off an ElementRef. Nodes and edges are
 * the curated, verified data in repository-metadata.data.ts; nothing here is invented or scanned
 * from the filesystem at runtime.
 */
@Component({
  selector: 'app-architecture-graph',
  standalone: true,
  template: `
    <div class="graph-shell">
      <div class="toolbar">
        <button type="button" (click)="fitToScreen()">Fit to Screen</button>
        <button type="button" (click)="resetView()">Reset View</button>
      </div>
      <div class="canvas" #canvas></div>
      <div class="info-panel">
        @if (selected(); as sel) {
          @if (sel.type === 'node') {
            <h3>{{ sel.node.label }}</h3>
            <p>{{ sel.node.description }}</p>
          } @else {
            <h3>{{ sel.edge.source }} &rarr; {{ sel.edge.target }} <span class="edge-label">({{ sel.edge.label }})</span></h3>
            <p>{{ sel.edge.description }}</p>
          }
        } @else {
          <p class="hint">Click a component or connection to see what it is and how it relates to the rest of the system. Drag to pan, scroll/pinch to zoom, drag a node to reposition it.</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .graph-shell {
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        overflow: hidden;
      }
      .toolbar {
        display: flex;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-bottom: 1px solid var(--border);
        background: var(--page-bg);
      }
      .toolbar button {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 6px;
        padding: 6px 12px;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
      }
      .toolbar button:hover {
        border-color: var(--primary);
        color: var(--primary);
      }
      .canvas {
        width: 100%;
        height: 420px;
      }
      .info-panel {
        border-top: 1px solid var(--border);
        padding: var(--space-3);
        min-height: 72px;
        background: var(--page-bg);
      }
      .info-panel h3 {
        font-size: 14px;
        margin: 0 0 var(--space-2);
      }
      .info-panel p {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
      }
      .hint {
        margin: 0;
        font-size: 13px;
        color: var(--text-secondary);
      }
      .edge-label {
        color: var(--text-secondary);
        font-weight: 400;
      }
      @media (max-width: 560px) {
        .canvas {
          height: 320px;
        }
      }
    `,
  ],
})
export class ArchitectureGraphComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') private canvasRef!: ElementRef<HTMLDivElement>;

  selected = signal<SelectedInfo>(null);

  private cy: Core | null = null;

  ngAfterViewInit(): void {
    const elements = [
      ...ARCHITECTURE_NODES.map((node) => ({
        data: { id: node.id, label: node.label, kind: node.kind },
      })),
      ...ARCHITECTURE_EDGES.map((edge) => ({
        data: {
          id: `${edge.source}__${edge.target}`,
          source: edge.source,
          target: edge.target,
          label: edge.label,
        },
      })),
    ];

    this.cy = cytoscape({
      container: this.canvasRef.nativeElement,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (el: NodeSingular) => KIND_COLORS[el.data('kind')] ?? '#64748b',
            label: 'data(label)',
            color: '#172033',
            'font-size': 11,
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            width: 44,
            height: 44,
            'border-width': 2,
            'border-color': '#ffffff',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#b7c2d4',
            'target-arrow-color': '#b7c2d4',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 9,
            color: '#64748b',
            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
          },
        },
        {
          selector: '.highlighted',
          style: {
            'line-color': '#1263d6',
            'target-arrow-color': '#1263d6',
            width: 3,
          },
        },
        {
          selector: '.dimmed',
          style: { opacity: 0.25 },
        },
      ],
      layout: { name: 'cose', animate: false, padding: 30 },
      minZoom: 0.3,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
    });

    this.cy.on('tap', 'node', (evt) => {
      const id = evt.target.id() as string;
      const node = ARCHITECTURE_NODES.find((n) => n.id === id);
      if (node) {
        this.selected.set({ type: 'node', node });
      }
      this.highlightAround(evt.target);
    });

    this.cy.on('tap', 'edge', (evt) => {
      const source = evt.target.data('source') as string;
      const target = evt.target.data('target') as string;
      const edge = ARCHITECTURE_EDGES.find((e) => e.source === source && e.target === target);
      if (edge) {
        this.selected.set({ type: 'edge', edge });
      }
      this.cy!.elements().removeClass('highlighted dimmed');
      this.cy!.elements().not(evt.target).addClass('dimmed');
      evt.target.removeClass('dimmed').addClass('highlighted');
    });

    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.selected.set(null);
        this.cy!.elements().removeClass('highlighted dimmed');
      }
    });

    this.cy.fit(undefined, 30);
  }

  private highlightAround(node: NodeSingular): void {
    if (!this.cy) return;
    const neighborhood = node.closedNeighborhood();
    this.cy.elements().removeClass('highlighted dimmed');
    this.cy.elements().not(neighborhood).addClass('dimmed');
    neighborhood.edges().addClass('highlighted');
  }

  fitToScreen(): void {
    this.cy?.fit(undefined, 30);
  }

  resetView(): void {
    if (!this.cy) return;
    this.cy.elements().removeClass('highlighted dimmed');
    this.selected.set(null);
    this.cy.layout({ name: 'cose', animate: false, padding: 30 }).run();
    this.cy.fit(undefined, 30);
  }

  ngOnDestroy(): void {
    this.cy?.destroy();
  }
}
