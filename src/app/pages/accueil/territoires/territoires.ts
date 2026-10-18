import { Component, ElementRef, afterNextRender, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

import { RegionService } from '../../../noyau/services/region';

@Component({
  selector: 'app-territoires',
  imports: [RouterLink],
  templateUrl: './territoires.html',
  styleUrl: './territoires.css'
})
export class Territoires {
  private regionService = inject(RegionService);
  private hote = inject(ElementRef<HTMLElement>);
  private piste = viewChild<ElementRef<HTMLElement>>('piste');

  // Les régions à la une, dont la fiche est publiée
  regions = toSignal(
    this.regionService.getRegions().pipe(map(liste => liste.filter(r => r.misEnAvant))),
    { initialValue: [] }
  );

  visible = signal(false);      // déclenche l'animation d'apparition
  progression = signal(0);      // largeur de la barre dorée (en %)
  debut = signal(true);         // carrousel au tout début ?
  fin = signal(false);          // carrousel tout à la fin ?

  private reduireMouvement =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    // Animation d'apparition : on observe quand la section entre dans l'écran
    afterNextRender(() => {
      this.majProgression();
      const observateur = new IntersectionObserver(([entree]) => {
        if (entree.isIntersecting) {
          this.visible.set(true);
          observateur.disconnect();
        }
      }, { threshold: 0.15 });
      observateur.observe(this.hote.nativeElement);
    });

    // Recalcule la barre quand les régions arrivent
    effect(() => {
      this.regions();
      setTimeout(() => this.majProgression());
    });
  }

  // Flèches : fait défiler d'une carte
  defiler(sens: 1 | -1) {
    const piste = this.piste()?.nativeElement;
    if (!piste) return;
    const carte = piste.querySelector<HTMLElement>('.enveloppe');
    const ecart = parseFloat(getComputedStyle(piste).columnGap) || 16;
    const pas = carte ? carte.offsetWidth + ecart : piste.clientWidth;
    piste.scrollBy({ left: sens * pas, behavior: 'smooth' });
  }

  // Met à jour la barre de progression et l'état des flèches
  majProgression() {
    const piste = this.piste()?.nativeElement;
    if (!piste) return;
    const max = piste.scrollWidth - piste.clientWidth;
    this.debut.set(piste.scrollLeft <= 2);
    this.fin.set(max <= 2 || piste.scrollLeft >= max - 2);
    this.progression.set(
      piste.scrollWidth ? ((piste.scrollLeft + piste.clientWidth) / piste.scrollWidth) * 100 : 100
    );
  }

  // Effet tilt 3D : incline la carte selon la position de la souris
  incliner(evenement: MouseEvent) {
    if (this.reduireMouvement) return;
    const carte = evenement.currentTarget as HTMLElement;
    const zone = carte.getBoundingClientRect();
    const x = (evenement.clientX - zone.left) / zone.width - 0.5;
    const y = (evenement.clientY - zone.top) / zone.height - 0.5;
    carte.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  }

  redresser(evenement: MouseEvent) {
    (evenement.currentTarget as HTMLElement).style.transform = '';
  }
}