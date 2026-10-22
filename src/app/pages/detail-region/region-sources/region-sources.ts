import { Component, input } from '@angular/core';

import { SourceRegion } from '../../../noyau/modeles/region-detail';

export interface CreditPhoto {
  legende: string;
  credit: string;
  source?: string;
}

@Component({
  selector: 'app-region-sources',
  templateUrl: './region-sources.html',
  styleUrl: './region-sources.css'
})
export class RegionSources {
  sources = input<SourceRegion[]>([]);
  credits = input<CreditPhoto[]>([]);
}