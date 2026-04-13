import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io as socketIO } from 'socket.io-client';
import { apiCache, TTL } from '../lib/apiCache';
import { cmsApi } from '../api/cms.api';
import { pageStatusApi, type PageStatusItem } from '../api/pageStatus.api';
import { announcementsApi, type AnnouncementItem } from '../api/announcements.api';
import { announcementBarsApi, type AnnouncementBarGroup } from '../api/announcementBars.api';

// --- Types ---

export interface HeroContent {
  badgeText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
}

export interface TechItem {
  name: string;
  iconName: string;
  description: string;
  color: string;
}

export interface TechGroup {
  id: string;
  title: string;
  direction: 'left' | 'right';
  speed: number;
  items: TechItem[];
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  iconName: string;
  color: string;
  details: string[];
}

export interface WhyChooseUsFeature {
  title: string;
  iconName: string;
  desc: string;
}

export interface WhyChooseUsContent {
  titleLine1: string;
  titleLine2: string;
  description: string;
  points: string[];
  features: WhyChooseUsFeature[];
}

export interface ContactInfo {
  address: string;
  email: string;
  phone: string;
  businessHours: string;
}

export interface CustomSocialLink {
  _id?: string;
  label: string;
  url: string;
  icon: string;
}

export interface SocialLinks {
  twitter: string;
  linkedin: string;
  instagram: string;
  github: string;
  customSocialLinks: CustomSocialLink[];
}

export interface Testimonial {
  _id?: string;
  content: string;
  author: string;
  role: string;
  rating: number;
}

export interface NavLinkItem {
  _id?: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  openInNewTab: boolean;
}

export interface FooterLinkItem {
  _id?: string;
  label: string;
  href: string;
  isActive: boolean;
  openInNewTab: boolean;
}

export interface FooterSectionItem {
  _id?: string;
  title: string;
  order: number;
  links: FooterLinkItem[];
}

export interface FooterBottomLinkItem {
  _id?: string;
  label: string;
  href: string;
  order: number;
  isActive: boolean;
  openInNewTab: boolean;
}

export interface FooterBottomContent {
  copyrightText: string;
  links: FooterBottomLinkItem[];
  taglineText: string;
  taglineVisible: boolean;
}

export interface ContentContextType {
  logoUrl: string;
  heroContent: HeroContent;
  updateHeroContent: (content: HeroContent) => void;
  techStack: TechGroup[];
  processSteps: ProcessStep[];
  whyChooseUs: WhyChooseUsContent;
  contactInfo: ContactInfo;
  socialLinks: SocialLinks;
  testimonials: Testimonial[];
  isLoading: boolean;
  // Page statuses (maintenance / coming-soon control)
  pageStatuses: PageStatusItem[];
  setPageStatuses: React.Dispatch<React.SetStateAction<PageStatusItem[]>>;
  // Announcement bar
  announcements: AnnouncementItem[];
  setAnnouncements: React.Dispatch<React.SetStateAction<AnnouncementItem[]>>;
  hasActiveAnnouncements: boolean;
  tickerDuration: number;
  setTickerDuration: React.Dispatch<React.SetStateAction<number>>;
  scrollEnabled: boolean;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  textAlign: 'left' | 'center' | 'right';
  setTextAlign: React.Dispatch<React.SetStateAction<'left' | 'center' | 'right'>>;
  separatorVisible: boolean;
  setSeparatorVisible: React.Dispatch<React.SetStateAction<boolean>>;
  separatorColor: string;
  setSeparatorColor: React.Dispatch<React.SetStateAction<string>>;
  itemSpacing: number;
  setItemSpacing: React.Dispatch<React.SetStateAction<number>>;
  // Updaters (save to API + local state)
  updateLogoUrl: (url: string) => Promise<void>;
  updateTechStack: (groups: TechGroup[]) => Promise<void>;
  updateProcessSteps: (steps: ProcessStep[]) => Promise<void>;
  updateWhyChooseUs: (content: WhyChooseUsContent) => Promise<void>;
  updateContactInfo: (info: ContactInfo) => Promise<void>;
  updateSocialLinks: (links: SocialLinks) => Promise<void>;
  updateTestimonials: (items: Testimonial[]) => Promise<void>;
  // Multi-bar announcements (new source of truth)
  announcementBars: AnnouncementBarGroup[];
  setAnnouncementBars: React.Dispatch<React.SetStateAction<AnnouncementBarGroup[]>>;
  /** Active bars with visibility='dashboard' or 'both' — fetched only for authenticated users */
  dashboardAnnouncementBars: AnnouncementBarGroup[];
  setDashboardAnnouncementBars: React.Dispatch<React.SetStateAction<AnnouncementBarGroup[]>>;
  /** Trigger a re-fetch of dashboard bars (call this from dashboard layouts on mount) */
  fetchDashboardBars: () => void;
  // Global site theme (admin-controlled, overrides all visitor preferences)
  globalTheme: 'dark' | 'light' | null;
  updateGlobalTheme: (theme: 'dark' | 'light' | null) => Promise<void>;
  // Nav & Footer links
  navLinks: NavLinkItem[];
  footerSections: FooterSectionItem[];
  footerBottom: FooterBottomContent;
  updateNavLinks: (links: NavLinkItem[]) => Promise<void>;
  updateFooterSections: (sections: FooterSectionItem[]) => Promise<void>;
  updateFooterBottom: (data: Partial<FooterBottomContent>) => Promise<void>;
  // Refetch from API
  refetch: () => Promise<void>;
}

