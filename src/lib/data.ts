import { supabase, isSupabaseConfigured } from './supabase';

// Type definitions for fetched data
export interface Profile {
  id?: string;
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
  id?: string;
  company: string;
  role: string;
  period: string;
  type: string;
  icon: string;
  achievements: string[];
  skills: string[];
  is_current: boolean;
  sort_order: number;
  visible?: boolean;
}

export interface Certification {
  id?: string;
  name: string;
  icon: string;
  issuer: string | null;
  date: string | null;
  url: string | null;
  visible?: boolean;
  sort_order?: number;
}

export interface Skill {
  id?: string;
  name: string;
  category: 'technical' | 'soft';
  visible?: boolean;
  sort_order?: number;
}

export interface Project {
  id?: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  highlights: string[];
  impact: string;
  image_url: string | null;
  link: string | null;
  visible?: boolean;
  sort_order?: number;
}

export interface JourneyPhase {
  id?: string;
  phase: string;
  description: string;
  sort_order: number;
  visible?: boolean;
}

export interface Education {
  id?: string;
  degree: string;
  institution: string;
  field: string;
  year: string;
  visible?: boolean;
  sort_order?: number;
}

export interface SocialLink {
  id?: string;
  platform: string;
  url: string;
  visible?: boolean;
  sort_order?: number;
}

export interface Tool {
  id?: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  visible?: boolean;
  sort_order?: number;
}

export interface Learning {
  id?: string;
  name: string;
  description: string;
  status: string;
  visible?: boolean;
  sort_order?: number;
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

// Fetch all portfolio data
export async function getPortfolioData(client?: any, useDraft = false): Promise<PortfolioData> {
  const sb = client || supabase;
  
  if (!client && !isSupabaseConfigured) {
    console.error('Supabase not configured');
    return getEmptyData();
  }

  const table = (name: string) => useDraft ? `${name}_draft` : name;

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
      sb.from(table('profiles')).select('*').single(),
      sb.from(table('experiences')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('certifications')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('skills')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('projects')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('journey_phases')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('education')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('social_links')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('tools')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
      sb.from(table('learning')).select('*').eq('visible', true).order('sort_order', { ascending: true }),
    ]);

    // Check if we got data from Supabase
    if (profileResult.error || !profileResult.data) {
      console.error('No profile found in Supabase', profileResult.error);
      return getEmptyData();
    }

    // Cast data (draft tables might return slightly different types if stricter, but usually compatible)
    // Note: 'any' cast used because draft tables aren't in Database types effectively here unless generic?
    // But runtime data is compatible.

    const skills = skillsResult.data || [];

    return {
      profile: profileResult.data as Profile,
      experiences: (experiencesResult.data || []) as Experience[],
      certifications: (certificationsResult.data || []) as Certification[],
      technicalSkills: (skills as any[]).filter(s => s.category === 'technical') as Skill[],
      softSkills: (skills as any[]).filter(s => s.category === 'soft') as Skill[],
      projects: (projectsResult.data || []) as Project[],
      journeyPhases: (journeyResult.data || []) as unknown as JourneyPhase[],
      education: (educationResult.data || []) as Education[],
      socialLinks: (socialResult.data || []) as SocialLink[],
      tools: (toolsResult.data || []) as Tool[],
      learning: (learningResult.data || []) as Learning[],
    };
  } catch (error) {
    console.error('Error fetching from Supabase:', error);
    return getEmptyData();
  }
}

function getEmptyData(): PortfolioData {
  return {
    profile: null,
    experiences: [],
    certifications: [],
    technicalSkills: [],
    softSkills: [],
    projects: [],
    journeyPhases: [],
    education: [],
    socialLinks: [],
    tools: [],
    learning: [],
  };
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
