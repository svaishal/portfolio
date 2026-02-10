import type { APIRoute } from 'astro';
import { getPortfolioData } from '../../lib/data';

// ✅ FIX: Resume endpoint should NOT require authentication
// It uses public portfolio data only (fallback or public Supabase queries)
export const GET: APIRoute = async ({ request }) => {

  try {
    // Use the same public data function that powers the main site
    const data = await getPortfolioData();

    if (!data.profile) {
      console.error('[DEBUG] Resume API: No profile data found');
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const profile = data.profile;
    const experiences = data.experiences || [];
    const tools = data.tools || [];
    const certifications = data.certifications || [];
    const education = data.education || [];
    const skills = data.technicalSkills || [];
    const projects = data.projects || [];


    // Generate ATS-safe HTML resume
    const html = generateATSResumeHTML(profile, experiences, tools, certifications, education, skills, projects);


    // Return HTML with proper headers to trigger download
    // In a production environment, you'd convert this to PDF server-side
    // For now, we'll return HTML that can be printed as PDF
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${profile.name.replace(/\s+/g, '_')}_Resume.html"`,
      },
    });
  } catch (error: any) {
    console.error('[DEBUG] Resume API: Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate resume', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function generateATSResumeHTML(
  profile: any,
  experiences: any[],
  tools: any[],
  certifications: any[],
  education: any[],
  skills: any[],
  projects: any[]
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} - Resume</title>
  <style>
    /* ATS-Safe Styling: Simple, black & white, no colors */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #000;
      background: #fff;
      padding: 0.5in;
      max-width: 8.5in;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 20pt;
      font-weight: bold;
      margin-bottom: 4pt;
      text-transform: uppercase;
    }
    
    h2 {
      font-size: 13pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
      border-bottom: 1px solid #000;
      padding-bottom: 2pt;
      text-transform: uppercase;
    }
    
    h3 {
      font-size: 11pt;
      font-weight: bold;
      margin-top: 6pt;
      margin-bottom: 2pt;
    }
    
    p, li {
      margin-bottom: 3pt;
    }
    
    ul {
      margin-left: 20pt;
      margin-bottom: 6pt;
    }
    
    .contact-info {
      margin-bottom: 8pt;
      font-size: 10pt;
    }
    
    .job-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3pt;
    }
    
    .job-title {
      font-weight: bold;
    }
    
    .job-period {
      font-style: italic;
    }
    
    .skills-list {
      margin-bottom: 6pt;
    }
    
    /* Ensure no page breaks within sections */
    .section {
      page-break-inside: avoid;
    }
    
    @media print {
      body {
        padding: 0.25in;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <h1>${profile.name}</h1>
  <div class="contact-info">
    <p>${profile.role}</p>
    <p>${profile.location} | ${profile.years_experience} Years Experience</p>
  </div>
  
  <!-- Professional Summary -->
  <div class="section">
    <h2>Professional Summary</h2>
    <p>${profile.tagline}</p>
  </div>
  
  <!-- Experience -->
  ${experiences.length > 0
      ? `<div class="section">
    <h2>Professional Experience</h2>
    ${experiences
        .map(
          (exp) => `
    <div style="margin-bottom: 10pt;">
      <div class="job-header">
        <div>
          <span class="job-title">${exp.role}</span> - ${exp.company}
        </div>
        <div class="job-period">${exp.period}</div>
      </div>
      <ul>
        ${exp.achievements.map((achievement: string) => `<li>${achievement}</li>`).join('')}
      </ul>
      ${exp.skills && exp.skills.length > 0 ? `<p><strong>Technologies:</strong> ${exp.skills.join(', ')}</p>` : ''}
    </div>`
        )
        .join('')}
  </div>`
      : ''
    }
  
    }

  <!-- Projects -->
  ${projects.length > 0
      ? `<div class="section">
    <h2>Key Projects</h2>
    ${projects
        .map(
          (proj) => `
    <div style="margin-bottom: 8pt;">
      <div class="job-header">
        <span class="job-title">${proj.title}</span>
      </div>
      <p>${proj.description}</p>
      <ul>
        ${proj.highlights.map((h: string) => `<li>${h}</li>`).join('')}
      </ul>
      ${proj.impact ? `<p><strong>Impact:</strong> ${proj.impact}</p>` : ''}
    </div>`
        )
        .join('')}
  </div>`
      : ''
    }

  <!-- Technical Skills -->
  ${skills.length > 0
      ? `<div class="section">
    <h2>Technical Skills</h2>
    <div class="skills-list">
      <p>${skills.map((s) => s.name).join(', ')}</p>
    </div>
  </div>`
      : ''
    }
  
  <!-- Tools & Technologies -->
  ${tools.length > 0
      ? `<div class="section">
    <h2>Tools & Technologies</h2>
    <div class="skills-list">
      <p>${tools.map((t) => t.name).join(', ')}</p>
    </div>
  </div>`
      : ''
    }
  
  <!-- Education -->
  ${education.length > 0
      ? `<div class="section">
    <h2>Education</h2>
    ${education
        .map(
          (edu) => `
    <div style="margin-bottom: 6pt;">
      <h3>${edu.degree}</h3>
      <p>${edu.institution}${edu.field ? ` - ${edu.field}` : ''}${edu.year ? ` (${edu.year})` : ''}</p>
    </div>`
        )
        .join('')}
  </div>`
      : ''
    }
  
  <!-- Certifications -->
  ${certifications.length > 0
      ? `<div class="section">
    <h2>Certifications</h2>
    <ul>
      ${certifications.map((cert) => `<li>${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}</li>`).join('')}
    </ul>
  </div>`
      : ''
    }
  
  <script>
    // Auto-open print dialog for easy PDF saving
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;
}
