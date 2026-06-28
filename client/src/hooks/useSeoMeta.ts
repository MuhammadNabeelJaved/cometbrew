import { useEffect } from 'react';
import { seoApi, SeoMetaEntry } from '../api/seo.api';

const BASE_URL = 'https://cometbrew.com';

const PAGE_DEFAULTS: Record<string, { title: string; description: string; keywords?: string }> = {
    '/': {
        title: 'CometBrew | Web Development & AI Agency',
        description: 'CometBrew builds high-performance websites, AI-powered apps, and stunning UI/UX for forward-thinking brands. Start your digital transformation today.',
        keywords: 'web development agency, AI development, UI UX design, React development, Next.js agency, digital agency',
    },
    '/services': {
        title: 'Services | Web, AI & UI/UX Development — CometBrew',
        description: 'Explore CometBrew\'s full-service offerings: custom web development, AI automation, mobile apps, SaaS platforms, and award-winning UI/UX design.',
        keywords: 'web development services, AI development services, UI UX design agency, SaaS development, mobile app development, React development agency',
    },
    '/portfolio': {
        title: 'Portfolio | Our Work — CometBrew',
        description: 'Browse CometBrew\'s portfolio of websites, AI applications, and digital products built for startups, SaaS companies, and forward-thinking brands.',
        keywords: 'web design portfolio, agency portfolio, React projects, AI app portfolio, startup website design',
    },
    '/about': {
        title: 'About CometBrew | Digital Agency Story & Mission',
        description: 'Learn about CometBrew — a digital agency combining AI-driven development with award-winning design. Our mission, team, and values.',
        keywords: 'about CometBrew, digital agency story, web development team, AI agency mission',
    },
    '/contact': {
        title: 'Contact CometBrew | Start Your Project',
        description: 'Ready to build something great? Contact CometBrew to discuss your web development, AI integration, or design project. Get a free quote.',
        keywords: 'contact web agency, hire web developers, get a quote, web development inquiry',
    },
    '/careers': {
        title: 'Careers at CometBrew | Join Our Team',
        description: 'Join CometBrew — we\'re hiring talented developers, designers, and digital strategists. View open positions and apply today.',
        keywords: 'web developer jobs, design jobs, digital agency careers, remote developer jobs, CometBrew jobs',
    },
    '/our-team': {
        title: 'Our Team | Meet the CometBrew Crew',
        description: 'Meet the talented developers, designers, and strategists behind CometBrew who deliver world-class digital experiences.',
        keywords: 'CometBrew team, web developers, UX designers, agency team',
    },
    '/privacy': {
        title: 'Privacy Policy — CometBrew',
        description: 'CometBrew privacy policy — how we collect, use, and protect your personal information.',
    },
    '/terms': {
        title: 'Terms of Service — CometBrew',
        description: 'CometBrew terms of service — the agreement governing use of our website and services.',
    },
    '/cookies': {
        title: 'Cookie Settings — CometBrew',
        description: 'Manage your cookie preferences for the CometBrew website.',
    },
};

export function useSeoMeta(pageKey: string) {
    useEffect(() => {
        let cancelled = false;

        // Apply page-specific defaults immediately (before API resolves)
        const defaults = PAGE_DEFAULTS[pageKey];
        if (defaults) {
            applyMeta({
                page: pageKey,
                ...defaults,
                canonicalUrl: `${BASE_URL}${pageKey === '/' ? '' : pageKey}`,
            });
        }

        // Override with admin-saved meta from DB if available
        seoApi.getByPage(pageKey).then((meta: SeoMetaEntry) => {
            if (cancelled || !meta || !meta.title) return;
            applyMeta(meta);
        }).catch(() => {/* silent – page defaults already applied */});

        return () => { cancelled = true; };
    }, [pageKey]);
}

function setOrCreate(selector: string, attrs: Record<string, string>) {
    let el = document.querySelector(selector) as HTMLElement | null;
    if (!el) {
        el = document.createElement('meta');
        document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function applyMeta(meta: SeoMetaEntry) {
    const defaults = PAGE_DEFAULTS[meta.page] ?? {};
    const title = meta.title || defaults.title || 'CometBrew — Creative Digital Solutions';
    const desc  = meta.description || defaults.description || 'Full-service digital agency delivering web, mobile, and AI solutions.';

    document.title = title;

    setOrCreate('meta[name="description"]',        { name: 'description', content: desc });
    setOrCreate('meta[name="keywords"]',           { name: 'keywords',    content: meta.keywords || defaults.keywords || '' });
    setOrCreate('meta[property="og:title"]',       { property: 'og:title',       content: meta.ogTitle || title });
    setOrCreate('meta[property="og:description"]', { property: 'og:description', content: meta.ogDescription || desc });
    if (meta.ogImage) {
        setOrCreate('meta[property="og:image"]',   { property: 'og:image', content: meta.ogImage });
    }
    setOrCreate('meta[name="robots"]', {
        name: 'robots',
        content: meta.noIndex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large',
    });

    // Canonical
    const canonUrl = meta.canonicalUrl || (meta.page ? `${BASE_URL}${meta.page === '/' ? '' : meta.page}` : '');
    if (canonUrl) {
        let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canon) {
            canon = document.createElement('link');
            canon.rel = 'canonical';
            document.head.appendChild(canon);
        }
        canon.href = canonUrl;
    }
}
