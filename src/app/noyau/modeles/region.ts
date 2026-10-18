export type StatutPublication = 'brouillon' | 'publie' | 'archive';
export type TypeTerritoire = 'region' | 'district-autonome';

export interface Region {
  id: number;
  nom: string;
  slug: string;
  type: TypeTerritoire;
  district: string;
  chefLieu: string;
  villePhare: string;
  departements: string[];
  accroche: string;
  description: string;
  image: string;
  imageAlt: string;
  imageCredit?: string;
  misEnAvant: boolean;
  statut: StatutPublication;
}