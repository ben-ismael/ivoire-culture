import { StatutPublication } from './region';

export type StatutEvenement = 'a-venir' | 'en-cours' | 'termine' | 'annule';
export type TypeEvenement = 'musique' | 'exposition' | 'tradition';

export interface Evenement {
  id: number;
  nom: string;
  slug: string;
  description: string;
  dateDebut: string;
  dateFin?: string;
  heure?: string;
  lieu: string;
  ville: string;
  regionSlug: string;
  categorieSlug?: string;
  typeEvenement: TypeEvenement;
  organisateur: string;
  contact?: string;
  image: string;
  imageAlt: string;
  statutEvenement: StatutEvenement;
  statut: StatutPublication;
}