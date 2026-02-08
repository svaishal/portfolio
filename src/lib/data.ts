import { supabase, isSupabaseConfigured } from './supabase';
import fallbackData from '../data/data.json';

// Type definitions for fetched data
export interface Profile {
  id: string;
  name: string;
  role: string;
  tagline: string;
  subtitle: string;
  location: string;
  years_experience: string;
  bio: string;
  about_intro: string;
  about_values: string;
  open_to_work: boolean;
  profile_photo_url: string | null;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  period: string;
  type: string;
  icon: string;
  achievements: string[];
  skills: string[];
  is_current: boolean;
  sort_order: number;
}

export interface Certification {
  id: string;
  name: string;
  icon: string;
  issuer: string | null;
  date: string | null;
  url: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: 'technical' | 'soft';
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  highlights: string[];
  impact: string;
  image_url: string | null;
  link: string | null;
}

export interface JourneyPhase {
  id: string;
  phase: string;
  description: string;
  sort_order: number;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  year: string;
}

export interface SocialLink {
  id: string;
  platform: string;
  url: string;
}

export interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export interface Learning {
  id: string;
  name: string;
  description: string;
  status: string;
}

export interface PortfolioData {
  profile: Profile | null;
  experiences: Experience[];
  certifications: Certification[];
  technicalSkills: Skill[];
  softSkills: Skill[];
  projects: Project[];
  journeyPhases: JourneyPhase[];
  education: Education[];
  socialLinks: SocialLink[];
  tools: Tool[];
  learning: Learning[];
}

// Fallback data transformer
function getFallbackData(): PortfolioData {
  const data = fallbackData as any;
  
  return {
    profile: {
      id: 'fallback',
      name: data.personal.name,
      role: data.personal.role,
      tagline: data.personal.tagline,
      subtitle: data.personal.subtitle,
      location: data.personal.location,
      years_experience: data.personal.yearsExperience,
      bio: data.personal.bio,
      about_intro: data.personal.aboutNarrative?.intro || '',
      about_values: data.personal.aboutNarrative?.values || '',
      open_to_work: data.personal.openToWork,
      profile_photo_url: null,
    },
    experiences: data.experience.map((exp: any, index: number) => ({
      id: exp.id || `exp-${index}`,
      company: exp.company,
      role: exp.role,
      period: exp.period,
      type: exp.type,
      icon: exp.icon || '💼',
      achievements: exp.achievements,
      skills: exp.skills || [],
      is_current: exp.current,
      sort_order: index,
    })),
    certifications: data.certifications.map((cert: any, index: number) => ({
      id: `cert-${index}`,
      name: typeof cert === 'string' ? cert : cert.name,
      icon: typeof cert === 'string' ? '📜' : (cert.icon || '📜'),
      issuer: null,
      date: null,
      url: null,
    })),
    technicalSkills: data.skills.technical.map((skill: string, index: number) => ({
      id: `tech-${index}`,
      name: skill,
      category: 'technical' as const,
    })),
    softSkills: data.skills.soft.map((skill: string, index: number) => ({
      id: `soft-${index}`,
      name: skill,
      category: 'soft' as const,
    })),
    projects: data.projects.map((proj: any, index: number) => ({
      id: proj.id || `proj-${index}`,
      title: proj.title,
      description: proj.description,
      category: proj.category,
      icon: proj.icon || '📁',
      highlights: proj.highlights,
      impact: proj.impact,
      image_url: null,
      link: null,
    })),
    journeyPhases: data.personal.aboutNarrative?.journey?.map((phase: any, index: number) => ({
      id: `phase-${index}`,
      phase: phase.phase,
      description: phase.description,
      sort_order: index,
    })) || [],
    education: data.education.map((edu: any, index: number) => ({
      id: `edu-${index}`,
      degree: edu.degree,
      institution: edu.institution,
      field: edu.field,
      year: edu.year,
    })),
    socialLinks: [
      { id: 'github', platform: 'github', url: data.social?.github || `https://github.com/${data.personal.github}` },
      { id: 'linkedin', platform: 'linkedin', url: data.social?.linkedin || data.personal.linkedin },
    ],
    tools: (data.tools || []).map((tool: any, index: number) => ({
      id: `tool-${index}`,
      name: tool.name,
      category: tool.category,
      description: tool.description,
      icon: tool.icon || 'default',
    })),
    learning: (data.learning || []).map((item: any, index: number) => ({
      id: `learn-${index}`,
      name: item.name,
      description: item.description,
      status: item.status || 'in-progress',
    })),
  };
}

// Fetch all portfolio data
export async function getPortfolioData(): Promise<PortfolioData> {
  if (!isSupabaseConfigured) {
    console.log('Supabase not configured, using fallback data');
    return getFallbackData();
  }

  try {
    // Fetch all data in parallel
    const [
      profileResult,
      experiencesResult,
      certificationsResult,
      skillsResult,
      projectsResult,
      journeyResult,
      educationResult,
      socialResult,
      toolsResult,
      learningResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*').limit(1).single(),
      supabase.from('experiences').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('certifications').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('skills').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('projects').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('journey_phases').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('education').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('social_links').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('tools').select('*').eq('visible', true).order('sort_order', { ascending: true }),
      supabase.from('learning').select('*').eq('visible', true).order('sort_order', { ascending: true }),
    ]);

    // Check if we got data from Supabase
    if (profileResult.error || !profileResult.data) {
      console.log('No profile found in Supabase, using fallback data');
      return getFallbackData();
    }

    const skills = skillsResult.data || [];

    return {
      profile: profileResult.data as Profile,
      experiences: (experiencesResult.data || []) as Experience[],
      certifications: (certificationsResult.data || []) as Certification[],
      technicalSkills: skills.filter(s => s.category === 'technical') as Skill[],
      softSkills: skills.filter(s => s.category === 'soft') as Skill[],
      projects: (projectsResult.data || []) as Project[],
      journeyPhases: (journeyResult.data || []) as JourneyPhase[],
      education: (educationResult.data || []) as Education[],
      socialLinks: (socialResult.data || []) as SocialLink[],
      tools: (toolsResult.data || []) as Tool[],
      learning: (learningResult.data || []) as Learning[],
    };
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return getFallbackData();
  }
}

// Get specific social link
export function getSocialUrl(socialLinks: SocialLink[], platform: string): string {
  const link = socialLinks.find(l => l.platform.toLowerCase() === platform.toLowerCase());
  return link?.url || '#';
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
}
