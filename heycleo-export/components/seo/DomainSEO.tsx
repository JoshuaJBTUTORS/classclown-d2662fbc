import { Helmet } from 'react-helmet-async';
import { getDomainConfig } from '@/utils/domainConfig';

interface DomainSEOProps {
  pageTitle?: string;
  pageDescription?: string;
}

export const DomainSEO = ({ pageTitle, pageDescription }: DomainSEOProps) => {
  const config = getDomainConfig();
  const fullTitle = pageTitle ? `${pageTitle} | ${config.name}` : config.title;
  const description = pageDescription || config.description;
  const currentUrl = window.location.href;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={currentUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={config.ogImage} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={config.name} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={config.ogImage} />
      
      {/* Favicon */}
      <link rel="icon" href={config.logo} />
      <link rel="apple-touch-icon" href={config.logo} />
    </Helmet>
  );
};
