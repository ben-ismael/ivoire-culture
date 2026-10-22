import { Component, ElementRef, afterNextRender, computed, input, output, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Region } from '../../../noyau/modeles/region';

@Component({
  selector: 'app-panneau-territoire',
  imports: [RouterLink],
  templateUrl: './panneau-territoire.html',
  styleUrl: './panneau-territoire.css'
})
export class PanneauTerritoire {
  territoire = input.required<Region>();
  fermer = output<void>();

  private racine = viewChild.required<ElementRef<HTMLElement>>('racine');

  // Abidjan est découpé en communes, les autres territoires en départements
  libelleDeps = computed(() => (this.territoire().slug === 'abidjan' ? 'Communes' : 'Départements'));

  constructor() {
    // Le focus passe au panneau à l'ouverture (accessibilité clavier)
    afterNextRender(() => this.racine().nativeElement.focus());
  }
}