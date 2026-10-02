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
    title: 'Class Beyond Academy | Online Tutoring',
    description: 'Personalised online lessons with expert tutors at Class Beyond Academy.',
    logo: '/class-beyond-logo.png',
    theme: 'classbeyond',
    ogImage: '/class-beyond-logo.png'
  };
};
