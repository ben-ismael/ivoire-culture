import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Contenu } from '../modeles/contenu';

export interface FiltresContenu {
  categorieSlug?: string;
  regionSlug?: string;
  motCle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContenuService {
  private http = inject(HttpClient);
  private url = 'donnees/contenus.json';

  // Tous les contenus publiés (les brouillons sont masqués)
  private getPublies(): Observable<Contenu[]> {
    return this.http.get<Contenu[]>(this.url).pipe(
      map(contenus => contenus.filter(c => c.statut === 'publie'))
    );
  }

  // Liste filtrée (catégorie, région, mot-clé)
  getContenus(filtres: FiltresContenu = {}): Observable<Contenu[]> {
    return this.getPublies().pipe(
      map(contenus => contenus.filter(c => {
        const okCategorie = !filtres.categorieSlug || c.categorieSlug === filtres.categorieSlug;
        const okRegion = !filtres.regionSlug || c.regionSlug === filtres.regionSlug;
        const mot = filtres.motCle?.trim().toLowerCase();
        const okMot = !mot
          || c.titre.toLowerCase().includes(mot)
          || c.resume.toLowerCase().includes(mot);
        return okCategorie && okRegion && okMot;
      }))
    );
  }

  // Un contenu par son slug (undefined => page 404)
  getContenuParSlug(slug: string): Observable<Contenu | undefined> {
    return this.getPublies().pipe(
      map(contenus => contenus.find(c => c.slug === slug))
    );
  }

  // Contenus pour le bloc « à la une » de l'accueil
  getContenusMisEnAvant(): Observable<Contenu[]> {
    return this.getPublies().pipe(
      map(contenus => contenus.filter(c => c.misEnAvant))
    );
  }
}