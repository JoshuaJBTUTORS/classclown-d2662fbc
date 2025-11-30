export interface DomainConfig {
  name: string;
  domain: string;
  title: string;
  description: string;
  logo: string;
  theme: string;
  ogImage: string;
}

export const getDomainConfig = (): DomainConfig => {
  return {
    name: 'Class Beyond',
    domain: 'classbeyond.io',
    title: 'Class Beyond - AI Learning Platform',
    description: 'Complete learning platform with AI-powered tutoring and voice lessons.',
    logo: '/class-beyond-logo.png',
    theme: 'classbeyond',
    ogImage: '/class-beyond-logo.png'
  };
};
