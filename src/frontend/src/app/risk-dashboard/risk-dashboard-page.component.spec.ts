import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RiskDashboardPageComponent } from './risk-dashboard-page.component';
import { OrderService } from '../services/order.service';
import { OrdersResponse } from '../models/order.model';

/**
 * QA-STRATEGY-001 S1's frontend unit-test scope: staleness display logic. The dashboard shows
 * "Last Scored: <timestamp>" when the server reports a `scoresAsOf` value, and the distinct
 * "No scores available" text when it is null -- these must never render the same way, since an
 * analyst relying on a risk queue needs to know whether the scores on screen are current or
 * simply absent.
 */
describe('RiskDashboardPageComponent staleness display', () => {
  let fixture: ComponentFixture<RiskDashboardPageComponent>;

  function setUpWith(response: OrdersResponse): void {
    const orderServiceStub: Partial<OrderService> = {
      listOrders: () => of(response),
    };
    TestBed.configureTestingModule({
      imports: [RiskDashboardPageComponent],
      providers: [{ provide: OrderService, useValue: orderServiceStub }],
    });
    fixture = TestBed.createComponent(RiskDashboardPageComponent);
    fixture.detectChanges();
  }

  function text(): string {
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  }

  it('shows the last-scored timestamp when scoresAsOf is present', () => {
    setUpWith({ scoresAsOf: '2026-11-01T12:00:00Z', orders: [] });

    expect(text()).toContain('Last Scored:');
    expect(text()).not.toContain('No scores available');
  });

  it('shows "No scores available" instead of a timestamp when scoresAsOf is null', () => {
    setUpWith({ scoresAsOf: null, orders: [] });

    expect(text()).toContain('No scores available');
    expect(text()).not.toContain('Last Scored:');
  });

  it('exposes scoresAsOf as a signal reflecting exactly what the service returned', () => {
    setUpWith({ scoresAsOf: '2026-11-01T12:00:00Z', orders: [] });
    const component = fixture.componentInstance;

    expect(component.scoresAsOf()).toBe('2026-11-01T12:00:00Z');
  });
});