// --- Defaults ---

const defaultLogoUrl = "https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png";

const defaultHeroContent: HeroContent = {
  badgeText: "Accepting New Projects for 2026",
  titleLine1: "We Build",
  titleLine2: "Digital Excellence",
  subtitle: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale."
};

const defaultTechStack: TechGroup[] = [
  {
    id: "frontend", title: "Frontend & Experience", direction: "left", speed: 35,
    items: [
      { name: 'React', iconName: 'ReactIcon', description: 'UI Architecture', color: 'text-[#61DAFB]' },
      { name: 'Next.js', iconName: 'NextJsIcon', description: 'SSR Framework', color: 'text-foreground' },
      { name: 'TypeScript', iconName: 'TypeScriptIcon', description: 'Type Safety', color: 'text-[#3178C6]' },
      { name: 'Tailwind', iconName: 'TailwindIcon', description: 'Styling Engine', color: 'text-[#06B6D4]' },
      { name: 'Framer', iconName: 'FramerIcon', description: 'Motion', color: 'text-foreground' },
    ]
  },
  {
    id: "backend", title: "Backend & Data", direction: "right", speed: 40,
    items: [
      { name: 'Node.js', iconName: 'NodeJsIcon', description: 'Runtime', color: 'text-[#339933]' },
      { name: 'MongoDB', iconName: 'MongoDBIcon', description: 'Database', color: 'text-[#47A248]' },
      { name: 'PostgreSQL', iconName: 'PostgresIcon', description: 'Relational', color: 'text-[#4169E1]' },
    ]
  },
  {
    id: "ai-infra", title: "AI & Infrastructure", direction: "left", speed: 30,
    items: [
      { name: 'OpenAI', iconName: 'OpenAIIcon', description: 'LLM Engine', color: 'text-foreground' },
      { name: 'AWS', iconName: 'AwsIcon', description: 'Cloud Infra', color: 'text-[#FF9900]' },
      { name: 'Docker', iconName: 'DockerIcon', description: 'Containers', color: 'text-[#2496ED]' },
    ]
  }
];

