import { AfterViewInit, Component, ElementRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BUSINESS } from '../../../../core/config/business.config';
import { DASHBOARD_URL } from '../../../../core/config/dashboard.config';
import { LEGAL_LINKS, TRADEMARK_NOTICE } from '../../../../core/config/legal-links';
import {
  Activity,
  Bell,
  CircleAlert,
  Clock3,
  Cog,
  Copy,
  createIcons,
  Download,
  ExternalLink,
  FileInput,
  FileJson,
  FileText,
  Fingerprint,
  Gauge,
  GitBranch,
  Inbox,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Monitor,
  Radio,
  Rocket,
  Route,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
  Server,
} from 'lucide';

const landingPageIcons = {
  Activity,
  Bell,
  CircleAlert,
  Clock3,
  Cog,
  Copy,
  Download,
  ExternalLink,
  FileInput,
  FileJson,
  FileText,
  Fingerprint,
  Gauge,
  GitBranch,
  Inbox,
  Layers,
  LayoutDashboard,
  ListOrdered,
  Monitor,
  Radio,
  Rocket,
  Route,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
  Server,
};

@Component({
  imports: [RouterLink, CommonModule],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home implements AfterViewInit {
  protected readonly dashboardUrl = DASHBOARD_URL;
  protected readonly legalLinks = LEGAL_LINKS;
  protected readonly business = BUSINESS;
  protected readonly trademark = TRADEMARK_NOTICE;
  protected readonly year = new Date().getFullYear();

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    createIcons({ icons: landingPageIcons, root: this.elementRef.nativeElement });
  }

    protected readonly requests = [
    { method: 'GET', endpoint: '/api/orders', status: '200 OK', duration: '84ms' }, { method: 'POST', endpoint: '/api/orders', status: '201 Created', duration: '142ms' }, { method: 'GET', endpoint: '/api/customers/4821', status: '200 OK', duration: '61ms' }, { method: 'POST', endpoint: '/api/orders', status: '500 Error', duration: '842ms' },
  ];
  protected readonly features = [
    { icon: 'download', title: 'Capture', description: 'See requests and responses as they happen.', items: ['Headers, bodies, status codes', 'Routes, methods, metadata', 'Request & response sizes'] }, { icon: 'activity', title: 'Understand', description: 'Know when something goes wrong.', items: ['4xx, 5xx and redirects', 'Latency and performance', 'Failure patterns and trends'] }, { icon: 'git-branch', title: 'Correlate', description: 'Follow a request across your system.', items: ['Correlation IDs', 'W3C trace context', 'Trace & span IDs'] }, { icon: 'sliders-horizontal', title: 'Control', description: 'Decide exactly what FootLook captures.', items: ['Ignore paths & endpoints', 'Masking & hashing', 'Runtime controls'] },
  ];
  protected readonly pipeline = [
    { number: '1', title: 'Capture the request.', text: 'FootLook observes incoming API traffic through middleware.' }, { number: '2', title: 'Process asynchronously.', text: 'Captures are buffered through a bounded queue.' }, { number: '3', title: 'Persist the data.', text: 'Captures can be retained in memory and persisted.' }, { number: '4', title: 'See it live.', text: 'Surface persisted captures through the FootLook interface.' },
  ];
  protected readonly boxes = [
    { icon: 'radio', label: 'ASP.NET Core API' }, { icon: 'layers', label: 'Footlook Middleware' }, { icon: 'file-input', label: 'Captured Request' }, { icon: 'list-ordered', label: 'Bounded Queue' }, { icon: 'cog', label: 'Background Worker' }, { icon: 'server', label: 'Memory Store' }, { icon: 'file-json', label: 'JSONL Sink' }, { icon: 'monitor', label: 'Footlook UI (API + SignalR)' },
  ];
  protected readonly privacy = [
    { icon: 'shield-alert', title: 'Sensitive Headers', description: 'Automatically mask sensitive header values.' }, { icon: 'search', title: 'Query Parameters', description: 'Control which query parameters are captured.' }, { icon: 'file-text', title: 'Request Bodies', description: 'Capture or skip request bodies as needed.' }, { icon: 'fingerprint', title: 'IP & User-Agent', description: 'Hash IP addresses and user-agent strings.' }, { icon: 'clock-3', title: 'Retention Controls', description: 'Control how long captures are retained.' }, { icon: 'shield-check', title: 'Role & Access', description: 'Restrict access to captures and settings.' },
  ];
  protected readonly steps = [
    { number: '1', title: 'Install', text: 'Add FootLook to your ASP.NET Core application with a few lines of code.' }, { number: '2', title: 'Configure', text: 'Choose capture, privacy, retention and ignored-path settings.' }, { number: '3', title: 'Observe', text: 'Open the FootLook dashboard and start investigating.' }, { number: '4', title: 'Understand', text: 'Search captures, inspect failures and follow request context.' },
  ];
}
