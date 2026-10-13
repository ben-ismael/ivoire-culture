import { Component, ElementRef, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pied-de-page',
  imports: [RouterLink],
  templateUrl: './pied-de-page.html',
  styleUrl: './pied-de-page.css'
})
export class PiedDePage {
  private hote = inject(ElementRef<HTMLElement>);

  annee = new Date().getFullYear();
  visible = signal(false);   // déclenche l'apparition au scroll
  inscrit = signal(false);   // newsletter : message de confirmation

  reseaux = [
    { nom: 'Facebook', icone: 'bi-facebook' },
    { nom: 'Instagram', icone: 'bi-instagram' },
    { nom: 'YouTube', icone: 'bi-youtube' },
    { nom: 'TikTok', icone: 'bi-tiktok' },
    { nom: 'X', icone: 'bi-twitter-x' }
  ];

  constructor() {
    afterNextRender(() => {
      const observateur = new IntersectionObserver(([entree]) => {
        if (entree.isIntersecting) {
          this.visible.set(true);
          observateur.disconnect();
        }
      }, { threshold: 0.1 });
      observateur.observe(this.hote.nativeElement);
    });
  }

  // Pour l'instant, aucune donnée n'est envoyée : on affiche seulement la confirmation
  inscrire(evenement: Event) {
    evenement.preventDefault();
    this.inscrit.set(true);
  }

  retourEnHaut() {
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduit ? 'auto' : 'smooth' });
  }
}