const defaultProcessSteps: ProcessStep[] = [
  { id: 1, title: "Discovery & Strategy", description: "We dive deep into your business goals.", iconName: "Search", color: "from-blue-500 to-cyan-400", details: ["Market Analysis", "User Personas", "Technical Feasibility"] },
  { id: 2, title: "UX/UI Design", description: "Crafting intuitive interfaces that look stunning.", iconName: "PenTool", color: "from-purple-500 to-pink-500", details: ["Wireframing", "High-Fidelity Mockups", "Interactive Prototypes"] },
  { id: 3, title: "Development", description: "Building robust, scalable applications.", iconName: "Code2", color: "from-green-500 to-emerald-400", details: ["Clean Code Architecture", "API Integration", "Performance Optimization"] },
  { id: 4, title: "Quality Assurance", description: "Rigorous testing to ensure a bug-free experience.", iconName: "LayoutTemplate", color: "from-orange-500 to-red-500", details: ["Automated Testing", "Cross-Browser Checks", "Security Audits"] },
  { id: 5, title: "Launch & Scale", description: "Deploying and monitoring your product's growth.", iconName: "Rocket", color: "from-indigo-500 to-violet-500", details: ["CI/CD Pipelines", "Analytics Setup", "Post-Launch Support"] }
];

const defaultWhyChooseUs: WhyChooseUsContent = {
  titleLine1: "Why forward-thinking companies",
  titleLine2: "choose us",
  description: "We're not just a dev shop. We're your strategic partner in building digital products that stand out.",
  points: ["AI-First Development Approach", "Rapid Prototyping & Iteration", "Enterprise-Grade Security", "24/7 Support & Maintenance"],
  features: [
    { title: "24/7 Support", iconName: "Clock", desc: "Always here when you need us." },
    { title: "Top Security", iconName: "Shield", desc: "Enterprise-grade protection." },
    { title: "Expert Team", iconName: "Users", desc: "Top 1% of global talent." },
    { title: "Fast Delivery", iconName: "Zap", desc: "2x faster than competitors." },
    { title: "Scalable Arch", iconName: "Rocket", desc: "Built to grow with you." },
    { title: "Modern Stack", iconName: "Code", desc: "Latest technologies used." },
  ]
};

const defaultContactInfo: ContactInfo = { address: "", email: "", phone: "", businessHours: "" };
const defaultSocialLinks: SocialLinks = { twitter: "", linkedin: "", instagram: "", github: "", customSocialLinks: [] };

// --- Map CMS API response to frontend types ---

