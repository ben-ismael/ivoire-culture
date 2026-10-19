import {
  Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject,
  input, model, output, signal, untracked, viewChild
} from '@angular/core';

import { Carte, Forme } from '../../../noyau/modeles/carte';
import { Region } from '../../../noyau/modeles/region';

type FormeRegion = Forme & { region?: Region };

const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const MARGE = 60; // petite marge de déplacement autour du pays (en unités de carte)

// true : il faut appuyer sur Ctrl pour zoomer à la molette (la page défile alors normalement)
const ZOOM_MOLETTE_AVEC_CTRL = false;

// Une teinte par district, choisie pour que deux districts voisins n'aient jamais la même
const TEINTES: Record<string, string> = {
  'Abidjan': '#DDEDE6',
  'Bas-Sassandra': '#DDEDE6',
  'Comoé': '#C9E2D5',
  'Denguélé': '#C9E2D5',
  'Gôh-Djiboua': '#C9E2D5',
  'Lacs': '#DDEDE6',
  'Lagunes': '#F4E7C8',
  'Montagnes': '#C9E2D5',
  'Sassandra-Marahoué': '#F4E7C8',
  'Savanes': '#F4E7C8',
  'Vallée du Bandama': '#C9E2D5',
  'Woroba': '#DDEDE6',
  'Yamoussoukro': '#EFD9A8',
  'Zanzan': '#EFD9A8'
};

@Component({
  selector: 'app-carte-regions',
  templateUrl: './carte-regions.html',
  styleUrl: './carte-regions.css'
})
export class CarteRegions {
  carte = input.required<Carte>();
  territoires = input.required<Region[]>();
  visibles = input<Set<string> | null>(null);   // null : aucun filtre actif
  selection = input<string | null>(null);
  survol = model<string | null>(null);          // partagé avec la liste
  choisir = output<string>();

  readonly ZOOM_MIN = ZOOM_MIN;
  readonly ZOOM_MAX = ZOOM_MAX;

  private svg = viewChild.required<ElementRef<SVGSVGElement>>('svg');
  private conteneur = viewChild.required<ElementRef<HTMLElement>>('conteneur');
  private destroyRef = inject(DestroyRef);

  zoom = signal(1);
  private cx = signal<number | null>(null);
  private cy = signal<number | null>(null);
  private dims = signal({ l: 0, h: 0 });
  bulle = signal<{ slug: string; x: number; y: number } | null>(null);

  private pointeurs = new Map<number, { x: number; y: number }>();
  private depart: { x: number; y: number } | null = null;
  private dernierEcart = 0;
  private dernierMilieu: { x: number; y: number } | null = null;
  private deplace = false;
  private anim = 0;
  private reduit =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Contours + données de chaque territoire
  formes = computed<FormeRegion[]>(() => {
    const parSlug = new Map(this.territoires().map(t => [t.slug, t]));
    return this.carte().territoires.map(f => ({ ...f, region: parSlug.get(f.slug) }));
  });

  // Zone de la carte actuellement visible
  private vb = computed(() => {
    const [, , W, H] = this.carte().viewBox;
    const z = this.zoom();
    const w = W / z;
    const h = H / z;
    const cx = this.cx() ?? W / 2;
    const cy = this.cy() ?? H / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  });

  viewBox = computed(() => {
    const v = this.vb();
    return `${v.x} ${v.y} ${v.w} ${v.h}`;
  });

  // Pixels d'écran par unité de carte : sert à garder les textes à taille constante
  echelle = computed(() => {
    const d = this.dims();
    const v = this.vb();
    return d.l ? Math.min(d.l / v.w, d.h / v.h) : 1;
  });

  px(n: number): number {
    return n / this.echelle();
  }

  // Les noms sont affichés seulement si la place le permet (ou si le territoire est actif)
  etiquettes = computed(() => {
    const e = this.echelle();
    const z = this.zoom();
    const survol = this.survol();
    const selection = this.selection();
    return this.formes().map(f => {
      const autonome = f.region?.type === 'district-autonome';
      const actif = f.slug === survol || f.slug === selection;
      const largeurNom = this.nomAffiche(f).length * 7.4;
      return {
        f,
        actif,
        autonome,
        selectionne: f.slug === selection,
        nom: !autonome && (actif || f.rayon * e * 2 >= largeurNom),
        chef: !autonome && !!f.cheflieu && (actif || z >= 2.6)
      };
    });
  });

  // Abidjan et Yamoussoukro, très petits : marqueur agrandi
  marqueurs = computed(() =>
    this.formes().filter(f => f.region?.type === 'district-autonome' && f.cheflieu)
  );

  infoBulle = computed(() => {
    const b = this.bulle();
    if (!b) return null;
    const region = this.territoires().find(t => t.slug === b.slug);
    if (!region) return null;
    const reste = region.departements.length - 6;
    return {
      x: b.x,
      y: b.y,
      region,
      deps: region.departements.slice(0, 6).join(', '),
      reste: reste > 0 ? reste : 0
    };
  });

