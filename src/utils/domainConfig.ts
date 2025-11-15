export const isDomain = (domain: string): boolean => {
  return window.location.hostname.includes(domain);
};

export const isCleoIO = (): boolean => {
  return window.location.hostname === 'app.heycleo.io' || 
         window.location.hostname === 'localhost'; // for testing
};

export const isClassClown = (): boolean => {
  return !isCleoIO();
};

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
  if (isCleoIO()) {
    return {
      name: 'Cleo',
      domain: 'app.heycleo.io',
      title: 'Cleo - Your AI Learning Companion',
      description: 'Learn anything with Cleo, your personal AI tutor. Interactive voice lessons with visual aids, diagrams, and personalized teaching.',
      logo: '/lovable-uploads/963b1f9b-3727-4176-a1d2-d9ed14181c23.png',
      theme: 'cleo',
      ogImage: '/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png'
    };
  }
  
  return {
    name: 'ClassClown',
    domain: 'classclown.io',
    title: 'ClassClown - Complete Learning Platform',
    description: 'Comprehensive tuition service management platform with AI-powered learning.',
    logo: '/lovable-uploads/963b1f9b-3727-4176-a1d2-d9ed14181c23.png',
    theme: 'classclown',
    ogImage: '/lovable-uploads/a07030e4-b379-491d-aa75-73f415678dea.png'
  };
};
