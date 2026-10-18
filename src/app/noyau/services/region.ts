import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Region } from '../modeles/region';

@Injectable({
  providedIn: 'root'
})
export class RegionService {
  private http = inject(HttpClient);
  private url = 'donnees/regions.json';

  // Les 33 territoires, avec ou sans fiche publiée (carte et liste)
  getTerritoires(): Observable<Region[]> {
    return this.http.get<Region[]>(this.url);
  }

  // Seulement les territoires dont la fiche est publiée
  getRegions(): Observable<Region[]> {
    return this.getTerritoires().pipe(
      map(regions => regions.filter(r => r.statut === 'publie'))
    );
  }

  getRegionParSlug(slug: string): Observable<Region | undefined> {
    return this.getRegions().pipe(
      map(regions => regions.find(r => r.slug === slug))
    );
  }
}