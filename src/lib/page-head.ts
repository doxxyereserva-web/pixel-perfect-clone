/** Leaf-route metadata so account pages do not inherit a generic dashboard title. */
export function pageHead(title: string, description: string) {
  return { meta: [
    { title: `${title} — Ágata` },
    { name: 'description', content: description },
    { property: 'og:title', content: `${title} — Ágata` },
    { property: 'og:description', content: description },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
  ] };
}