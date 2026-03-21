import React, { createContext, useContext, useState, useEffect } from 'react';

// --- Types ---

export interface HeroContent {
  badgeText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
}

export interface TechItem {
  name: string;
  iconName: string; // Key to map to actual icon component
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
  iconName: string; // Key for Lucide icon
  color: string; // Tailwind gradient classes
  details: string[];
}

export interface WhyChooseUsFeature {
  title: string;
  iconName: string; // Key for Lucide icon
  desc: string;
}

export interface WhyChooseUsContent {
  titleLine1: string;
  titleLine2: string; // Highlighted part
  description: string;
  points: string[]; // List of checkmark points
  features: WhyChooseUsFeature[]; // Scrolling cards
}

export interface ContentContextType {
  logoUrl: string;
  updateLogoUrl: (url: string) => void;
  
  heroContent: HeroContent;
  updateHeroContent: (content: HeroContent) => void;
  
  techStack: TechGroup[];
  updateTechStack: (groups: TechGroup[]) => void;
  
  processSteps: ProcessStep[];
  updateProcessSteps: (steps: ProcessStep[]) => void;
  
  whyChooseUs: WhyChooseUsContent;
  updateWhyChooseUs: (content: WhyChooseUsContent) => void;
}

// --- Default Data ---

const defaultLogoUrl = "https://vgbujcuwptvheqijyjbe.supabase.co/storage/v1/object/public/hmac-uploads/uploads/216147d0-06c1-4dee-8a5a-f933c6ef8556/1766429553723-26c2f3fe/N_Logo-01.png";

const defaultHeroContent: HeroContent = {
  badgeText: "Accepting New Projects for 2024",
  titleLine1: "We Build",
  titleLine2: "Digital Excellence",
  subtitle: "The agency for forward-thinking brands. We combine AI-driven development with award-winning design to build products that scale."
};

const defaultTechStack: TechGroup[] = [
  {
    id: "frontend",
    title: "Frontend & Experience",
    direction: "left",
    speed: 35,
    items: [
      { name: 'React', iconName: 'ReactIcon', description: 'UI Architecture', color: 'text-[#61DAFB]' },
      { name: 'Next.js', iconName: 'NextJsIcon', description: 'SSR Framework', color: 'text-foreground' },
      { name: 'TypeScript', iconName: 'TypeScriptIcon', description: 'Type Safety', color: 'text-[#3178C6]' },
      { name: 'Tailwind', iconName: 'TailwindIcon', description: 'Styling Engine', color: 'text-[#06B6D4]' },
      { name: 'Framer', iconName: 'FramerIcon', description: 'Motion', color: 'text-foreground' },
      { name: 'Three.js', iconName: 'ThreeJsIcon', description: 'WebGL 3D', color: 'text-foreground' },
      { name: 'Figma', iconName: 'FigmaIcon', description: 'UI/UX Design', color: 'text-[#F24E1E]' },
    ]
  },
  {
    id: "backend",
    title: "Backend & Data",
    direction: "right",
    speed: 40,
    items: [
      { name: 'Node.js', iconName: 'NodeJsIcon', description: 'Runtime', color: 'text-[#339933]' },
      { name: 'Supabase', iconName: 'SupabaseIcon', description: 'Realtime DB', color: 'text-[#3ECF8E]' },
      { name: 'PostgreSQL', iconName: 'PostgresIcon', description: 'Relational', color: 'text-[#4169E1]' },
      { name: 'GraphQL', iconName: 'GraphQlIcon', description: 'Data Query', color: 'text-[#E10098]' },
      { name: 'Python', iconName: 'PythonIcon', description: 'Logic Core', color: 'text-[#3776AB]' },
    ]
  },
  {
    id: "ai-infra",
    title: "AI & Infrastructure",
    direction: "left",
    speed: 30,
    items: [
      { name: 'OpenAI', iconName: 'OpenAIIcon', description: 'LLM Engine', color: 'text-foreground' },
      { name: 'HuggingFace', iconName: 'HuggingFaceIcon', description: 'ML Models', color: 'text-[#FFD21E]' },
      { name: 'AWS', iconName: 'AwsIcon', description: 'Cloud Infra', color: 'text-[#FF9900]' },
      { name: 'Vercel', iconName: 'VercelIcon', description: 'Edge Network', color: 'text-foreground' },
      { name: 'Docker', iconName: 'DockerIcon', description: 'Containers', color: 'text-[#2496ED]' },
      { name: 'Kubernetes', iconName: 'KubernetesIcon', description: 'Orchestration', color: 'text-[#326CE5]' },
      { name: 'Terraform', iconName: 'TerraformIcon', description: 'IaC', color: 'text-[#7B42BC]' },
    ]
  }
];

