/**
 * Site-wide settings. Anything marked TODO is a placeholder Justin still needs to fill in.
 * Empty strings are handled gracefully: the UI hides or labels the missing piece.
 */
export const site = {
  name: 'Benchmark Digital',
  url: 'https://benchmarkdigital.agency',
  owner: 'Justin',
  tagline: 'Local marketing for south-side service businesses',

  // TODO: phone number, e.g. '(317) 555-0123'. Shown in the header, mobile call bar and schema.
  phone: '',
  // TODO: confirm the public contact email.
  email: 'justin@benchmarkdigital.agency',
  // TODO: Calendly link, e.g. 'https://calendly.com/benchmarkdigital/intro'. Empty = placeholder box.
  calendlyUrl: '',
  // What the thank-you page promises. Edit if this changes.
  responseTime: 'within one business day',

  serviceArea: ['Franklin Township', 'Beech Grove', 'Greenwood', 'South side of Indianapolis'],

  links: {
    reviewApp: 'https://thanksandrate.com',
    localLegends: 'https://bestoffranklintownship.com',
    // TODO: social profiles, used in schema sameAs and the footer.
    facebook: '',
    googleBusinessProfile: '',
  },

  // Public build-time values (see .env.example).
  // Cloudflare's always-pass test key is used when no real key is set.
  turnstileSiteKey: import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA',
  clickySiteId: import.meta.env.PUBLIC_CLICKY_SITE_ID || '',
};

export const nav = [
  { href: '/how-it-works', label: 'How it works' },
  { href: '/plans', label: 'Plans' },
  { href: '/industries/home-services', label: 'Home services' },
  { href: '/industries/pet-services', label: 'Pet services' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  // Add { href: '/blog', label: 'Blog' } once src/pages/blog exists.
];

export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1/, '')}`;
