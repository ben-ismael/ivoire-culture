export interface Photo {
  url: string;
  alt: string;
  credit?: string;
  source?: string;
}

export interface Distinction {
  texte: string;
  annee?: number;
  lien?: string;
}

export interface Ville {
  id: string;
  nom: string;
  vedette?: boolean;
  paragraphes?: string[];
  images?: Photo[];
}

export interface ChefLieuDetail {
  texte?: string;
  image?: Photo | null;
}

export interface DepartementDetail {
  nom: string;
  phrase?: string;
  image?: Photo | null;
}

export interface Lieu {
  nom: string;
  description?: string;
  image?: Photo | null;
}

export interface SourceRegion {
  type: 'livre' | 'article' | 'institution' | 'entretien' | 'site' | 'autre';
  titre: string;
  auteur?: string;
  annee?: number;
  url?: string;
}

// Contenu détaillé d'un territoire : tout est facultatif, un champ absent masque son bloc
export interface RegionDetail {
  slug: string;
  relu: boolean;          // false : le fichier est ignoré par le site
  accroche?: string;
  image?: Photo | null;
  presentation?: string[];
  distinction?: Distinction | null;
  villes?: Ville[];
  chefLieu?: ChefLieuDetail;
  departements?: DepartementDetail[];
  lieux?: Lieu[];
  galerie?: Photo[];
  sources?: SourceRegion[];
}