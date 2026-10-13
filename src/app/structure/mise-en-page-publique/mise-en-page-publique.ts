import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BarreNavigation } from '../barre-navigation/barre-navigation';
import { PiedDePage } from '../pied-de-page/pied-de-page';

@Component({
  selector: 'app-mise-en-page-publique',
  imports: [RouterOutlet, BarreNavigation, PiedDePage],
  templateUrl: './mise-en-page-publique.html',
  styleUrl: './mise-en-page-publique.css'
})
export class MiseEnPagePublique {}