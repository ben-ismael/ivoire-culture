import { Component, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { EvenementService } from '../../../noyau/services/evenement';
import { RegionService } from '../../../noyau/services/region';
import { StatutEvenement, TypeEvenement } from '../../../noyau/modeles/evenement';

type Filtre = 'tous' | TypeEvenement;

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const TYPES: Record<TypeEvenement, string> = {
  musique: 'Musique',
  exposition: 'Exposition',
  tradition: 'Tradition'
};

const STATUTS: Record<StatutEvenement, string> = {
  'a-venir': 'À venir',
  'en-cours': 'En cours',
  'termine': 'Terminé',
  'annule': 'Annulé'
};

@Component({
  selector: 'app-rendez-vous',
  imports: [RouterLink],
  templateUrl: './rendez-vous.html',
  styleUrl: './rendez-vous.css'
})
export class RendezVous {
  private hote = inject(ElementRef<HTMLElement>);

  private evenements = toSignal(inject(EvenementService).getEvenementsProchains(), { initialValue: [] });
  private regions = toSignal(inject(RegionService).getRegions(), { initialValue: [] });

  visible = signal(false);

  // Les onglets de filtre
  filtres: { valeur: Filtre; libelle: string }[] = [
    { valeur: 'tous', libelle: 'Tous' },
    { valeur: 'musique', libelle: 'Musique' },
    { valeur: 'exposition', libelle: 'Exposition' },
    { valeur: 'tradition', libelle: 'Tradition' }
  ];

  // Filtre actif : « Tous » par défaut
  filtreActif = signal<Filtre>('tous');

  // Liste affichée : filtrée, puis préparée pour le template
  liste = computed(() => {
    const filtre = this.filtreActif();
    return this.evenements()
      .filter(e => filtre === 'tous' || e.typeEvenement === filtre)
      .map(e => ({
        evenement: e,
        jour: e.dateDebut.slice(8, 10),
        mois: MOIS[parseInt(e.dateDebut.slice(5, 7), 10) - 1],
        type: TYPES[e.typeEvenement],
        statut: STATUTS[e.statutEvenement],
        zone: this.regions().find(r => r.slug === e.regionSlug)?.zone ?? ''
      }));
  });

  choisir(valeur: Filtre) {
    this.filtreActif.set(valeur);
  }

  constructor() {
    // Déclenche l'animation quand la section entre dans l'écran
    afterNextRender(() => {
      const observateur = new IntersectionObserver(([entree]) => {
        if (entree.isIntersecting) {
          this.visible.set(true);
          observateur.disconnect();
        }
      }, { threshold: 0.15 });
      observateur.observe(this.hote.nativeElement);
    });
  }
}