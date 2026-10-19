export interface Forme {
  slug: string;
  nom: string;
  pcode: string;
  d: string;
  etiquette: [number, number];
  rayon: number;
  cheflieu?: { nom: string; x: number; y: number };
}

export interface Carte {
  viewBox: [number, number, number, number];
  source: string;
  territoires: Forme[];
}