import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Region } from '../../../noyau/modeles/region';
import { Photo } from '../../../noyau/modeles/region-detail';
import { RegionService } from '../../../noyau/services/region';
import { normaliser } from '../../../noyau/outils';

@Component({
  selector: 'app-region-entete',
  imports: [RouterLink],
  templateUrl: './region-entete.html',
  styleUrl: './region-entete.css'
})
export class RegionEntete {
  region = input.required<Region>();
  accroche = input<string>('');
  photo = input<Photo | null>(null);
  villeId = input<string | null>(null);
  libelleDeps = input<string>('Départements');

  private service = inject(RegionService);

  // Sans photo, on dessine la silhouette du territoire à partir des contours de la carte
  silhouette = signal<{ d: string; viewBox: string } | null>(null);

  // Quand le chef-lieu porte le même nom que le territoire (Abidjan, Yamoussoukro), on ne le répète pas
  memeNom = computed(() => normaliser(this.region().chefLieu) === normaliser(this.region().nom));

  surTitre = computed(() =>
    this.region().type === 'region' ? `District ${this.region().district}` : 'District autonome'
  );

  constructor() {
    effect(() => {
      const slug = this.region().slug;
      if (this.photo()) {
        this.silhouette.set(null);
        return;
      }
      untracked(() =>
        this.service.getCarte().subscribe({
          next: carte => {
            const forme = carte.territoires.find(t => t.slug === slug);
            this.silhouette.set(forme ? this.preparer(forme.d) : null);
          },
          error: () => this.silhouette.set(null)
        })
      );
    });
  }

  // Cadre la silhouette sur le territoire
  private preparer(d: string): { d: string; viewBox: string } {
    const nombres = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i + 1 < nombres.length; i += 2) {
      minX = Math.min(minX, nombres[i]);
      maxX = Math.max(maxX, nombres[i]);
      minY = Math.min(minY, nombres[i + 1]);
      maxY = Math.max(maxY, nombres[i + 1]);
    }
    const marge = Math.max(maxX - minX, maxY - minY) * 0.08;
    return {
      d,
      viewBox: `${minX - marge} ${minY - marge} ${maxX - minX + 2 * marge} ${maxY - minY + 2 * marge}`
    };
  }
}