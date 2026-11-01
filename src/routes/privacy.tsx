import { createFileRoute } from '@tanstack/react-router';
import { LegalPage } from '@/components/agata/primitives';

export const Route = createFileRoute('/privacy')({
  head: () => ({ meta: [
    { title: 'Privacy Policy — Ágata' },
    { name: 'description', content: 'How Ágata collects, uses and protects your personal data.' },
    { property: 'og:title', content: 'Privacy Policy — Ágata' },
    { property: 'og:description', content: 'How Ágata collects, uses and protects your personal data.' },
    { property: 'og:type', content: 'article' },
    { name: 'twitter:card', content: 'summary' },
  ] }),
  component: () => <LegalPage title="Privacy Policy" updated="November 1, 2026" sections={[
    { heading: 'What we collect', body: ['Account details (email, name, username), profile media (avatar, banner), the content you upload, and the workspaces, teams and projects you create or join.', 'When you sign in with Google or Apple, we receive your basic profile information from that provider.'] },
    { heading: 'How we use it', body: ['To run your account, show your public profile, store your creations, and keep the platform secure. We do not sell your personal data.'] },
    { heading: 'Public and private content', body: ['Your creations are private unless you choose to make them public. Public content can be seen by anyone who visits your profile.'] },
    { id: 'cookies', heading: 'Cookies and local storage', body: ['We use essential cookies and browser storage to keep you signed in and remember preferences like language and theme. We do not use advertising cookies.'] },
    { heading: 'Storage and security', body: ['Your data is stored with our hosting provider and protected by access rules so only you, and members you share with, can reach private content.'] },
    { heading: 'Your rights', body: ['You can view, edit or delete your profile and content at any time, and request deletion of your account and associated data.'] },
    { heading: 'Changes', body: ['We may update this policy as the platform evolves. The date of the latest change is shown at the top of this page.'] },
  ]} />,
});