function mapCmsToState(cms: any) {
  const techStack: TechGroup[] = (cms.techStack || []).map((cat: any, i: number) => ({
    id: cat._id || `cat-${i}`,
    title: cat.categoryName || '',
    direction: i % 2 === 0 ? 'left' : 'right' as 'left' | 'right',
    speed: 35 + i * 5,
    items: (cat.items || []).map((item: any) => ({
      name: item.name,
      iconName: item.iconKey || item.iconName || '',
      description: item.description || '',
      color: item.colorClass || item.color || 'text-foreground',
    })),
  }));

  const processSteps: ProcessStep[] = (cms.conceptToReality?.steps || [])
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((step: any, i: number) => ({
      id: i + 1,
      title: step.stepTitle || '',
      description: step.description || '',
      iconName: step.iconName || 'Circle',
      color: step.gradientColor || 'from-blue-500 to-cyan-400',
      details: step.bulletPoints || [],
    }));

  const wcu = cms.whyChooseUs || {};
  const whyChooseUs: WhyChooseUsContent = {
    titleLine1: wcu.titleLine1 || defaultWhyChooseUs.titleLine1,
    titleLine2: wcu.titleLine2Highlighted || defaultWhyChooseUs.titleLine2,
    description: wcu.description || defaultWhyChooseUs.description,
    points: wcu.keyPoints || defaultWhyChooseUs.points,
    features: (wcu.scrollingCards || []).map((card: any) => ({
      title: card.title,
      iconName: card.iconName || 'Star',
      desc: card.description || '',
    })),
  };

  const contactInfo: ContactInfo = {
    address: cms.contactInfo?.address || '',
    email: cms.contactInfo?.email || '',
    phone: cms.contactInfo?.phone || '',
    businessHours: cms.contactInfo?.businessHours || '',
  };

  const socialLinks: SocialLinks = {
    twitter: cms.socialLinks?.twitter || '',
    linkedin: cms.socialLinks?.linkedin || '',
    instagram: cms.socialLinks?.instagram || '',
    github: cms.socialLinks?.github || '',
    customSocialLinks: cms.socialLinks?.customSocialLinks || [],
  };

  const testimonials: Testimonial[] = (cms.testimonials || [])
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
    .map((t: any) => ({
      _id: t._id,
      content: t.content,
      author: t.author,
      role: t.role || '',
      rating: t.rating || 5,
    }));

  return { techStack, processSteps, whyChooseUs, contactInfo, socialLinks, testimonials, logoUrl: cms.logoUrl || defaultLogoUrl };
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState(defaultLogoUrl);
  const [techStack, setTechStack] = useState<TechGroup[]>(defaultTechStack);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>(defaultProcessSteps);
  const [whyChooseUs, setWhyChooseUs] = useState<WhyChooseUsContent>(defaultWhyChooseUs);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pageStatuses, setPageStatuses] = useState<PageStatusItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [announcementBars, setAnnouncementBars] = useState<AnnouncementBarGroup[]>([]);
  const [dashboardAnnouncementBars, setDashboardAnnouncementBars] = useState<AnnouncementBarGroup[]>([]);
  const [tickerDuration, setTickerDuration] = useState(30);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [separatorVisible, setSeparatorVisible] = useState(true);
  const [separatorColor, setSeparatorColor] = useState('');
  const [itemSpacing, setItemSpacing] = useState(32);
  const [globalTheme, setGlobalTheme] = useState<'dark' | 'light' | null>(null);
  const [navLinks, setNavLinks] = useState<NavLinkItem[]>([]);
  const [footerSections, setFooterSections] = useState<FooterSectionItem[]>([]);
  const [footerBottom, setFooterBottom] = useState<FooterBottomContent>({
    copyrightText: 'Nabeel Agency. All rights reserved.',
    links: [
      { label: 'Privacy Policy', href: '/privacy',  order: 0, isActive: true, openInNewTab: false },
      { label: 'Terms',          href: '/terms',    order: 1, isActive: true, openInNewTab: false },
      { label: 'Cookies',        href: '/cookies',  order: 2, isActive: true, openInNewTab: false },
    ],
    taglineText: 'Made with ♥ in California',
    taglineVisible: true,
  });

  // Hero content stays in localStorage (managed via HomePageHero API separately)
  const [heroContent, setHeroContent] = useState<HeroContent>(() => {
    try {
      const saved = localStorage.getItem('heroContent');
      return saved ? JSON.parse(saved) : defaultHeroContent;
    } catch { return defaultHeroContent; }
  });

  const updateHeroContent = (content: HeroContent) => {
    setHeroContent(content);
    localStorage.setItem('heroContent', JSON.stringify(content));
  };

  const fetchCMS = useCallback(async () => {
    const CACHE_KEY = 'cms:main';
    const cachedCms = apiCache.get(CACHE_KEY) as any;
    if (cachedCms) {
      const mapped = mapCmsToState(cachedCms);
      setLogoUrl(mapped.logoUrl || defaultLogoUrl);
      if (mapped.techStack.length > 0) setTechStack(mapped.techStack);
      if (mapped.processSteps.length > 0) setProcessSteps(mapped.processSteps);
      setWhyChooseUs(mapped.whyChooseUs);
      setContactInfo(mapped.contactInfo);
      setSocialLinks(mapped.socialLinks);
      setTestimonials(mapped.testimonials);
      setGlobalTheme(cachedCms.globalTheme ?? null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await cmsApi.get();
      const cms = res.data.data;
      if (!cms) return;
      apiCache.set(CACHE_KEY, cms, TTL.TEN_MIN);
      const mapped = mapCmsToState(cms);
      setLogoUrl(mapped.logoUrl || defaultLogoUrl);
      if (mapped.techStack.length > 0) setTechStack(mapped.techStack);
      if (mapped.processSteps.length > 0) setProcessSteps(mapped.processSteps);
      setWhyChooseUs(mapped.whyChooseUs);
      setContactInfo(mapped.contactInfo);
      setSocialLinks(mapped.socialLinks);
      setTestimonials(mapped.testimonials);
      setGlobalTheme(cms.globalTheme ?? null);
    } catch {
      // Keep defaults on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNavLinks = useCallback(() => {
    cmsApi.getNavLinks()
      .then(res => setNavLinks((res.data as any).data?.navLinks ?? []))
      .catch(() => {});
  }, []);

  const fetchFooterSections = useCallback(() => {
    cmsApi.getFooterSections()
      .then(res => setFooterSections((res.data as any).data?.footerSections ?? []))
      .catch(() => {});
  }, []);

  const fetchFooterBottom = useCallback(() => {
    cmsApi.getFooterBottom()
      .then(res => {
        const d = (res.data as any).data?.footerBottom;
        if (d) setFooterBottom(d);
      })
      .catch(() => {});
  }, []);

  const fetchPageStatuses = useCallback(() => {
    const CACHE_KEY = 'page-status:all';
    const cached = apiCache.get(CACHE_KEY);
    if (cached) {
      setPageStatuses(cached as PageStatusItem[]);
      return;
    }
    pageStatusApi.getAll()
      .then(res => {
        const data = res.data.data ?? [];
        apiCache.set(CACHE_KEY, data, TTL.TWO_MIN);
        setPageStatuses(data);
      })
      .catch(() => {});
  }, []);

  const fetchDashboardBars = useCallback(() => {
    announcementBarsApi.getActiveDashboard()
      .then(res => setDashboardAnnouncementBars((res.data as any).data ?? []))
      .catch(() => {});
  }, []);

  const fetchAnnouncements = useCallback(() => {
    announcementsApi.getActive()
      .then(res => setAnnouncements((res.data as any).data ?? []))
      .catch(() => {});
    announcementBarsApi.getActive()
      .then(res => setAnnouncementBars((res.data as any).data ?? []))
      .catch(() => {});
    announcementsApi.getSettings()
      .then(res => {
        const s = (res.data as any).data ?? {};
        setTickerDuration(s.tickerDuration ?? 30);
        setScrollEnabled(s.scrollEnabled ?? true);
        setTextAlign(s.textAlign ?? 'center');
        setSeparatorVisible(s.separatorVisible ?? true);
        setSeparatorColor(s.separatorColor ?? '');
        setItemSpacing(s.itemSpacing ?? 32);
      })
      .catch(() => {});
  }, []);

  // Initial data load
  useEffect(() => {
    fetchCMS();
    fetchNavLinks();
    fetchFooterSections();
    fetchFooterBottom();
    fetchPageStatuses();
    fetchAnnouncements();
  }, []);

  // Real-time CMS updates via public socket namespace (no auth required)
  useEffect(() => {
    const socket = socketIO('/public', {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('cms:updated', ({ section }: { section: string }) => {
      // Refetch ContentContext-owned data
      switch (section) {
        case 'navLinks':       fetchNavLinks();       break;
        case 'footerSections': fetchFooterSections(); break;
        case 'footerBottom':   fetchFooterBottom();   break;
        case 'pageStatus':     fetchPageStatuses();   break;
        case 'announcements':  fetchAnnouncements(); fetchDashboardBars(); break;
        case 'globalTheme':
        case 'cms':            fetchCMS();            break;
      }
      // Always broadcast to the whole app so any page can react via useDataRealtime
      window.dispatchEvent(new CustomEvent('cms:updated', { detail: { section } }));
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchCMS, fetchNavLinks, fetchFooterSections, fetchFooterBottom, fetchPageStatuses, fetchAnnouncements, fetchDashboardBars]);

  const updateLogoUrl = async (url: string) => {
    setLogoUrl(url);
    await cmsApi.updateLogo(url);
  };

  const updateTechStack = async (groups: TechGroup[]) => {
    setTechStack(groups);
    const payload = groups.map(g => ({
      categoryName: g.title,
      items: g.items.map(item => ({
        name: item.name,
        iconKey: item.iconName,
        description: item.description,
        colorClass: item.color,
      })),
    }));
    await cmsApi.updateTechStack(payload);
  };

  const updateProcessSteps = async (steps: ProcessStep[]) => {
    setProcessSteps(steps);
    const payload = steps.map((s, i) => ({
      stepTitle: s.title,
      description: s.description,
      iconName: s.iconName,
      gradientColor: s.color,
      bulletPoints: s.details,
      order: i,
    }));
    await cmsApi.updateConceptToReality({ steps: payload });
  };

  const updateWhyChooseUs = async (content: WhyChooseUsContent) => {
    setWhyChooseUs(content);
    await cmsApi.updateWhyChooseUs({
      titleLine1: content.titleLine1,
      titleLine2Highlighted: content.titleLine2,
      description: content.description,
      keyPoints: content.points,
      scrollingCards: content.features.map((f, i) => ({ title: f.title, iconName: f.iconName, description: f.desc, order: i })),
    });
  };

  const updateContactInfo = async (info: ContactInfo) => {
    setContactInfo(info);
    await cmsApi.updateContactInfo(info);
  };

  const updateSocialLinks = async (links: SocialLinks) => {
    setSocialLinks(links);
    await cmsApi.updateSocialLinks(links);
  };

  const updateGlobalTheme = async (theme: 'dark' | 'light' | null) => {
    setGlobalTheme(theme);
    await cmsApi.updateGlobalTheme(theme);
  };

  const updateNavLinks = async (links: NavLinkItem[]) => {
    setNavLinks(links);
    await cmsApi.updateNavLinks(links);
  };

  const updateFooterSections = async (sections: FooterSectionItem[]) => {
    setFooterSections(sections);
    await cmsApi.updateFooterSections(sections);
  };

  const updateFooterBottom = async (data: Partial<FooterBottomContent>) => {
    setFooterBottom(prev => ({ ...prev, ...data }));
    await cmsApi.updateFooterBottom(data);
  };

  const updateTestimonials = async (items: Testimonial[]) => {
    setTestimonials(items);
    await cmsApi.updateTestimonials(items);
  };

  return (
    <ContentContext.Provider value={{
      logoUrl, heroContent, updateHeroContent, techStack, processSteps, whyChooseUs,
      contactInfo, socialLinks, testimonials, isLoading,
      pageStatuses, setPageStatuses,
      announcements, setAnnouncements,
      hasActiveAnnouncements: announcements.length > 0,
      announcementBars, setAnnouncementBars,
      dashboardAnnouncementBars, setDashboardAnnouncementBars,
      fetchDashboardBars,
      tickerDuration, setTickerDuration,
      scrollEnabled, setScrollEnabled,
      textAlign, setTextAlign,
      separatorVisible, setSeparatorVisible,
      separatorColor, setSeparatorColor,
      itemSpacing, setItemSpacing,
      updateLogoUrl, updateTechStack, updateProcessSteps, updateWhyChooseUs,
      updateContactInfo, updateSocialLinks, updateTestimonials,
      globalTheme, updateGlobalTheme,
      navLinks, footerSections, footerBottom,
      updateNavLinks, updateFooterSections, updateFooterBottom,
      refetch: fetchCMS,
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) throw new Error('useContent must be used within a ContentProvider');
  return context;
}
