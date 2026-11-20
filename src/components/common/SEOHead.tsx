import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath?: string;
  noIndex?: boolean;
  ogImage?: string;
  type?: 'website' | 'article' | 'product';
}

export function SEOHead({
  title,
  description,
  canonicalPath,
  noIndex = false,
  ogImage = 'https://pricealerter.in/brand/logo.png',
  type = 'website',
}: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = title.includes('PriceAlerter') ? title : `${title} | PriceAlerter`;
    document.title = fullTitle;

    const canonicalHref =
      window.location.origin + (canonicalPath || window.location.pathname);

    const updateMeta = (selector: string, attr: string, key: string, content: string) => {
      let el = document.querySelector(selector) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateMeta('meta[name="description"]', 'name', 'description', description);
    updateMeta(
      'meta[name="robots"]',
      'name',
      'robots',
      noIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );
    updateMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    updateMeta('meta[property="og:description"]', 'property', 'og:description', description);
    updateMeta('meta[property="og:url"]', 'property', 'og:url', canonicalHref);
    updateMeta('meta[property="og:type"]', 'property', 'og:type', type);
    updateMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'PriceAlerter India');
    updateMeta('meta[property="og:image"]', 'property', 'og:image', ogImage);
    updateMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle);
    updateMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    updateMeta('meta[name="twitter:url"]', 'name', 'twitter:url', canonicalHref);
    updateMeta('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalHref);

    const ldScript = document.getElementById('pa-ld-json');
    if (ldScript) {
      ldScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'PriceAlerter',
        url: window.location.origin,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description,
      });
    }
  }, [title, description, canonicalPath, noIndex]);

  return null;
}
