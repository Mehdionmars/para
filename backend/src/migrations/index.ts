import * as migration_20260813_103331_initial from './20260813_103331_initial';
import * as migration_20260813_140000_add_product_variants from './20260813_140000_add_product_variants';
import * as migration_20260813_220000_add_marketing_banner from './20260813_220000_add_marketing_banner';

export const migrations = [
  {
    up: migration_20260813_103331_initial.up,
    down: migration_20260813_103331_initial.down,
    name: '20260813_103331_initial'
  },
  {
    up: migration_20260813_140000_add_product_variants.up,
    down: migration_20260813_140000_add_product_variants.down,
    name: '20260813_140000_add_product_variants'
  },
  {
    up: migration_20260813_220000_add_marketing_banner.up,
    down: migration_20260813_220000_add_marketing_banner.down,
    name: '20260813_220000_add_marketing_banner'
  },
];
