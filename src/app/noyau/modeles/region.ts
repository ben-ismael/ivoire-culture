export type StatutPublication = 'brouillon' | 'publie' | 'archive';

export interface Region {
  id: number;
  nom: string;
  slug: string;
  zone: string;
  accroche: string;
  description: string;
  image: string;
  imageAlt: string;
  statut: StatutPublication;
}