import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-barre-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './barre-navigation.html',
  styleUrl: './barre-navigation.css',
  host: {
    '(document:keydown.escape)': 'fermer()',
    '(window:resize)': 'surRedimensionnement()'
  }
})
export class BarreNavigation {
  ouvert = signal(false);

  constructor() {
    // Verrouille le défilement de la page tant que le menu est ouvert
    effect(() => {
      document.body.style.overflow = this.ouvert() ? 'hidden' : '';
    });

    // Sécurité : on rend le défilement si le composant est détruit
    inject(DestroyRef).onDestroy(() => {
      document.body.style.overflow = '';
    });
  }

  basculer() {
    this.ouvert.update(valeur => !valeur);
  }

  fermer() {
    this.ouvert.set(false);
  }

  // Si on agrandit la fenêtre jusqu'au mode ordinateur, on ferme le tiroir
  surRedimensionnement() {
    if (window.innerWidth >= 768) {
      this.fermer();
    }
  }
}