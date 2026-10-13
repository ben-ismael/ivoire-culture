
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Evenement, StatutEvenement } from '../modeles/evenement';

export interface FiltresEvenement {
  regionSlug?: string;
  statutEvenement?: StatutEvenement;
  motCle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvenementService {
  private http = inject(HttpClient);
  private url = 'donnees/evenements.json';

  private getPublies(): Observable<Evenement[]> {
    return this.http.get<Evenement[]>(this.url).pipe(
      map(evenements =>
        evenements.filter(e => e.statut === 'publie')
      )
    );
  }

  getEvenements(
    filtres: FiltresEvenement = {}
  ): Observable<Evenement[]> {
    return this.getPublies().pipe(
      map(evenements =>
        evenements.filter(e => {
          const okRegion =
            !filtres.regionSlug ||
            e.regionSlug === filtres.regionSlug;

          const okStatut =
            !filtres.statutEvenement ||
            e.statutEvenement === filtres.statutEvenement;

          const mot = filtres.motCle?.trim().toLowerCase();

          const okMot =
            !mot ||
            e.nom.toLowerCase().includes(mot) ||
            e.lieu.toLowerCase().includes(mot) ||
            e.ville.toLowerCase().includes(mot);

          return okRegion && okStatut && okMot;
        })
      )
    );
  }

  getEvenementParSlug(
    slug: string
  ): Observable<Evenement | undefined> {
    return this.getPublies().pipe(
      map(evenements =>
        evenements.find(e => e.slug === slug)
      )
    );
  }

  // Événements à venir, du plus proche au plus lointain
  getEvenementsAVenir(): Observable<Evenement[]> {
    return this.getEvenements({
      statutEvenement: 'a-venir'
    }).pipe(
      map(evenements =>
        [...evenements].sort((a, b) =>
          a.dateDebut.localeCompare(b.dateDebut)
        )
      )
    );
  }

  // Événements à venir ou en cours, du plus proche au plus lointain
  getEvenementsProchains(): Observable<Evenement[]> {
    return this.getPublies().pipe(
      map(evenements =>
        evenements
          .filter(
            e =>
              e.statutEvenement === 'a-venir' ||
              e.statutEvenement === 'en-cours'
          )
          .sort((a, b) =>
            a.dateDebut.localeCompare(b.dateDebut)
          )
      )
    );
  }
}
