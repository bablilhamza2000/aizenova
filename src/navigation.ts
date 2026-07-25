import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getPermalink('/'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'AI',
      href: getPermalink('/category/ai'),
    },
    {
      text: 'Technology',
      href: getPermalink('/category/technology'),
    },
    {
      text: 'Programming',
      href: getPermalink('/category/programming'),
    },
    {
      text: 'Business',
      href: getPermalink('/category/business'),
    },
{
  text: '🔍 Search',
  href: getPermalink('/search'),
},
    {
      text: 'About',
      href: getPermalink('/about'),
    },
    {
      text: 'Contact',
      href: getPermalink('/contact'),
    },
  ],
  actions: [],
};

export const footerData = {
  links: [
    {
      title: 'AIZENOVA',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'About', href: getPermalink('/about') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Categories',
      links: [
        { text: 'AI', href: getPermalink('/category/ai') },
        { text: 'Technology', href: getPermalink('/category/technology') },
        { text: 'Programming', href: getPermalink('/category/programming') },
        { text: 'Business', href: getPermalink('/category/business') },
      ],
    },
{
  title: 'Legal',
  links: [
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
    { text: 'Terms of Service', href: getPermalink('/terms') },
    { text: 'Disclaimer', href: getPermalink('/disclaimer') },
    { text: 'Cookies Policy', href: getPermalink('/cookies') },
  ],
},
  ],

  secondaryLinks: [
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
    { text: 'Terms', href: getPermalink('/terms') },
  ],

  socialLinks: [
    {
      ariaLabel: 'Facebook',
      icon: 'tabler:brand-facebook',
      href: 'https://facebook.com',
    },
    {
      ariaLabel: 'Instagram',
      icon: 'tabler:brand-instagram',
      href: 'https://instagram.com',
    },
    {
      ariaLabel: 'X',
      icon: 'tabler:brand-x',
      href: 'https://x.com',
    },
    {
      ariaLabel: 'GitHub',
      icon: 'tabler:brand-github',
      href: 'https://github.com',
    },
    {
      ariaLabel: 'RSS',
      icon: 'tabler:rss',
      href: getAsset('/rss.xml'),
    },
  ],

  footNote: `
    © ${new Date().getFullYear()} AIZENOVA. All rights reserved.
  `,
};