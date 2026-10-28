
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  signal
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription
} from 'rxjs';

import { ContenuService } from '../../noyau/services/contenu';
import { CategorieService } from '../../noyau/services/categorie';
import { RegionService } from '../../noyau/services/region';
import { normaliser } from '../../noyau/outils';
import { CarteContenu } from '../../partage/composants/carte-contenu/carte-contenu';

@Component({
  selector: 'app-culture',
  standalone: true,
  imports: [FormsModule, RouterLink, CarteContenu],
  templateUrl: './culture.html',
  styleUrl: './culture.css'
})
export class Culture implements AfterViewInit, OnDestroy {

  // =========================================
  // SERVICES
  // =========================================

  private readonly contenuService = inject(ContenuService);
  private readonly categorieService = inject(CategorieService);
  private readonly regionService = inject(RegionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  // =========================================
  // OBSERVATEURS DES ANIMATIONS
  // =========================================

  private observateur?: IntersectionObserver;
  private observateurMutations?: MutationObserver;

  private readonly elementsObserves = new WeakSet<Element>();

  // =========================================
  // DONNÉES
  // =========================================

  private readonly contenus = toSignal(
    this.contenuService.getContenus(),
    { initialValue: [] }
  );

  readonly categories = toSignal(
    this.categorieService.getCategories(),
    { initialValue: [] }
  );

  private readonly regions = toSignal(
    this.regionService.getTerritoires(),
    { initialValue: [] }
  );

  // =========================================
  // ÉTAT DE LA PAGE
  // =========================================

  readonly recherche = signal('');
  readonly categorieActive = signal('toutes');
  readonly regionActive = signal('toutes');
  readonly tri = signal<'recentes' | 'az'>('recentes');
  readonly page = signal(1);

  readonly parPage = 9;

  private readonly rechercheSubject = new Subject<string>();
  private readonly rechercheSubscription: Subscription;

  // Histoires à afficher en priorité, dans cet ordre.
  private readonly priorites: string[] = [
    'garba',
    'zaouli',
    'coupe-decale',
    'tissu-korhogo'
  ];

  // =========================================
  // CONSTRUCTEUR
  // =========================================

  constructor() {

    // Récupération des paramètres présents dans l'URL.
    this.route.queryParamMap.subscribe(params => {
      const categorie = params.get('categorie') ?? 'toutes';
      const region = params.get('region') ?? 'toutes';
      const tri = params.get('tri') === 'az' ? 'az' : 'recentes';
      const page = Math.max(1, Number(params.get('page')) || 1);

      this.categorieActive.set(categorie);
      this.regionActive.set(region);
      this.recherche.set(params.get('q') ?? '');
      this.tri.set(tri);
      this.page.set(page);
    });

    // Recherche avec un délai de 300 ms.
    this.rechercheSubscription = this.rechercheSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((valeur: string) => {
        this.recherche.set(valeur);
        this.page.set(1);
        this.mettreAJourUrl();
      });
  }

  // =========================================
  // ANIMATIONS AU DÉFILEMENT
  // =========================================

  ngAfterViewInit(): void {

    const racine: HTMLElement | null =
      this.elementRef.nativeElement.querySelector('.page-culture');

    if (
      !racine ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return;
    }

    // Active les transitions CSS après initialisation.
    racine.classList.add('reveal-ready');

    // Affiche progressivement les éléments lorsqu'ils
    // entrent dans la zone visible de l'écran.
    this.observateur = new IntersectionObserver(
      (entrees: IntersectionObserverEntry[]) => {
        entrees.forEach((entree: IntersectionObserverEntry) => {
          if (entree.isIntersecting) {
            entree.target.classList.add('reveil-visible');

            // Évite de répéter l'animation après apparition.
            this.observateur?.unobserve(entree.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    // Observer les blocs déjà présents dans le HTML.
    racine
      .querySelectorAll('[data-reveal]')
      .forEach((element: Element) => {
        this.observerElement(element);
      });

    // Observer les nouveaux éléments créés par Angular,
    // notamment les cartes après un changement de filtre.
    if (typeof MutationObserver !== 'undefined') {

      this.observateurMutations = new MutationObserver(
        (mutations: MutationRecord[]) => {

          mutations.forEach((mutation: MutationRecord) => {

            mutation.addedNodes.forEach((noeud: Node) => {

              if (!(noeud instanceof Element)) {
                return;
              }

              // Le nouvel élément porte lui-même data-reveal.
              if (noeud.matches('[data-reveal]')) {
                this.observerElement(noeud);
              }

              // Rechercher aussi les éléments animables
              // présents à l'intérieur du nouvel élément.
              noeud
                .querySelectorAll('[data-reveal]')
                .forEach((element: Element) => {
                  this.observerElement(element);
                });
            });
          });
        }
      );

      this.observateurMutations.observe(racine, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Ajoute un élément à l'observateur de défilement.
   */
  private observerElement(element: Element): void {

    // Ne pas observer deux fois le même élément.
    if (this.elementsObserves.has(element)) {
      return;
    }

    this.elementsObserves.add(element);

    // Ajouter un décalage progressif aux cartes.
    const parent: HTMLElement | null =
      element.parentElement;

    const estUneCarte: boolean =
      parent?.classList.contains('grille-culture') ?? false;

    if (estUneCarte && parent) {

      const index: number =
        Array.from(parent.children).indexOf(element);

      const delai: number =
        Math.min(index * 75, 450);

      (element as HTMLElement).style.setProperty(
        '--delai-revelation',
        `${delai}ms`
      );
    }

    this.observateur?.observe(element);
  }

  // =========================================
  // NETTOYAGE
  // =========================================

  ngOnDestroy(): void {
    this.observateur?.disconnect();
    this.observateurMutations?.disconnect();

    this.rechercheSubscription.unsubscribe();
    this.rechercheSubject.complete();
  }

  // =========================================
  // FILTRAGE DES HISTOIRES
  // =========================================

  readonly contenusFiltres = computed(() => {

    const terme = normaliser(this.recherche());
    const categorie = this.categorieActive();
    const region = this.regionActive();

    return this.contenus()
      .filter(contenu => {

        const correspondCategorie =
          categorie === 'toutes' ||
          contenu.categorieSlug === categorie;

        const correspondRegion =
          region === 'toutes' ||
          contenu.regionSlug === region;

        const texte = normaliser(
          `${contenu.titre} ${contenu.resume}`
        );

        const correspondRecherche =
          !terme || texte.includes(terme);

        return (
          correspondCategorie &&
          correspondRegion &&
          correspondRecherche
        );
      })
      .sort((a, b) => {

        const indexA = this.priorites.indexOf(a.slug);
        const indexB = this.priorites.indexOf(b.slug);

        // Les histoires prioritaires passent en premier.
        if (indexA !== -1 && indexB === -1) {
          return -1;
        }

        if (indexA === -1 && indexB !== -1) {
          return 1;
        }

        // Respecter l'ordre des histoires prioritaires.
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }

        // Tri alphabétique.
        if (this.tri() === 'az') {
          return a.titre.localeCompare(b.titre, 'fr');
        }

        // Tri du plus récent au plus ancien.
        return (
          new Date(b.datePublication).getTime() -
          new Date(a.datePublication).getTime()
        );
      });
  });

  // =========================================
  // PAGINATION
  // =========================================

  readonly totalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(
        this.contenusFiltres().length / this.parPage
      )
    )
  );

  readonly contenusAffiches = computed(() => {

    const debut = (this.page() - 1) * this.parPage;

    return this.contenusFiltres().slice(
      debut,
      debut + this.parPage
    );
  });

  // =========================================
  // RÉGIONS DISPONIBLES
  // =========================================

  readonly regionsDisponibles = computed(() => {

    const slugs = new Set(
      this.contenus().map(contenu => contenu.regionSlug)
    );

    return this.regions().filter(
      region => slugs.has(region.slug)
    );
  });

  // =========================================
  // NOMS DES RÉGIONS ET CATÉGORIES
  // =========================================

  nomRegion(slug: string): string {
    return this.regions().find(
      region => region.slug === slug
    )?.nom ?? '';
  }

  nomCategorie(slug: string): string {
    return this.categories().find(
      categorie => categorie.slug === slug
    )?.nom ?? '';
  }

  // =========================================
  // RECHERCHE
  // =========================================

  changerRecherche(valeur: string): void {
    this.rechercheSubject.next(valeur);
  }

  // =========================================
  // FILTRES
  // =========================================

  choisirCategorie(slug: string): void {
    this.categorieActive.set(slug);
    this.page.set(1);

    this.mettreAJourUrl();
  }

  choisirRegion(slug: string): void {
    this.regionActive.set(slug);
    this.page.set(1);

    this.mettreAJourUrl();
  }

  choisirTri(valeur: 'recentes' | 'az'): void {
    this.tri.set(valeur);
    this.page.set(1);

    this.mettreAJourUrl();
  }

  // =========================================
  // CHANGEMENT DE PAGE
  // =========================================

  changerPage(page: number): void {

    this.page.set(
      Math.min(
        Math.max(1, page),
        this.totalPages()
      )
    );

    this.mettreAJourUrl();
  }

  // =========================================
  // RÉINITIALISATION
  // =========================================

  reinitialiser(): void {

    this.rechercheSubject.next('');
    this.recherche.set('');

    this.categorieActive.set('toutes');
    this.regionActive.set('toutes');
    this.tri.set('recentes');
    this.page.set(1);

    this.mettreAJourUrl();
  }

  // =========================================
  // DÉTECTION DES FILTRES ACTIFS
  // =========================================

  get filtresActifs(): boolean {
    return (
      !!this.recherche() ||
      this.categorieActive() !== 'toutes' ||
      this.regionActive() !== 'toutes' ||
      this.tri() !== 'recentes'
    );
  }

  // =========================================
  // SYNCHRONISATION DE L'URL
  // =========================================

  private mettreAJourUrl(): void {

    const queryParams: Record<
      string,
      string | number | null
    > = {

      categorie:
        this.categorieActive() === 'toutes'
          ? null
          : this.categorieActive(),

      region:
        this.regionActive() === 'toutes'
          ? null
          : this.regionActive(),

      q:
        this.recherche().trim() || null,

      tri:
        this.tri() === 'recentes'
          ? null
          : this.tri(),

      page:
        this.page() === 1
          ? null
          : this.page()
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
  }
}
