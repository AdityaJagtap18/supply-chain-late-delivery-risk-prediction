import { Component, Input, forwardRef, signal } from '@angular/core';
import { RepositoryDirectoryEntry } from '../shared/repository-metadata.model';

/**
 * Expand/collapse directory tree over the curated, hand-written repository-metadata.data.ts list
 * -- never a live filesystem scan, so it can only ever show what has been explicitly reviewed and
 * listed as safe to describe (paths and one-line explanations only, no file contents).
 */
@Component({
  selector: 'app-repository-explorer',
  standalone: true,
  imports: [forwardRef(() => RepositoryExplorerComponent)],
  template: `
    <ul class="tree">
      @for (entry of entries; track entry.path) {
        <li>
          <button
            type="button"
            class="dir"
            [class.leaf]="!entry.children"
            (click)="toggle(entry.path)"
          >
            <span class="chevron" [class.open]="isOpen(entry.path)">&#9656;</span>
            <span class="path">{{ entry.path }}</span>
          </button>
          <p class="desc">{{ entry.description }}</p>
          @if (isOpen(entry.path)) {
            @if (entry.children) {
              <div class="nested">
                <app-repository-explorer [entries]="entry.children" />
              </div>
            }
            @if (entry.files) {
              <ul class="files">
                @for (file of entry.files; track file.path) {
                  <li>
                    <span class="path">{{ file.path }}</span>
                    <p class="desc">{{ file.description }}</p>
                  </li>
                }
              </ul>
            }
          }
        </li>
      }
    </ul>
  `,
  styles: [
    `
      .tree {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .tree > li {
        margin-bottom: var(--space-2);
      }
      .dir {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: none;
        border: none;
        padding: 4px 0;
        font-family: 'Consolas', monospace;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        text-align: left;
      }
      .dir.leaf {
        cursor: default;
      }
      .chevron {
        display: inline-block;
        transition: transform 0.1s ease;
        color: var(--text-secondary);
        font-size: 11px;
      }
      .chevron.open {
        transform: rotate(90deg);
      }
      .desc {
        margin: 2px 0 0 22px;
        font-size: 12px;
        color: var(--text-secondary);
      }
      .nested {
        margin-left: 22px;
        border-left: 1px solid var(--border);
        padding-left: var(--space-3);
        margin-top: var(--space-2);
      }
      .files {
        list-style: none;
        margin: var(--space-2) 0 0 22px;
        padding: 0;
        border-left: 1px solid var(--border);
        padding-left: var(--space-3);
      }
      .files li {
        margin-bottom: var(--space-2);
      }
      .files .path {
        font-family: 'Consolas', monospace;
        font-size: 12px;
        font-weight: 600;
      }
      .files .desc {
        margin: 2px 0 0;
      }
    `,
  ],
})
export class RepositoryExplorerComponent {
  @Input({ required: true }) entries!: RepositoryDirectoryEntry[];

  private openPaths = signal<Set<string>>(new Set());

  isOpen(path: string): boolean {
    return this.openPaths().has(path);
  }

  toggle(path: string): void {
    const next = new Set(this.openPaths());
    if (next.has(path)) {
      next.delete(path);
    } else {
      next.add(path);
    }
    this.openPaths.set(next);
  }
}
