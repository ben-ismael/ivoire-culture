import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';

import { Region } from '../../noyau/modeles/region';
import { Carte } from '../../noyau/modeles/carte';
import { RegionService } from '../../noyau/services/region';
import { FilAriane, Niveau } from '../../partage/composants/fil-ariane/fil-ariane';
import { PanneauTerritoire } from './panneau-territoire/panneau-territoire';
import { CarteRegions } from './carte-regions/carte-regions';

// Ignore les majuscules, les accents, les tirets et les apostrophes
function normaliser(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

@Component({
  selector: 'app-regions',
  imports: [FilAriane, PanneauTerritoire, CarteRegions],
  templateUrl: './regions.html',
  styleUrl: './regions.css',
  host: { '(document:keydown.escape)': 'fermer()' }
})
export class Regions {
  private service = inject(RegionService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private champ = viewChild<ElementRef<HTMLInputElement>>('champ');
  private declencheur: HTMLElement | null = null;

  fil: Niveau[] = [{ libelle: 'Accueil', lien: '/' }, { libelle: 'Régions' }];
  squelettes = Array.from({ length: 8 });

  etat = signal<'chargement' | 'ok' | 'erreur'>('chargement');
  territoires = signal<Region[]>([]);

  carte = signal<Carte | null>(null);
  carteEtat = signal<'chargement' | 'ok' | 'erreur'>('chargement');

  // Territoire survolé : partagé entre la carte et la liste
  survol = signal<string | null>(null);

  // L'état de la page est lu dans l'adresse (recherche partageable)
  recherche = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  district = signal(this.route.snapshot.queryParamMap.get('district') ?? '');
  selection = signal<string | null>(this.route.snapshot.queryParamMap.get('territoire'));

  actif = computed(() => !!this.recherche().trim() || !!this.district());

  // Les districts proposés dans la liste déroulante
  districts = computed(() =>
    [...new Set(this.territoires().filter(t => t.type === 'region').map(t => t.district))]
      .sort((a, b) => a.localeCompare(b, 'fr'))
  );

  autonomes = computed(() =>
    this.territoires().filter(t => t.type === 'district-autonome').map(t => t.district)
      .sort((a, b) => a.localeCompare(b, 'fr'))
  );

  // Territoires correspondant à la recherche et au district choisi
  filtres = computed(() => {
    const mot = normaliser(this.recherche());
    const district = this.district();
    return this.territoires().filter(t => {
      if (district && t.district !== district) return false;
      if (!mot) return true;
      const champs = [t.nom, t.villePhare, t.chefLieu, ...t.departements];
      return champs.some(c => normaliser(c).includes(mot));
    });
  });

  // Pour la carte : null quand aucun filtre n'est actif, sinon les territoires qui restent
  visibles = computed(() => (this.actif() ? new Set(this.filtres().map(t => t.slug)) : null));

  // Liste regroupée par district, puis les districts autonomes
  groupes = computed(() => {
    const liste = this.filtres();
    const parNom = (a: Region, b: Region) => a.nom.localeCompare(b.nom, 'fr');
    const brut = this.districts().map(d => ({
      titre: d,
      territoires: liste.filter(t => t.type === 'region' && t.district === d).sort(parNom)
    }));
    brut.push({
      titre: 'Districts autonomes',
      territoires: liste.filter(t => t.type === 'district-autonome').sort(parNom)
    });
    let base = 0; // sert à décaler l'animation d'une ligne à l'autre
    return brut
      .filter(g => g.territoires.length > 0)
      .map(g => {
        const groupe = { ...g, base };
        base += g.territoires.length;
        return groupe;
      });
  });

  selectionne = computed(() => {
    const slug = this.selection();
    return slug ? this.territoires().find(t => t.slug === slug) ?? null : null;
  });

  constructor() {
    inject(Title).setTitle("Les régions de Côte d'Ivoire | IvoireCulture");
    inject(Meta).updateTag({
      name: 'description',
      content: "Explorez les 33 territoires de Côte d'Ivoire : régions, districts, chefs-lieux et départements."
    });

    this.charger();
    this.chargerCarte();

    // Reflète l'état dans l'adresse sans recharger la page ni remonter en haut
    effect(() => {
      const params = new URLSearchParams();
      const q = this.recherche().trim();
      if (q) params.set('q', q);
      if (this.district()) params.set('district', this.district());
      if (this.selection()) params.set('territoire', this.selection()!);
      this.location.replaceState('/regions', params.toString());
    });
  }

  charger() {
    this.etat.set('chargement');
    this.service.getTerritoires().subscribe({
      next: liste => {
        this.territoires.set(liste);
        this.etat.set('ok');
      },
      error: () => this.etat.set('erreur')
    });
  }

  chargerCarte() {
    this.carteEtat.set('chargement');
    this.service.getCarte().subscribe({
      next: c => {
        this.carte.set(c);
        this.carteEtat.set('ok');
      },
      error: () => this.carteEtat.set('erreur')
    });
  }

  saisir(evenement: Event) {
    this.recherche.set((evenement.target as HTMLInputElement).value);
  }

  choisirDistrict(evenement: Event) {
    this.district.set((evenement.target as HTMLSelectElement).value);
  }

  viderRecherche() {
    this.recherche.set('');
    this.champ()?.nativeElement.focus();
  }

  reinitialiser() {
    this.recherche.set('');
    this.district.set('');
  }

  // Clic sur une ligne de la liste
  choisir(territoire: Region, evenement: Event) {
    this.declencheur = evenement.currentTarget as HTMLElement;
    this.selection.set(territoire.slug);
  }

  // Clic sur un territoire de la carte
  choisirSurCarte(slug: string) {
    this.declencheur = null;
    this.selection.set(slug);
  }

  fermer() {
    if (!this.selection()) return;
    this.selection.set(null);
    const origine = this.declencheur;
    this.declencheur = null;
    setTimeout(() => origine?.focus()); // le focus revient sur la ligne d'origine
  }
}