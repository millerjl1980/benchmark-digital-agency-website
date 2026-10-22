import faqs from '../data/faqs.json';
import { fill } from './plans';

export { faqs };
export type FaqGroup = keyof typeof faqs;

/** FAQPage JSON-LD for one FAQ group; pass to <Base schema={[...]}> */
export function faqSchema(group: FaqGroup) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs[group].map((f) => ({
      '@type': 'Question',
      name: fill(f.q),
      acceptedAnswer: { '@type': 'Answer', text: fill(f.a) },
    })),
  };
}
