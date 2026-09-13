import { Routes } from '@angular/router';
import { Home } from './features/marketing/home/home/home'; 

export const routes: Routes = [
  { path: '', component: Home, title: 'FootLook | Request intelligence' },

  { path: 'developers', component: Home, title: 'FootLook | Developers' },

  { path: '**', redirectTo: '' },
];
