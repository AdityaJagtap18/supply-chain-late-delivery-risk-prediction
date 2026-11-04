import { Component, signal } from '@angular/core';
import { PageHeaderComponent } from '../shared/page-header.component';
import { UnavailableNoticeComponent } from '../shared/unavailable-notice.component';
import { APP_VERSION, RELEASE_DATE } from '../shared/app-version';
import { RELEASE_NOTES } from '../shared/release-notes.data';
import { ReleaseCategory } from '../shared/release-notes.model';

const CATEGORY_ORDER: ReleaseCategory[] = [
  'Added',
  'Improved',
  'Fixed',
  'Changed',
  'Security',
  'Deprecated',
  'Removed',
];

@Component({
  selector: 'app-patch-notes-page',
  standalone: true,
  imports: [PageHeaderComponent, UnavailableNoticeComponent],
  template: `
    <app-page-header
      title="Patch Notes"
      subtitle="Release history for this application, built from its real Git history."
    />

    <section class="stats">
      <div class="stat">
        <div class="value">v{{ currentVersion }}</div>
        <div class="label">Current version</div>
      </div>
      <div class="stat">
        <div class="value">{{ latestDate }}</div>
        <div class="label">Latest release date</div>
      </div>
      <div class="stat">
        <div class="value">{{ releaseCount }}</div>
        <div class="label">Documented releases</div>
      </div>
      <div class="stat wide">
        <div class="value summary">{{ latestSummary }}</div>
        <div class="label">Latest release summary</div>
      </div>
    </section>

    <app-unavailable-notice
      title="No prior Git tags or release metadata exist"
      message="This repository's history contains two real commits and no version tags. v1.0.0 below is a documented baseline established from that history, not a reconstruction of an earlier release process. Future releases will be appended here, newest first, as new versions are tagged."
    />

    <div class="timeline">
      @for (release of releases; track release.version; let isFirst = $first) {
        <article class="release" [class.latest]="isFirst">
          <div class="rail">
            <div class="dot"></div>
          </div>
          <div class="body">
            <div class="release-header" (click)="toggle(release.version)">
              <div>
                <span class="version">v{{ release.version }}</span>
                @if (isFirst) {
                  <span class="badge">Latest</span>
                }
                <h3>{{ release.title }}</h3>
                <time>{{ release.date }}</time>
              </div>
              <span class="chevron" [class.open]="isOpen(release.version)">&#9656;</span>
            </div>
            <p class="summary-text">{{ release.summary }}</p>
            @if (isOpen(release.version)) {
              <div class="changes">
                @for (category of categoriesFor(release.version); track category) {
                  <div class="category">
                    <span class="category-tag" [attr.data-category]="category">{{ category }}</span>
                    <ul>
                      @for (change of changesFor(release.version, category); track change.description) {
                        <li>{{ change.description }}</li>
                      }
                    </ul>
                  </div>
                }
                @if (release.migrationNotes) {
                  <p class="migration"><strong>Migration notes:</strong> {{ release.migrationNotes }}</p>
                }
              </div>
            }
          </div>
        </article>
      }
    </div>
  `,
  styles: [
    `
      .stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .stat {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        text-align: center;
      }
      .stat.wide {
        grid-column: span 2;
        text-align: left;
      }
      .stat .value {
        font-size: 20px;
        font-weight: 700;
        color: var(--primary);
      }
      .stat .value.summary {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary);
      }
      .stat .label {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 4px;
      }
      .timeline {
        margin-top: var(--space-3);
      }
      .release {
        display: flex;
        gap: var(--space-3);
      }
      .rail {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--border);
        margin-top: 8px;
      }
      .release.latest .dot {
        background: var(--primary);
        box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 18%, white);
      }
      .release:not(:last-child) .rail::after {
        content: '';
        flex: 1;
        width: 2px;
        background: var(--border);
        margin-top: 4px;
      }
      .body {
        flex: 1;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--space-3);
        margin-bottom: var(--space-3);
      }
      .release.latest .body {
        border-color: var(--primary);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--primary) 12%, white);
      }
      .release-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        cursor: pointer;
      }
      .version {
        font-size: 12px;
        font-weight: 700;
        color: var(--primary);
      }
      .badge {
        margin-left: var(--space-2);
        font-size: 11px;
        font-weight: 700;
        background: var(--primary);
        color: white;
        border-radius: 999px;
        padding: 2px 8px;
      }
      .release-header h3 {
        font-size: 15px;
        margin: 4px 0 2px;
      }
      time {
        font-size: 12px;
        color: var(--text-secondary);
      }
      .chevron {
        color: var(--text-secondary);
        transition: transform 0.1s ease;
        margin-top: 4px;
      }
      .chevron.open {
        transform: rotate(90deg);
      }
      .summary-text {
        font-size: 13px;
        color: var(--text-secondary);
        margin: var(--space-2) 0 0;
      }
      .changes {
        margin-top: var(--space-3);
        border-top: 1px solid var(--border);
        padding-top: var(--space-3);
      }
      .category {
        margin-bottom: var(--space-3);
      }
      .category-tag {
        display: inline-block;
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
        padding: 2px 10px;
        margin-bottom: var(--space-2);
        background: var(--page-bg);
        color: var(--text-secondary);
      }
      .category-tag[data-category='Added'] { background: color-mix(in srgb, var(--risk-low) 14%, white); color: var(--risk-low); }
      .category-tag[data-category='Fixed'] { background: color-mix(in srgb, var(--risk-high) 14%, white); color: var(--risk-high); }
      .category-tag[data-category='Improved'],
      .category-tag[data-category='Changed'] { background: color-mix(in srgb, var(--primary) 14%, white); color: var(--primary); }
      .category-tag[data-category='Security'] { background: color-mix(in srgb, var(--risk-medium) 18%, white); color: var(--risk-medium); }
      .category ul {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
      }
      .category li {
        margin-bottom: 4px;
      }
      .migration {
        font-size: 13px;
        color: var(--text-secondary);
      }
      @media (max-width: 700px) {
        .stats {
          grid-template-columns: repeat(2, 1fr);
        }
        .stat.wide {
          grid-column: span 2;
        }
      }
      @media (max-width: 560px) {
        .rail {
          display: none;
        }
      }
    `,
  ],
})
export class PatchNotesPageComponent {
  readonly currentVersion = APP_VERSION;
  readonly latestDate = RELEASE_DATE;
  readonly releases = RELEASE_NOTES;
  readonly releaseCount = RELEASE_NOTES.length;
  readonly latestSummary = RELEASE_NOTES[0]?.summary ?? 'No releases documented yet.';

  private openVersions = signal<Set<string>>(new Set(this.releases[0] ? [this.releases[0].version] : []));

  isOpen(version: string): boolean {
    return this.openVersions().has(version);
  }

  toggle(version: string): void {
    const next = new Set(this.openVersions());
    if (next.has(version)) {
      next.delete(version);
    } else {
      next.add(version);
    }
    this.openVersions.set(next);
  }

  categoriesFor(version: string): ReleaseCategory[] {
    const release = this.releases.find((r) => r.version === version);
    if (!release) return [];
    const present = new Set(release.changes.map((c) => c.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }

  changesFor(version: string, category: ReleaseCategory) {
    const release = this.releases.find((r) => r.version === version);
    return release ? release.changes.filter((c) => c.category === category) : [];
  }
}