  constructor() {
    afterNextRender(() => {
      const el = this.svg().nativeElement;
      const mesurer = () => {
        const r = el.getBoundingClientRect();
        this.dims.set({ l: r.width, h: r.height });
      };
      mesurer();
      const observateur = new ResizeObserver(mesurer);
      observateur.observe(el);
      this.destroyRef.onDestroy(() => {
        observateur.disconnect();
        cancelAnimationFrame(this.anim);
      });
    });

    // Quand un territoire est sélectionné (carte ou liste), la carte se centre dessus
    effect(() => {
      const slug = this.selection();
      const formes = this.formes();
      if (!slug) return;
      const f = formes.find(x => x.slug === slug);
      if (f) untracked(() => this.focaliser(f));
    });
  }

  // ----- Présentation -----
  nomAffiche(f: FormeRegion): string {
    return f.region?.nom ?? f.nom;
  }

  teinte(f: FormeRegion): string {
    return TEINTES[f.region?.district ?? ''] ?? '#DDEDE6';
  }

  estompe(slug: string): boolean {
    const v = this.visibles();
    return !!v && !v.has(slug);
  }

  libelle(f: FormeRegion): string {
    const r = f.region;
    if (!r) return f.nom;
    return r.type === 'region'
      ? `${r.nom}, district ${r.district}, chef-lieu ${r.chefLieu}`
      : `${r.nom}, district autonome, chef-lieu ${r.chefLieu}`;
  }