const defaultProcessSteps: ProcessStep[] = [
  {
    id: 1,
    title: "Discovery & Strategy",
    description: "We dive deep into your business goals to create a roadmap for success.",
    iconName: "Search",
    color: "from-blue-500 to-cyan-400",
    details: ["Market Analysis", "User Personas", "Technical Feasibility"]
  },
  {
    id: 2,
    title: "UX/UI Design",
    description: "Crafting intuitive interfaces that look stunning and function seamlessly.",
    iconName: "PenTool",
    color: "from-purple-500 to-pink-500",
    details: ["Wireframing", "High-Fidelity Mockups", "Interactive Prototypes"]
  },
  {
    id: 3,
    title: "Development",
    description: "Building robust, scalable applications using modern technologies.",
    iconName: "Code2",
    color: "from-green-500 to-emerald-400",
    details: ["Clean Code Architecture", "API Integration", "Performance Optimization"]
  },
  {
    id: 4,
    title: "Quality Assurance",
    description: "Rigorous testing to ensure a bug-free, smooth user experience.",
    iconName: "LayoutTemplate",
    color: "from-orange-500 to-red-500",
    details: ["Automated Testing", "Cross-Browser Checks", "Security Audits"]
  },
  {
    id: 5,
    title: "Launch & Scale",
    description: "Deploying your product and monitoring its growth in the real world.",
    iconName: "Rocket",
    color: "from-indigo-500 to-violet-500",
    details: ["CI/CD Pipelines", "Analytics Setup", "Post-Launch Support"]
  }
];

const defaultWhyChooseUs: WhyChooseUsContent = {
  titleLine1: "Why forward-thinking companies",
  titleLine2: "choose us",
  description: "We're not just a dev shop. We're your strategic partner in building digital products that stand out. Our AI-driven approach ensures faster delivery without compromising quality.",
  points: [
    "AI-First Development Approach",
    "Rapid Prototyping & Iteration",
    "Enterprise-Grade Security",
    "24/7 Support & Maintenance"
  ],
  features: [
    { title: "24/7 Support", iconName: "Clock", desc: "Always here when you need us." },
    { title: "Top Security", iconName: "Shield", desc: "Enterprise-grade protection." },
    { title: "Expert Team", iconName: "Users", desc: "Top 1% of global talent." },
    { title: "Fast Delivery", iconName: "Zap", desc: "2x faster than competitors." },
    { title: "Scalable Arch", iconName: "Rocket", desc: "Built to grow with you." },
    { title: "Modern Stack", iconName: "Code", desc: "Latest technologies used." },
  ]
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  // Helper to init state from localStorage or default
  const usePersistedState = <T,>(key: string, defaultValue: T): [T, (value: T) => void] => {
    const [state, setState] = useState<T>(() => {
      try {
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : defaultValue;
      } catch (e) {
        console.error(`Failed to parse ${key}`, e);
        return defaultValue;
      }
    });

    const setPersistedState = (value: T) => {
      setState(value);
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error(`Failed to save ${key}`, e);
      }
    };

    return [state, setPersistedState];
  };

  const [heroContent, setHeroContent] = usePersistedState('heroContent', defaultHeroContent);
  const [logoUrl, setLogoUrl] = usePersistedState('logoUrl', defaultLogoUrl);
  const [techStack, setTechStack] = usePersistedState('techStack', defaultTechStack);
  const [processSteps, setProcessSteps] = usePersistedState('processSteps', defaultProcessSteps);
  const [whyChooseUs, setWhyChooseUs] = usePersistedState('whyChooseUs', defaultWhyChooseUs);

  return (
    <ContentContext.Provider value={{
      heroContent, updateHeroContent: setHeroContent,
      logoUrl, updateLogoUrl: setLogoUrl,
      techStack, updateTechStack: setTechStack,
      processSteps, updateProcessSteps: setProcessSteps,
      whyChooseUs, updateWhyChooseUs: setWhyChooseUs
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}