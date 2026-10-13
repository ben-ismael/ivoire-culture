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

  getRegions(): Observable<Region[]> {
    return this.http.get<Region[]>(this.url).pipe(
      map(regions => regions.filter(r => r.statut === 'publie'))
    );
  }

  getRegionParSlug(slug: string): Observable<Region | undefined> {
    return this.getRegions().pipe(
      map(regions => regions.find(r => r.slug === slug))
    );
  }
}