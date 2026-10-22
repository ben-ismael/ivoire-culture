import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Niveau {
  libelle: string;
  lien?: string;
  params?: Record<string, string>;
}

@Component({
  selector: 'app-fil-ariane',
  imports: [RouterLink],
  templateUrl: './fil-ariane.html',
  styleUrl: './fil-ariane.css'
})
export class FilAriane {
  niveaux = input.required<Niveau[]>();
}