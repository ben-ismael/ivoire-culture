import { Routes } from '@angular/router';
import { MiseEnPagePublique } from './structure/mise-en-page-publique/mise-en-page-publique';
import { Accueil } from './pages/accueil/accueil';

export const routes: Routes = [
  {
    path: '',
    component: MiseEnPagePublique,
    children: [
      { path: '', component: Accueil }
    ]
  }
];