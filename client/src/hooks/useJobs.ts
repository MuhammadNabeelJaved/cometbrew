/**
 * Custom Hook for managing Jobs
 * Uses localStorage to persist job data across Public and Admin pages.
 */
import { useState, useEffect } from 'react';

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedDate: string;
  status: 'active' | 'closed' | 'draft';
  salaryRange?: string;
  experienceLevel?: 'Entry Level' | 'Mid Level' | 'Senior' | 'Lead' | 'Executive';
  workMode?: 'Remote' | 'On-site' | 'Hybrid';
}

const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'Full-time',
    description: 'We are looking for an experienced Frontend Engineer to lead our UI development efforts. You will be responsible for building high-quality, responsive web applications using React and TypeScript.',
    responsibilities: [
      'Architect and build scalable frontend applications using React and TypeScript',
      'Collaborate with designers to implement pixel-perfect user interfaces',
      'Optimize application performance and ensure cross-browser compatibility',
      'Mentor junior developers and conduct code reviews',
      'Participate in architectural decisions and technical planning'
    ],
    requirements: [
      '5+ years of experience with React and modern JavaScript ecosystem',
      'Strong proficiency in TypeScript and CSS/Tailwind',
      'Experience with state management (Redux, Zustand, or Context)',
      'Understanding of web performance optimization techniques',
      'Bachelor’s degree in Computer Science or equivalent experience'
    ],
    benefits: [
      'Competitive salary and equity package',
      'Comprehensive health, dental, and vision insurance',
      'Unlimited PTO and flexible work hours',
      'Remote-first culture with home office stipend',
      'Annual learning and development budget'
    ],
    postedDate: new Date().toISOString(),
    status: 'active',
    salaryRange: '$140k - $180k',
    experienceLevel: 'Senior',
    workMode: 'Remote'
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'New York, NY',
    type: 'Full-time',
    description: 'Join our design team to create world-class digital experiences for our clients. We are looking for a Product Designer who loves solving complex problems with simple, elegant solutions.',
    responsibilities: [
      'Lead design projects from concept to launch',
      'Create wireframes, prototypes, and high-fidelity mockups',
      'Conduct user research and usability testing',
      'Collaborate with engineers to ensure design feasibility',
      'Maintain and evolve our design system'
    ],
    requirements: [
      '3+ years of product design experience',
      'Strong portfolio demonstrating UI/UX skills',
      'Proficiency in Figma and prototyping tools',
      'Experience working in an agile environment',
      'Excellent communication and presentation skills'
    ],
    benefits: [
      'Competitive salary and equity',
      'Health and wellness benefits',
      'Flexible working arrangements',
      'Creative and collaborative work environment',
      'Company retreats and social events'
    ],
    postedDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'active',
    salaryRange: '$110k - $150k',
    experienceLevel: 'Mid Level',
    workMode: 'Hybrid'
  },
  {
    id: '3',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'London, UK',
    type: 'Full-time',
    description: 'Lead our global marketing initiatives and brand strategy. We need a strategic thinker who can drive growth and build our brand presence.',
    responsibilities: [
      'Develop and execute comprehensive marketing strategies',
      'Manage social media presence and content calendar',
      'Analyze market trends and competitor activities',
      'Coordinate with sales team to align marketing efforts',
      'Track and report on marketing KPIs'
    ],
    requirements: [
      '5+ years in digital marketing or related role',
      'Experience with B2B SaaS marketing',
      'Strong understanding of SEO, SEM, and content marketing',
      'Data-driven mindset with analytical skills',
      'Leadership experience is a plus'
    ],
    benefits: [
      'Competitive compensation package',
      'Private health insurance',
      'Pension scheme contribution',
      'Flexible working hours',
      'Professional development opportunities'
    ],
    postedDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'active',
    salaryRange: '$90k - $130k',
    experienceLevel: 'Senior',
    workMode: 'On-site'
  }
];

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load jobs from local storage or use initial data
    const storedJobs = localStorage.getItem('agency-jobs');
    if (storedJobs) {
      setJobs(JSON.parse(storedJobs));
    } else {
      setJobs(INITIAL_JOBS);
      localStorage.setItem('agency-jobs', JSON.stringify(INITIAL_JOBS));
    }
    setLoading(false);
  }, []);

  const saveJobs = (newJobs: Job[]) => {
    setJobs(newJobs);
    localStorage.setItem('agency-jobs', JSON.stringify(newJobs));
  };

  const addJob = (job: Omit<Job, 'id' | 'postedDate'>) => {
    const newJob: Job = {
      ...job,
      id: Math.random().toString(36).substr(2, 9),
      postedDate: new Date().toISOString()
    };
    saveJobs([newJob, ...jobs]);
    return newJob;
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    const newJobs = jobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    );
    saveJobs(newJobs);
  };

  const deleteJob = (id: string) => {
    const newJobs = jobs.filter(job => job.id !== id);
    saveJobs(newJobs);
  };

  const getJob = (id: string) => jobs.find(job => job.id === id);

  return {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    getJob
  };
}
