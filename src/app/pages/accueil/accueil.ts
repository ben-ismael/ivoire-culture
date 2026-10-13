import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Territoires } from './territoires/territoires';
import { HistoiresPopulaires } from './histoires-populaires/histoires-populaires';
import { RendezVous } from './rendez-vous/rendez-vous';

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, Territoires, HistoiresPopulaires, RendezVous],
  templateUrl: './accueil.html',
  styleUrl: './accueil.css'
})
export class Accueil {}