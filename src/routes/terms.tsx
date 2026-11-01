import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '@/components/agata/primitives';

export const Route = createFileRoute('/terms')({
  head: () => ({ meta: [
    { title: 'Terms of Service — Ágata' },
    { name: 'description', content: 'The terms that govern your use of Ágata, the Roblox development platform.' },
    { property: 'og:title', content: 'Terms of Service — Ágata' },
    { property: 'og:description', content: 'The terms that govern your use of Ágata.' },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <LegalPage title="Terms of Service" updated="November 1, 2026" sections={[
    { heading: 'Acceptance of terms', body: ['By creating an account or using Ágata, you agree to these Terms of Service. If you do not agree, do not use the platform.'] },
    { heading: 'Your account', body: ['You are responsible for keeping your login credentials secure and for all activity under your account. You must provide accurate information and be old enough to use the service under the laws of your country.'] },
    { heading: 'Your content', body: ['You keep all rights to the creations, files, tools and other content you upload. By making content public, you allow other users to view and download it through Ágata.', 'You confirm you have the rights to everything you upload and that it does not infringe anyone else\u2019s rights.'] },
    { heading: 'Acceptable use', body: ['Do not use Ágata to upload malware, harass others, violate the law, or break the Roblox Terms of Use. We may remove content or suspend accounts that break these rules.'] },
    { heading: 'Intellectual property', body: ['The Ágata name, mascot, logo and platform design are owned by Ágata. All rights reserved. You may not copy or reuse them without written permission.', 'Ágata is not affiliated with Roblox Corporation. Roblox is a trademark of Roblox Corporation.'] },
    { heading: 'Availability and changes', body: ['Ágata is in active development and provided \u201cas is\u201d. Features may change or be discontinued. We may update these terms and will note the date of the latest change on this page.'] },
    { heading: 'Limitation of liability', body: ['To the extent permitted by law, Ágata is not liable for indirect or consequential losses, or for loss of data, arising from your use of the platform.'] },
    { heading: 'Termination', body: ['You can delete your account at any time. We may suspend or end access for accounts that violate these terms.'] },
  ]} />,
});
