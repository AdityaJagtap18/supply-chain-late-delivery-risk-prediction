import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskLevelBadgeComponent } from './risk-level-badge.component';

/**
 * QA-STRATEGY-001 S1's frontend unit-test scope: RiskLevelBadge rendering, including the
 * null/undefined "Stale/Unscored" fourth state UI-DESIGN-001 S3.1 requires to be visually
 * distinct from "Low" (never defaulted to it) and WCAG's "icon + color + text together, never
 * color alone" rule, verified here by asserting the icon/text/css-class triad together.
 */
describe('RiskLevelBadgeComponent', () => {
  let fixture: ComponentFixture<RiskLevelBadgeComponent>;
  let component: RiskLevelBadgeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RiskLevelBadgeComponent] });
    fixture = TestBed.createComponent(RiskLevelBadgeComponent);
    component = fixture.componentInstance;
  });

  function render(riskBand: string | null | undefined): string {
    component.riskBand = riskBand;
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent?.trim() ?? '';
  }

  it('renders the High band with its icon, label, and css class', () => {
    expect(render('High')).toContain('High');
    expect(component.cssClass()).toBe('high');
    expect(component.icon()).toBe('▲');
  });

  it('renders the Medium band with its icon, label, and css class', () => {
    expect(render('Medium')).toContain('Medium');
    expect(component.cssClass()).toBe('medium');
    expect(component.icon()).toBe('●');
  });

  it('renders the Low band with its icon, label, and css class', () => {
    expect(render('Low')).toContain('Low');
    expect(component.cssClass()).toBe('low');
    expect(component.icon()).toBe('✓');
  });

  it('is case-insensitive when matching a recognized band', () => {
    render('HIGH');
    expect(component.cssClass()).toBe('high');
  });

  it('renders the stale/unscored state for a null riskBand, never defaulting to Low', () => {
    render(null);
    expect(component.cssClass()).toBe('stale');
    expect(component.label()).toBe('Unscored');
    expect(component.icon()).toBe('–');
  });

  it('renders the stale/unscored state for an undefined riskBand', () => {
    render(undefined);
    expect(component.cssClass()).toBe('stale');
    expect(component.label()).toBe('Unscored');
  });

  it('renders the stale/unscored state for an unrecognized band value', () => {
    render('not-a-real-band');
    expect(component.cssClass()).toBe('stale');
    expect(component.icon()).toBe('–');
  });
});
