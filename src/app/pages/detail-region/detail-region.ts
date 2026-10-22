import {
  Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, inject, signal
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { catchError, forkJoin, of } from 'rxjs';

import { Region } from '../../noyau/modeles/region';
import { Categorie } from '../../noyau/modeles/categorie';
import { Contenu } from '../../noyau/modeles/contenu';
import { Evenement, TypeEvenement } from '../../noyau/modeles/evenement';
import { Photo, RegionDetail } from '../../noyau/modeles/region-detail';
import { RegionService } from '../../noyau/services/region';
import { ContenuService } from '../../noyau/services/contenu';
import { EvenementService } from '../../noyau/services/evenement';
import { CategorieService } from '../../noyau/services/categorie';
import { normaliser } from '../../noyau/outils';
import { FilAriane, Niveau } from '../../partage/composants/fil-ariane/fil-ariane';
import { RegionEntete } from './region-entete/region-entete';
import { RegionSources } from './region-sources/region-sources';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const TYPES_EVT: Record<TypeEvenement, string> = {
  musique: 'Musique',
  exposition: 'Exposition',
  tradition: 'Tradition'
};

const parNom = (a: Region, b: Region) => a.nom.localeCompare(b.nom, 'fr');

@Component({
  selector: 'app-detail-region',
  imports: [RouterLink, FilAriane, RegionEntete, RegionSources],
  templateUrl: './detail-region.html',
  styleUrl: './detail-region.css',
  host: { '(document:keydown)': 'touche($event)' }
})
export class DetailRegion {
  private route = inject(ActivatedRoute);
  private regionService = inject(RegionService);
  private contenuService = inject(ContenuService);
  private evenementService = inject(EvenementService);
  private categorieService = inject(CategorieService);
  private titre = inject(Title);
  private meta = inject(Meta);
  private hote = inject(ElementRef<HTMLElement>);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);
  private observateur: IntersectionObserver | null = null;

  slug = signal('');
  etat = signal<'chargement' | 'ok' | 'erreur' | 'introuvable'>('chargement');

  territoires = signal<Region[]>([]);
  detail = signal<RegionDetail | null>(null);
  voisines = signal<Record<string, string[]>>({});
  contenus = signal<Contenu[]>([]);
  evenements = signal<Evenement[]>([]);
  categories = signal<Categorie[]>([]);
  photoOuverte = signal<number | null>(null);

  region = computed(() => this.territoires().find(t => t.slug === this.slug()) ?? null);

  libelleDeps = computed(() => (this.region()?.slug === 'abidjan' ? 'Communes' : 'Départements'));

  afficherChefLieu = computed(() => {
    const r = this.region();
    return !!r && normaliser(r.chefLieu) !== normaliser(r.nom);
  });

  fil = computed<Niveau[]>(() => {
    const r = this.region();
    if (!r) return [];
    const niveaux: Niveau[] = [
      { libelle: 'Accueil', lien: '/' },
      { libelle: 'Régions', lien: '/regions' }
    ];
    if (r.type === 'region') {
      niveaux.push({ libelle: r.district, lien: '/regions', params: { district: r.district } });
    }
    niveaux.push({ libelle: r.nom });
    return niveaux;
  });

  accroche = computed(() => this.detail()?.accroche || this.region()?.accroche || '');

  // Photo du hero : celle du fichier détaillé, sinon celle de la vitrine (sauf image de remplacement)
  heroPhoto = computed<Photo | null>(() => {
    const d = this.detail();
    const r = this.region();
    if (d?.image?.url) return d.image;
    if (r && r.image && !r.image.includes('placeholder')) {
      return { url: r.image, alt: r.imageAlt, credit: r.imageCredit };
    }
    return null;
  });

  paragraphes = computed(() => this.detail()?.presentation ?? []);
  distinction = computed(() => this.detail()?.distinction ?? null);
  sources = computed(() => this.detail()?.sources ?? []);

  // Villes à présenter : celles qui ont un texte ou une photo
  villes = computed(() =>
    (this.detail()?.villes ?? [])
      .map(v => ({
        id: v.id,
        nom: v.nom,
        paragraphes: v.paragraphes ?? [],
        photo: v.images?.find(i => !!i.url) ?? null
      }))
      .filter(v => v.paragraphes.length > 0 || !!v.photo)
  );

  villeId = computed(() => {
    const r = this.region();
    if (!r?.villePhare) return null;
    return this.villes().find(v => normaliser(v.nom) === normaliser(r.villePhare))?.id ?? null;
  });

  chefLieuTexte = computed(() => this.detail()?.chefLieu?.texte ?? '');
  chefLieuPhoto = computed<Photo | null>(() => {
    const image = this.detail()?.chefLieu?.image;
    return image?.url ? image : null;
  });

  // Les départements officiels, enrichis de ce que le fichier détaillé en dit
  departements = computed(() => {
    const r = this.region();
    if (!r) return [];
    const infos = this.detail()?.departements ?? [];
    return r.departements.map(nom => {
      const n = normaliser(nom);
      const info = infos.find(i => normaliser(i.nom) === n);
      const etiquettes: string[] = [];
      if (n === normaliser(r.chefLieu)) etiquettes.push('Chef-lieu');
      if (r.villePhare && n === normaliser(r.villePhare)) etiquettes.push('Ville phare');
      return {
        nom,
        phrase: info?.phrase ?? '',
        image: info?.image?.url ? info.image : null,
        etiquette: etiquettes.join(' · ')
      };
    });
  });

  lieux = computed(() =>
    (this.detail()?.lieux ?? [])
      .filter(l => !!l.description || !!l.image?.url)
      .map(l => ({
        nom: l.nom,
        description: l.description ?? '',
        image: l.image?.url ? l.image : null
      }))
  );

  galerie = computed(() => (this.detail()?.galerie ?? []).filter(p => !!p.url));
  photoCourante = computed(() => {
    const i = this.photoOuverte();
    return i === null ? null : this.galerie()[i] ?? null;
  });

  // Événements à venir ou en cours, repris de l'agenda
  rendezVous = computed(() =>
    this.evenements()
      .filter(e => e.statutEvenement === 'a-venir' || e.statutEvenement === 'en-cours')
      .sort((a, b) => a.dateDebut.localeCompare(b.dateDebut))
      .map(e => ({
        slug: e.slug,
        nom: e.nom,
        ville: e.ville,
        type: TYPES_EVT[e.typeEvenement],
        jour: e.dateDebut.slice(8, 10),
        mois: MOIS[parseInt(e.dateDebut.slice(5, 7), 10) - 1]
      }))
  );

  cultureLiee = computed(() =>
    this.contenus().map(c => ({
      c,
      categorie: this.categories().find(x => x.slug === c.categorieSlug)?.nom ?? ''
    }))
  );

  // Autres régions du district et régions voisines
  suite = computed(() => {
    const r = this.region();
    if (!r) return [];
    const parSlug = new Map(this.territoires().map(t => [t.slug, t]));
    const slugs = new Set<string>();
    if (r.type === 'region') {
      this.territoires()
        .filter(t => t.type === 'region' && t.district === r.district && t.slug !== r.slug)
        .forEach(t => slugs.add(t.slug));
    }
    (this.voisines()[r.slug] ?? []).forEach(s => slugs.add(s));
    return [...slugs]
      .map(s => parSlug.get(s))
      .filter((t): t is Region => !!t)
      .sort(parNom);
  });

  // Territoire précédent et suivant dans le district (ordre alphabétique)
  voisinage = computed(() => {
    const r = this.region();
    if (!r || r.type !== 'region') return { precedent: null as Region | null, suivant: null as Region | null };
    const liste = this.territoires()
      .filter(t => t.type === 'region' && t.district === r.district)
      .sort(parNom);
    const i = liste.findIndex(t => t.slug === r.slug);
    return {
      precedent: i > 0 ? liste[i - 1] : null,
      suivant: i >= 0 && i < liste.length - 1 ? liste[i + 1] : null
    };
  });

  // Une ligne par photo créditée
  credits = computed(() => {
    const d = this.detail();
    const photos: Photo[] = [];
    const hero = this.heroPhoto();
    if (hero) photos.push(hero);
    if (d) {
      d.villes?.forEach(v => photos.push(...(v.images ?? [])));
      if (d.chefLieu?.image) photos.push(d.chefLieu.image);
      d.departements?.forEach(x => { if (x.image) photos.push(x.image); });
      d.lieux?.forEach(x => { if (x.image) photos.push(x.image); });
      photos.push(...(d.galerie ?? []));
    }
    const vues = new Set<string>();
    return photos
      .filter(p => {
        if (!p.url || vues.has(p.url)) return false;
        vues.add(p.url);
        return !!p.credit;
      })
      .map(p => ({ legende: p.alt, credit: p.credit as string, source: p.source }));
  });

  constructor() {
    // La page se recharge quand l'adresse change (précédent / suivant)
    this.route.paramMap
      .pipe(takeUntilDestroyed())
      .subscribe(p => this.charger(p.get('slug') ?? ''));

    this.destroyRef.onDestroy(() => {
      this.observateur?.disconnect();
      document.body.style.overflow = '';
    });
  }

  charger(slug: string) {
    this.slug.set(slug);
    this.etat.set('chargement');
    this.detail.set(null);
    this.contenus.set([]);
    this.evenements.set([]);
    this.photoOuverte.set(null);

    forkJoin({
      territoires: this.regionService.getTerritoires(),
      detail: this.regionService.getDetail(slug),
      voisines: this.regionService.getVoisines(),
      contenus: this.contenuService.getContenus({ regionSlug: slug })
        .pipe(catchError(() => of([] as Contenu[]))),
      evenements: this.evenementService.getEvenements({ regionSlug: slug })
        .pipe(catchError(() => of([] as Evenement[]))),
      categories: this.categorieService.getCategories()
        .pipe(catchError(() => of([] as Categorie[])))
    }).subscribe({
      next: r => {
        if (this.slug() !== slug) return; // une navigation plus récente a pris le relais
        this.territoires.set(r.territoires);
        this.detail.set(r.detail);
        this.voisines.set(r.voisines);
        this.contenus.set(r.contenus);
        this.evenements.set(r.evenements);
        this.categories.set(r.categories);

        if (!r.territoires.some(t => t.slug === slug)) {
          this.titre.setTitle('Page introuvable | IvoireCulture');
          this.etat.set('introuvable');
          return;
        }
        this.etat.set('ok');
        this.metadonnees();
        this.activerApparition();
      },
      error: () => {
        if (this.slug() === slug) this.etat.set('erreur');
      }
    });
  }

  private metadonnees() {
    const r = this.region();
    if (!r) return;
    const type = r.type === 'region' ? `région du district ${r.district}` : 'district autonome';
    const chef = this.afficherChefLieu() ? `, chef-lieu ${r.chefLieu}` : '';
    this.titre.setTitle(`${r.nom}, ${type}${chef} | IvoireCulture`);
    this.meta.updateTag({
      name: 'description',
      content: this.accroche() ||
        `${r.nom} : ${type}${chef}, ${r.departements.length} ${this.libelleDeps().toLowerCase()}.`
    });
  }

  // Apparition des sections au défilement
  private activerApparition() {
    afterNextRender(() => {
      this.observateur?.disconnect();
      const racine = this.hote.nativeElement as HTMLElement;
      this.observateur = new IntersectionObserver(entrees => {
        entrees.forEach(e => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add('visible');
            this.observateur?.unobserve(e.target);
          }
        });
      }, { threshold: 0.12 });
      racine.querySelectorAll('[data-reveal]').forEach(el => this.observateur!.observe(el));
      racine.classList.add('anime');
    }, { injector: this.injector });
  }

  // ----- Galerie -----
  ouvrirPhoto(i: number) {
    this.photoOuverte.set(i);
    document.body.style.overflow = 'hidden';
  }

  fermerPhoto() {
    this.photoOuverte.set(null);
    document.body.style.overflow = '';
  }

  naviguer(sens: 1 | -1) {
    const i = this.photoOuverte();
    const n = this.galerie().length;
    if (i === null || n === 0) return;
    this.photoOuverte.set((i + sens + n) % n);
  }

  touche(e: KeyboardEvent) {
    if (this.photoOuverte() === null) return;
    if (e.key === 'Escape') this.fermerPhoto();
    else if (e.key === 'ArrowRight') this.naviguer(1);
    else if (e.key === 'ArrowLeft') this.naviguer(-1);
  }
}