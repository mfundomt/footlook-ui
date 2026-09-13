import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-overview',
  template: `
    <section class="dashboard">
      <div class="dashboard-heading"><div><p class="eyebrow">WORKSPACE / OVERVIEW</p><h1>Good morning, team.</h1></div><span class="live"><i></i> LIVE CAPTURE</span></div>
      <div class="stats"><article><span>Requests (24h)</span><strong>1,284</strong><small class="up">+12.8%</small></article><article><span>Success rate</span><strong>99.2%</strong><small class="up">+0.4%</small></article><article><span>Avg. duration</span><strong>142ms</strong><small class="down">-18ms</small></article></div>
      <div class="activity"><div class="section-title"><h2>Recent requests</h2><span>Last 24 hours</span></div>@for (request of requests; track request.path) {<div class="request"><span class="method">{{ request.method }}</span><code>{{ request.path }}</code><span class="status">{{ request.status }}</span><span class="duration">{{ request.duration }}</span></div>}</div>
    </section>
  `,
  styles: `
    :host { display: block; } .dashboard { max-width: 1180px; margin: auto; padding: clamp(3rem, 7vw, 6rem) clamp(1.25rem, 5vw, 4rem); }
    .dashboard-heading, .section-title { align-items: center; display: flex; justify-content: space-between; } .eyebrow { color: var(--muted); font: .7rem var(--mono); letter-spacing: .08em; }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); letter-spacing: -.06em; margin: 1rem 0 3rem; } h2 { font-size: 1.2rem; margin: 0; } .section-title span { color: var(--muted); font: .75rem var(--mono); }
    .live { color: var(--signal); font: .7rem var(--mono); } .live i { background: var(--signal); border-radius: 50%; display: inline-block; height: .5rem; margin-right: .4rem; width: .5rem; }
    .stats { display: grid; gap: 1rem; grid-template-columns: repeat(3, 1fr); margin-bottom: 5rem; } .stats article { background: var(--panel); padding: 1.5rem; } .stats span, small { color: var(--muted); display: block; font: .75rem var(--mono); } strong { display: block; font-size: 2.5rem; margin: 1.5rem 0 .5rem; } .up { color: var(--signal); } .down { color: var(--accent); }
    .activity { border-top: 1px solid var(--line); padding-top: 1.5rem; } .request { align-items: center; border-bottom: 1px solid var(--line); display: grid; gap: 1rem; grid-template-columns: 4rem 1fr 5rem 5rem; padding: 1.25rem 0; } .method, .status { color: var(--accent); font: .7rem var(--mono); } code, .duration { font: .8rem var(--mono); } .status { color: var(--signal); }
    @media (max-width: 680px) { .dashboard-heading { align-items: flex-start; flex-direction: column; } .live { margin-bottom: 2rem; } .stats { grid-template-columns: 1fr; } .request { gap: .5rem; grid-template-columns: 3.5rem 1fr 4rem; } .duration { grid-column: 2 / -1; } }
  `,
})
export class OverviewComponent {
  protected readonly requests = [
    { method: 'GET', path: '/api/v1/orders/active', status: '200 OK', duration: '142ms' },
    { method: 'POST', path: '/api/v1/checkout', status: '201 CREATED', duration: '284ms' },
    { method: 'GET', path: '/api/v1/users/me', status: '200 OK', duration: '61ms' },
    { method: 'PATCH', path: '/api/v1/settings', status: '500 ERROR', duration: '903ms' },
  ];
}