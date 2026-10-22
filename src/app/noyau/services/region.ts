import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';

import { Region } from '../modeles/region';
import { Carte } from '../modeles/carte';
import { RegionDetail } from '../modeles/region-detail';

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

  // Les contours des 33 territoires
  getCarte(): Observable<Carte> {
    return this.http.get<Carte>('donnees/carte-territoires.json');
  }

  // Le contenu détaillé d'un territoire.
  // Renvoie null si le fichier n'existe pas, s'il est illisible, ou s'il n'est pas encore relu.
  // (Sur Render, un fichier absent renvoie index.html : la lecture JSON échoue, on retombe sur null.)
  getDetail(slug: string): Observable<RegionDetail | null> {
    if (!/^[a-z0-9-]+$/.test(slug)) return of(null);
    return this.http.get<RegionDetail>(`donnees/regions/${slug}.json`).pipe(
      map(d => (d && d.slug === slug && d.relu === true ? d : null)),
      catchError(() => of(null))
    );
  }

  // Les territoires voisins de chacun (précalculés à partir des contours)
  getVoisines(): Observable<Record<string, string[]>> {
    return this.http.get<Record<string, string[]>>('donnees/voisines.json').pipe(
      catchError(() => of({} as Record<string, string[]>))
    );
  }
}