  // ----- Conversions écran / carte -----
  private versCarte(clientX: number, clientY: number): { x: number; y: number } {
    const ctm = this.svg().nativeElement.getScreenCTM();
    if (!ctm) return { x: this.cx() ?? 0, y: this.cy() ?? 0 };
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  private centre(): { x: number; y: number } {
    const [, , W, H] = this.carte().viewBox;
    return { x: this.cx() ?? W / 2, y: this.cy() ?? H / 2 };
  }

  // ----- Zoom et déplacement -----
  private contraindre(z: number, cx: number, cy: number) {
    const [, , W, H] = this.carte().viewBox;
    z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
    const borne = (c: number, taille: number, total: number) => {
      const min = taille / 2 - MARGE;
      const max = total - taille / 2 + MARGE;
      return min > max ? total / 2 : Math.min(max, Math.max(min, c));
    };
    return { z, cx: borne(cx, W / z, W), cy: borne(cy, H / z, H) };
  }

  private appliquer(z: number, cx: number, cy: number) {
    const c = this.contraindre(z, cx, cy);
    this.zoom.set(c.z);
    this.cx.set(c.cx);
    this.cy.set(c.cy);
  }

  // Zoom en gardant fixe le point de la carte situé sous le pointeur
  private zoomerAutour(zNouveau: number, clientX: number, clientY: number) {
    const m = this.versCarte(clientX, clientY);
    const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zNouveau));
    const ancien = this.zoom();
    const c = this.centre();
    this.appliquer(z, m.x - ((m.x - c.x) * ancien) / z, m.y - ((m.y - c.y) * ancien) / z);
  }

  private deplacerDe(dxPx: number, dyPx: number) {
    const e = this.echelle();
    const c = this.centre();
    this.appliquer(this.zoom(), c.x - dxPx / e, c.y - dyPx / e);
  }

  // Animation douce (boutons, recentrage, sélection)
  private animerVers(z: number, cx: number, cy: number) {
    cancelAnimationFrame(this.anim);
    const cible = this.contraindre(z, cx, cy);
    if (this.reduit) {
      this.appliquer(cible.z, cible.cx, cible.cy);
      return;
    }
    const dep = { z: this.zoom(), ...this.centre() };
    const t0 = performance.now();
    const duree = 320;
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / duree);
      const e = 1 - Math.pow(1 - k, 3);
      this.appliquer(
        dep.z * Math.pow(cible.z / dep.z, e),
        dep.x + (cible.cx - dep.x) * e,
        dep.y + (cible.cy - dep.y) * e
      );
      if (k < 1) this.anim = requestAnimationFrame(pas);
    };
    this.anim = requestAnimationFrame(pas);
  }

  private focaliser(f: FormeRegion) {
    const z = Math.min(ZOOM_MAX, Math.max(this.zoom(), Math.min(4, Math.max(1.6, 70 / f.rayon))));
    this.animerVers(z, f.etiquette[0], f.etiquette[1]);
  }

  zoomer(sens: 1 | -1) {
    const c = this.centre();
    this.animerVers(this.zoom() * (sens > 0 ? 1.7 : 1 / 1.7), c.x, c.y);
  }

  recentrer() {
    const [, , W, H] = this.carte().viewBox;
    this.animerVers(1, W / 2, H / 2);
  }

  // ----- Souris, doigts, clavier -----
  molette(e: WheelEvent) {
    if (ZOOM_MOLETTE_AVEC_CTRL && !e.ctrlKey) return;
    e.preventDefault();
    cancelAnimationFrame(this.anim);
    const facteur = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015));
    this.zoomerAutour(this.zoom() * facteur, e.clientX, e.clientY);
  }

  doubleClic(e: MouseEvent) {
    e.preventDefault();
    const m = this.versCarte(e.clientX, e.clientY);
    const c = this.centre();
    const ancien = this.zoom();
    const z = Math.min(ZOOM_MAX, ancien * 2);
    this.animerVers(z, m.x - ((m.x - c.x) * ancien) / z, m.y - ((m.y - c.y) * ancien) / z);
  }

  pointeurBas(e: PointerEvent) {
    cancelAnimationFrame(this.anim);
    if (e.isPrimary) this.pointeurs.clear();
    this.pointeurs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.deplace = false;
    if (e.isPrimary) this.depart = { x: e.clientX, y: e.clientY };
    if (this.pointeurs.size === 2) {
      const [a, b] = [...this.pointeurs.values()];
      this.dernierEcart = Math.hypot(a.x - b.x, a.y - b.y);
      this.dernierMilieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      this.deplace = true;
    }
  }

  pointeurMouvement(e: PointerEvent) {
    const precedent = this.pointeurs.get(e.pointerId);
    if (!precedent) return;
    const courant = { x: e.clientX, y: e.clientY };
    this.pointeurs.set(e.pointerId, courant);

    // Deux doigts : pincement (zoom) et déplacement
    if (this.pointeurs.size === 2) {
      const [a, b] = [...this.pointeurs.values()];
      const milieu = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ecart = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.dernierEcart && this.dernierMilieu) {
        this.zoomerAutour(this.zoom() * (ecart / this.dernierEcart), milieu.x, milieu.y);
        this.deplacerDe(milieu.x - this.dernierMilieu.x, milieu.y - this.dernierMilieu.y);
      }
      this.dernierEcart = ecart;
      this.dernierMilieu = milieu;
      return;
    }

    // Un doigt : la page défile, la carte ne bouge pas
    if (e.pointerType === 'touch') return;

    // Souris : on déplace la carte après quelques pixels de glissement
    if (!this.deplace && this.depart &&
        Math.hypot(courant.x - this.depart.x, courant.y - this.depart.y) < 5) return;
    if (!this.deplace) {
      this.deplace = true;
      this.bulle.set(null);
      this.svg().nativeElement.setPointerCapture(e.pointerId);
    }
    this.deplacerDe(courant.x - precedent.x, courant.y - precedent.y);
  }

  pointeurHaut(e: PointerEvent) {
    this.pointeurs.delete(e.pointerId);
    if (this.pointeurs.size < 2) {
      this.dernierEcart = 0;
      this.dernierMilieu = null;
    }
    setTimeout(() => (this.deplace = false)); // après l'éventuel clic
  }

  clavier(e: KeyboardEvent) {
    const pas = 60 / this.zoom();
    const c = this.centre();
    switch (e.key) {
      case 'ArrowLeft': this.appliquer(this.zoom(), c.x - pas, c.y); break;
      case 'ArrowRight': this.appliquer(this.zoom(), c.x + pas, c.y); break;
      case 'ArrowUp': this.appliquer(this.zoom(), c.x, c.y - pas); break;
      case 'ArrowDown': this.appliquer(this.zoom(), c.x, c.y + pas); break;
      case '+': case '=': this.zoomer(1); break;
      case '-': case '_': this.zoomer(-1); break;
      case '0': this.recentrer(); break;
      default: return;
    }
    e.preventDefault();
  }

  // ----- Territoires : survol, focus, clic -----
  private placerBulle(clientX: number, clientY: number, slug: string) {
    const r = this.conteneur().nativeElement.getBoundingClientRect();
    const x = Math.max(8, Math.min(clientX - r.left + 16, r.width - 280));
    const y = Math.max(8, Math.min(clientY - r.top + 16, r.height - 170));
    this.bulle.set({ slug, x, y });
  }

  entrer(f: FormeRegion, e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    this.survol.set(f.slug);
    this.placerBulle(e.clientX, e.clientY, f.slug);
  }

  bouger(f: FormeRegion, e: PointerEvent) {
    if (e.pointerType !== 'mouse' || this.deplace) return;
    this.placerBulle(e.clientX, e.clientY, f.slug);
  }

  sortir() {
    this.survol.set(null);
    this.bulle.set(null);
  }

  // Navigation au clavier : l'info-bulle apparaît près du territoire
  focaliserForme(f: FormeRegion) {
    this.survol.set(f.slug);
    const ctm = this.svg().nativeElement.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(f.etiquette[0], f.etiquette[1]).matrixTransform(ctm);
    this.placerBulle(p.x, p.y, f.slug);
  }

  clic(f: FormeRegion) {
    if (this.deplace) return;
    this.choisir.emit(f.slug);
  }

  activer(f: FormeRegion, e: Event) {
    e.preventDefault();
    this.choisir.emit(f.slug);
  }
}