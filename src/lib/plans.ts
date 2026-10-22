import data from '../data/plans.json';

export type Plan = (typeof data.plans)[number];
export type PlanId = Plan['id'];

export const plans = data.plans;
export const paidPlans = plans.filter((p) => p.id !== 'free');
export const { comparison, boltOns, noNurtureDiscount, upgrade, foundingClients, exclusivity } = data;

export function getPlan(id: string): Plan {
  const plan = plans.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan id "${id}" (see src/data/plans.json)`);
  return plan;
}

export const money = (n: number) => `$${n.toLocaleString('en-US')}`;

/** "$875/mo" or "Free" */
export const monthlyLabel = (p: Plan) => (p.monthly === 0 ? '$0/mo' : `${money(p.monthly)}/mo`);
export const setupLabel = (p: Plan) => (p.setup === 0 ? 'No setup fee' : `${money(p.setup)} setup`);

export function boltOnPrice(b: (typeof boltOns)[number]) {
  const base = b.unit === 'mo' ? `${money(b.price)}/mo` : `${money(b.price)} one-time`;
  return b.adSpendMinimum ? `${base} + ad spend (about ${money(b.adSpendMinimum)}/mo minimum)` : base;
}

/**
 * Replace price tokens in copy so FAQ and industry text never hard-code a number.
 *   {growth-builder.monthly}  -> $875/mo
 *   {growth-builder.setup}    -> $1,750
 *   {maps-reviews.annual}     -> $2,500/yr
 *   {growth-builder.name}     -> Growth Builder
 *   {growth-builder.term}     -> 6-month minimum
 *   {discount}                -> $500
 *   {lsa.price}               -> $200/mo + ad spend (about $450/mo minimum)
 *   {lsa.adspend}             -> $450 a month
 */
export function fill(text: string): string {
  return text.replace(/\{([a-z-]+)(?:\.([a-z]+))?\}/g, (whole, id: string, field?: string) => {
    if (id === 'discount' && !field) return money(noNurtureDiscount.amount);
    const bolt = boltOns.find((b) => b.id === id);
    if (bolt && field === 'price') return boltOnPrice(bolt);
    if (bolt && field === 'adspend' && bolt.adSpendMinimum) return `${money(bolt.adSpendMinimum)} a month`;
    const plan = plans.find((p) => p.id === id);
    if (!plan) throw new Error(`Unknown token ${whole}`);
    switch (field) {
      case 'monthly': return monthlyLabel(plan);
      case 'setup': return money(plan.setup);
      case 'annual': return plan.annual ? `${money(plan.annual)}/yr` : '';
      case 'name': return plan.name;
      case 'term': return plan.term;
      default: throw new Error(`Unknown token ${whole}`);
    }
  });
}
