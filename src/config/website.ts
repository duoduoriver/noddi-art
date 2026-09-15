import { publicEnv } from '@/env/public';
import { m } from '@/locale/paraglide/messages';
import type { WebsiteConfig } from '../types';
import { PACK_CATALOG, PLAN_CATALOG } from '@/credits/catalog';
import {
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_USER_FILES_FOLDER,
} from '@/storage/constants';

const waffo = {
  pro: publicEnv.VITE_WAFFO_PRODUCT_PRO_MONTHLY ?? '',
  studio: publicEnv.VITE_WAFFO_PRODUCT_STUDIO_MONTHLY ?? '',
  launch: publicEnv.VITE_WAFFO_PRODUCT_LAUNCH_PACK ?? '',
  maker: publicEnv.VITE_WAFFO_PRODUCT_MAKER_PACK ?? '',
  studioPack: publicEnv.VITE_WAFFO_PRODUCT_STUDIO_PACK ?? '',
};

/** Public product identity is Sunburst AI; Worker/D1/R2 infrastructure keeps its legacy names. */
export const websiteConfig: WebsiteConfig = {
  ui: { mode: { defaultMode: 'light', enableSwitch: true } },
  metadata: {
    get name() {
      return m.site_name();
    },
    get title() {
      return m.site_title();
    },
    get description() {
      return m.site_description();
    },
    images: {
      ogImage: '/og.jpg',
      logoLight: '/logo.png',
      logoDark: '/logo-dark.png',
    },
  },
  social: {},
  auth: {
    enable: true,
    enableGoogleLogin: true,
    enableGitHubLogin: true,
    enableCredentialLogin: false,
    enableDeleteAccount: true,
  },
  blog: { enable: false, paginationSize: 6 },
  mail: {
    enable: true,
    provider: 'cloudflare',
    supportEmail: publicEnv.VITE_SUPPORT_EMAIL,
  },
  newsletter: {
    enable: false,
    provider: 'resend',
    autoSubscribeAfterSignUp: false,
  },
  notification: { enable: false, provider: 'discord' },
  cache: { enable: true, provider: 'kv' },
  storage: {
    enable: true,
    provider: 'r2',
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedTypes: DEFAULT_ALLOWED_TYPES,
    userFilesFolder: DEFAULT_USER_FILES_FOLDER,
  },
  payment: {
    enable: publicEnv.VITE_PAYMENT_PROVIDER === 'waffo',
    provider: publicEnv.VITE_PAYMENT_PROVIDER === 'waffo' ? 'waffo' : undefined,
    price: {
      plans: {
        free: {
          id: 'free',
          name: 'Free',
          description: 'Try the full concept workflow and lightweight exports.',
          features: [
            '2 plan credits',
            'PNG / WebP up to 512px',
            'Android / Web packages',
          ],
          limits: ['HD master and iOS / macOS export require paid access'],
          prices: [],
          isFree: true,
          isLifetime: false,
        },
        pro: {
          id: 'pro',
          name: 'Pro',
          description: 'Monthly credits for regular icon work.',
          features: [
            '100 monthly credits',
            '1024px HD master',
            'iOS / macOS export',
          ],
          limits: [],
          prices: [
            {
              type: 'subscription',
              priceId: waffo.pro,
              amount: PLAN_CATALOG.pro.cents,
              currency: 'USD',
              interval: 'month',
            },
          ],
          isFree: false,
          isLifetime: false,
          popular: true,
        },
        studio: {
          id: 'studio',
          name: 'Studio',
          description: 'Monthly credits for teams and launches.',
          features: [
            '400 monthly credits',
            'Everything in Pro',
            'More room for launch-heavy iteration',
          ],
          limits: [],
          prices: [
            {
              type: 'subscription',
              priceId: waffo.studio,
              amount: PLAN_CATALOG.studio.cents,
              currency: 'USD',
              interval: 'month',
            },
          ],
          isFree: false,
          isLifetime: false,
        },
        launch: {
          id: 'launch',
          name: 'Launch Pack',
          description: '100 permanent credits.',
          features: ['100 purchased credits'],
          limits: [],
          prices: [
            {
              type: 'one_time',
              priceId: waffo.launch,
              amount: PACK_CATALOG.launch.cents,
              currency: 'USD',
            },
          ],
          isFree: false,
          isLifetime: false,
        },
        maker: {
          id: 'maker',
          name: 'Maker Pack',
          description: '300 permanent credits.',
          features: ['300 purchased credits'],
          limits: [],
          prices: [
            {
              type: 'one_time',
              priceId: waffo.maker,
              amount: PACK_CATALOG.maker.cents,
              currency: 'USD',
            },
          ],
          isFree: false,
          isLifetime: false,
        },
        'studio-pack': {
          id: 'studio-pack',
          name: 'Studio Pack',
          description: '800 permanent credits.',
          features: ['800 purchased credits'],
          limits: [],
          prices: [
            {
              type: 'one_time',
              priceId: waffo.studioPack,
              amount: PACK_CATALOG['studio-pack'].cents,
              currency: 'USD',
            },
          ],
          isFree: false,
          isLifetime: false,
        },
      },
    },
  },
};
