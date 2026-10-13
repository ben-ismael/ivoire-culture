import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { Categorie } from '../modeles/categorie';

@Injectable({
  providedIn: 'root'
})
export class CategorieService {
  private http = inject(HttpClient);
  private url = 'donnees/categories.json';

  getCategories(): Observable<Categorie[]> {
    return this.http.get<Categorie[]>(this.url);
  }

  getCategorieParSlug(slug: string): Observable<Categorie | undefined> {
    return this.getCategories().pipe(
      map(categories => categories.find(c => c.slug === slug))
    );
  }
}