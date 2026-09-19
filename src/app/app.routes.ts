import { Routes } from '@angular/router';
import { Home } from './features/marketing/home/home/home';
import { LegalLayout } from './features/legal/legal-layout';

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
