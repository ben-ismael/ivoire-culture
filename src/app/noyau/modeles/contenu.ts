import { StatutPublication } from './region';

export interface Source {
  type: 'livre' | 'article' | 'institution' | 'entretien' | 'site' | 'autre';
  titre: string;
  auteur?: string;
  url?: string;
}

export interface Media {
  url: string;
  alt: string;
  credit?: string;
}

export interface Contenu {
  id: number;
  titre: string;
  slug: string;
  resume: string;
  description: string;
  categorieSlug: string;
  regionSlug: string;
  image: string;
  imageAlt: string;
  imageCredit?: string;
  galerie?: Media[];
  videoUrl?: string;
  auteur?: string;
    tempsLecture?: number;
  sources?: Source[];
  misEnAvant: boolean;
  datePublication: string;
  dateMiseAJour: string;
  statut: StatutPublication;
  details?: Record<string, string | string[]>;
}