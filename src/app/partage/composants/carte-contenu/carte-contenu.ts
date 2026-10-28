
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Contenu } from '../../../noyau/modeles/contenu';

@Component({
  selector: 'app-carte-contenu',
  imports: [RouterLink],
  templateUrl: './carte-contenu.html',
  styleUrl: './carte-contenu.css'
})
export class CarteContenu {
  contenu = input.required<Contenu>();
  region = input('');
  categorie = input('');
  mode = input<'accueil' | 'catalogue'>('accueil');
}
