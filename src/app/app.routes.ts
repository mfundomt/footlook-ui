import { Routes } from '@angular/router';
import { Home } from './features/marketing/home/home/home';
import { LegalLayout } from './features/legal/legal-layout';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full', title: 'FootLook | Request intelligence' },

  { path: 'developers', component: Home, title: 'FootLook | Developers' },

  {
    path: 'login',
    title: 'Sign in | FootLook',
    loadComponent: () => import('./features/auth/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Create account | FootLook',
    loadComponent: () => import('./features/auth/register').then((m) => m.Register),
  },

  // Signed-in pages: a guarded frame with the account header. A signed-out visitor is sent to /login?next=<this page>.
  {
    path: '',
    loadComponent: () => import('./features/account/account-shell').then((m) => m.AccountShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'projects',
        title: 'Projects | FootLook',
        loadComponent: () => import('./features/account/projects').then((m) => m.Projects),
      },
      {
        path: 'projects/:id',
        title: 'Project | FootLook',
        loadComponent: () => import('./features/account/project-detail').then((m) => m.ProjectDetail),
      },
      {
        path: 'join',
        title: 'Join a project | FootLook',
        loadComponent: () => import('./features/account/join').then((m) => m.Join),
      },
      {
        path: 'connect',
        title: 'Opening your project | FootLook',
        loadComponent: () => import('./features/account/connect').then((m) => m.Connect),
      },
    ],
  },

  {
    path: '',
    component: LegalLayout,
    children: [
      {
        path: 'privacy',
        title: 'Privacy Policy | FootLook',
        loadComponent: () => import('./features/legal/privacy-policy').then((m) => m.PrivacyPolicy),
      },
      {
        path: 'terms',
        title: 'Terms of Use | FootLook',
        loadComponent: () => import('./features/legal/terms').then((m) => m.Terms),
      },
      {
        path: 'cookies',
        title: 'Cookie Policy | FootLook',
        loadComponent: () => import('./features/legal/cookies-policy').then((m) => m.CookiesPolicy),
      },
      {
        path: 'refunds',
        title: 'Refund Policy | FootLook',
        loadComponent: () => import('./features/legal/refund-policy').then((m) => m.RefundPolicy),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
