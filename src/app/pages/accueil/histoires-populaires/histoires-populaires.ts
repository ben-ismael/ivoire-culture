
import {
  Component,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ContenuService } from '../../../noyau/services/contenu';
import { RegionService } from '../../../noyau/services/region';
import { CategorieService } from '../../../noyau/services/categorie';

import { CarteContenu } from '../../../partage/composants/carte-contenu/carte-contenu';

@Component({
  selector: 'app-histoires-populaires',
  imports: [RouterLink, CarteContenu],
  templateUrl: './histoires-populaires.html',
  styleUrl: './histoires-populaires.css'
})
export class HistoiresPopulaires {
  private hote = inject(ElementRef<HTMLElement>);

  private contenus = toSignal(
    inject(ContenuService).getContenusMisEnAvant(),
    { initialValue: [] }
  );

  private regions = toSignal(
    inject(RegionService).getTerritoires(),
    { initialValue: [] }
  );

  private categories = toSignal(
    inject(CategorieService).getCategories(),
    { initialValue: [] }
  );

  visible = signal(false);

  // Les 4 premières histoires, avec leur région et leur catégorie.
  histoires = computed(() =>
    this.contenus().slice(0, 4).map(contenu => ({
      contenu,
      region: this.regions().find(
        region => region.slug === contenu.regionSlug
      )?.nom ?? '',
      categorie: this.categories().find(
        categorie => categorie.slug === contenu.categorieSlug
      )?.nom ?? ''
    }))
  );

  constructor() {
    // Déclenche l'animation lorsque la section entre dans l'écran.
    afterNextRender(() => {
      const observateur = new IntersectionObserver(([entree]) => {
        if (entree.isIntersecting) {
          this.visible.set(true);
          observateur.disconnect();
        }
      }, { threshold: 0.15 });

      observateur.observe(this.hote.nativeElement);
    });
  }
}
