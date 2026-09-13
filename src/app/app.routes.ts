import { Routes } from '@angular/router';
import { Home } from './features/marketing/home/home/home'; 
//import { HomeComponent } from './features/marketing/home/home.component';
import { OverviewComponent } from './features/dashboard/overview/overview.component';

export const routes: Routes = [
	{ path: '', pathMatch: 'full', redirectTo: 'product' },
	{ path: 'product', component: Home, title: 'FootLook | Request intelligence' },
	{ path: 'developers', component: Home, title: 'FootLook | Developers' },
	{ path: 'dashboard', component: OverviewComponent, title: 'FootLook | Overview' },
	{ path: '**', redirectTo: 'product' },
];
