import * as migration_20260813_103331_initial from './20260813_103331_initial';
import * as migration_20260813_140000_add_product_variants from './20260813_140000_add_product_variants';
import * as migration_20260813_220000_add_marketing_banner from './20260813_220000_add_marketing_banner';
import * as migration_20260814_224900_marketing_banners_array from './20260814_224900_marketing_banners_array';
import * as migration_20260817_150000_add_product_categories from './20260817_150000_add_product_categories';
import * as migration_20260818_120000_nav_item_appearance from './20260818_120000_nav_item_appearance';
import * as migration_20260818_190000_product_badge_priority from './20260818_190000_product_badge_priority';
import * as migration_20260819_100000_variant_pricing_mode from './20260819_100000_variant_pricing_mode';
import * as migration_20260819_140000_order_status_returned from './20260819_140000_order_status_returned';
import * as migration_20260819_180000_coupons_shipping from './20260819_180000_coupons_shipping';
import * as migration_20260819_220000_order_status_notifications from './20260819_220000_order_status_notifications';
import * as migration_20260819_230000_locked_documents_rels from './20260819_230000_locked_documents_rels';
import * as migration_20260820_090000_nav_opacity_mega_style from './20260820_090000_nav_opacity_mega_style';
import * as migration_20260820_140000_search_trigram from './20260820_140000_search_trigram';
import * as migration_20260820_170000_product_stock_state from './20260820_170000_product_stock_state';
import * as migration_20260821_090000_stock_notifications from './20260821_090000_stock_notifications';
import * as migration_20260821_150000_notification_attempts from './20260821_150000_notification_attempts';
import * as migration_20260822_090000_notification_recipient from './20260822_090000_notification_recipient';
import * as migration_20260822_190000_brand_logo from './20260822_190000_brand_logo';
import * as migration_20260823_090000_order_item_variant from './20260823_090000_order_item_variant';
import * as migration_20260823_100000_variant_pricing_backfill from './20260823_100000_variant_pricing_backfill';
import * as migration_20260823_120000_chrome_appearance from './20260823_120000_chrome_appearance';

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
  {
    up: migration_20260814_224900_marketing_banners_array.up,
    down: migration_20260814_224900_marketing_banners_array.down,
    name: '20260814_224900_marketing_banners_array'
  },
  {
    up: migration_20260817_150000_add_product_categories.up,
    down: migration_20260817_150000_add_product_categories.down,
    name: '20260817_150000_add_product_categories'
  },
  {
    up: migration_20260818_120000_nav_item_appearance.up,
    down: migration_20260818_120000_nav_item_appearance.down,
    name: '20260818_120000_nav_item_appearance'
  },
  {
    up: migration_20260818_190000_product_badge_priority.up,
    down: migration_20260818_190000_product_badge_priority.down,
    name: '20260818_190000_product_badge_priority'
  },
  {
    up: migration_20260819_100000_variant_pricing_mode.up,
    down: migration_20260819_100000_variant_pricing_mode.down,
    name: '20260819_100000_variant_pricing_mode'
  },
  {
    up: migration_20260819_140000_order_status_returned.up,
    down: migration_20260819_140000_order_status_returned.down,
    name: '20260819_140000_order_status_returned'
  },
  {
    up: migration_20260819_180000_coupons_shipping.up,
    down: migration_20260819_180000_coupons_shipping.down,
    name: '20260819_180000_coupons_shipping'
  },
  {
    up: migration_20260819_220000_order_status_notifications.up,
    down: migration_20260819_220000_order_status_notifications.down,
    name: '20260819_220000_order_status_notifications'
  },
  {
    up: migration_20260819_230000_locked_documents_rels.up,
    down: migration_20260819_230000_locked_documents_rels.down,
    name: '20260819_230000_locked_documents_rels'
  },
  {
    up: migration_20260820_090000_nav_opacity_mega_style.up,
    down: migration_20260820_090000_nav_opacity_mega_style.down,
    name: '20260820_090000_nav_opacity_mega_style'
  },
  {
    up: migration_20260820_140000_search_trigram.up,
    down: migration_20260820_140000_search_trigram.down,
    name: '20260820_140000_search_trigram'
  },
  {
    up: migration_20260820_170000_product_stock_state.up,
    down: migration_20260820_170000_product_stock_state.down,
    name: '20260820_170000_product_stock_state'
  },
  {
    up: migration_20260821_090000_stock_notifications.up,
    down: migration_20260821_090000_stock_notifications.down,
    name: '20260821_090000_stock_notifications'
  },
  {
    up: migration_20260821_150000_notification_attempts.up,
    down: migration_20260821_150000_notification_attempts.down,
    name: '20260821_150000_notification_attempts'
  },
  {
    up: migration_20260822_090000_notification_recipient.up,
    down: migration_20260822_090000_notification_recipient.down,
    name: '20260822_090000_notification_recipient'
  },
  {
    up: migration_20260822_190000_brand_logo.up,
    down: migration_20260822_190000_brand_logo.down,
    name: '20260822_190000_brand_logo'
  },
  {
    up: migration_20260823_090000_order_item_variant.up,
    down: migration_20260823_090000_order_item_variant.down,
    name: '20260823_090000_order_item_variant'
  },
  {
    up: migration_20260823_100000_variant_pricing_backfill.up,
    down: migration_20260823_100000_variant_pricing_backfill.down,
    name: '20260823_100000_variant_pricing_backfill'
  },
  {
    up: migration_20260823_120000_chrome_appearance.up,
    down: migration_20260823_120000_chrome_appearance.down,
    name: '20260823_120000_chrome_appearance'
  },
];
