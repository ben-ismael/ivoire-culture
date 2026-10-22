import { Routes } from '@angular/router';
import { MiseEnPagePublique } from './structure/mise-en-page-publique/mise-en-page-publique';
import { Accueil } from './pages/accueil/accueil';

export const routes: Routes = [
  {
    path: '',
    component: MiseEnPagePublique,
    children: [
      { path: '', component: Accueil },
      { path: 'regions', loadComponent: () => import('./pages/regions/regions').then(m => m.Regions) },
      { path: 'regions/:slug', loadComponent: () => import('./pages/detail-region/detail-region').then(m => m.DetailRegion) }
    ]
  }
];