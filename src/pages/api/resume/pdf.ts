import type { APIRoute } from 'astro';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { useProfileData } from '../../../hooks/useProfileData';

/**
 * Server-side PDF Resume Generation
 * 
 * Features:
 * - ATS-friendly single-column layout
 * - No icons, no tables
 * - Semantic structure
 * - Uses ONLY live (published) data
 * - Auto-syncs with portfolio changes
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    // Fetch ONLY live data (published content)
    const data = await useProfileData({ cacheKey: 'resume-pdf-live' });

    if (!data.profile) {
      return new Response(JSON.stringify({ 
        error: 'Profile not found',
        message: 'No published profile data available. Please publish from admin dashboard.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const profile = data.profile;
    const experiences = data.experiences || [];
    const skills = data.technicalSkills || [];
    const softSkills = data.softSkills || [];
    const certifications = data.certifications || [];
    const education = data.education || [];
    const projects = data.projects || [];

    // Create PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Page setup
    const pageWidth = 612; // Letter size
    const pageHeight = 792;
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;
    const lineHeight = 14;
    const sectionGap = 20;

    // Helper functions
    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (y - requiredSpace < margin) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
    };

    const drawText = (text: string, x: number, fontSize: number, font: any, color = rgb(0, 0, 0)) => {
      page.drawText(text, { x, y, size: fontSize, font, color });
      y -= fontSize + 4;
    };

    const drawWrappedText = (text: string, x: number, fontSize: number, font: any, maxWidth: number) => {
      const words = text.split(' ');
      let line = '';
      
      for (const word of words) {
        const testLine = line + word + ' ';
        const width = font.widthOfTextAtSize(testLine, fontSize);
        
        if (width > maxWidth && line !== '') {
          addNewPageIfNeeded(lineHeight);
          page.drawText(line.trim(), { x, y, size: fontSize, font });
          y -= lineHeight;
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim()) {
        addNewPageIfNeeded(lineHeight);
        page.drawText(line.trim(), { x, y, size: fontSize, font });
        y -= lineHeight;
      }
    };

    const drawSectionHeader = (title: string) => {
      addNewPageIfNeeded(40);
      y -= sectionGap;
      
      // Draw section title
      page.drawText(title.toUpperCase(), {
        x: margin,
        y,
        size: 12,
        font: helveticaBold,
      });
      y -= 4;
      
      // Draw underline
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 12;
    };

    // === HEADER ===
    // Name
    page.drawText(profile.name.toUpperCase(), {
      x: margin,
      y,
      size: 20,
      font: helveticaBold,
    });
    y -= 24;

    // Role
    page.drawText(profile.role, {
      x: margin,
      y,
      size: 11,
      font: helvetica,
    });
    y -= 16;

    // Contact info
    const contactInfo = `${profile.location} | ${profile.years_experience} Years Experience`;
    page.drawText(contactInfo, {
      x: margin,
      y,
      size: 10,
      font: helvetica,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 20;

    // === PROFESSIONAL SUMMARY ===
    if (profile.tagline) {
      drawSectionHeader('Professional Summary');
      drawWrappedText(profile.tagline, margin, 10, timesRoman, contentWidth);
    }

    // === EXPERIENCE ===
    if (experiences.length > 0) {
      drawSectionHeader('Professional Experience');
      
      for (const exp of experiences) {
        addNewPageIfNeeded(80);
        
        // Job title and company
        page.drawText(`${exp.role} - ${exp.company}`, {
          x: margin,
          y,
          size: 11,
          font: helveticaBold,
        });
        
        // Period (right-aligned)
        const periodWidth = helvetica.widthOfTextAtSize(exp.period, 10);
        page.drawText(exp.period, {
          x: pageWidth - margin - periodWidth,
          y,
          size: 10,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
        y -= 16;

        // Achievements
        for (const achievement of exp.achievements) {
          addNewPageIfNeeded(lineHeight * 2);
          
          // Bullet point
          const bulletText = `• ${achievement}`;
          drawWrappedText(bulletText, margin + 10, 10, timesRoman, contentWidth - 10);
        }

        // Skills used
        if (exp.skills && exp.skills.length > 0) {
          addNewPageIfNeeded(lineHeight);
          const skillsText = `Technologies: ${exp.skills.join(', ')}`;
          page.drawText(skillsText, {
            x: margin + 10,
            y,
            size: 9,
            font: timesRoman,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= lineHeight;
        }

        y -= 8; // Gap between jobs
      }
    }

    // === PROJECTS ===
    if (projects.length > 0) {
      drawSectionHeader('Key Projects');
      
      for (const project of projects.slice(0, 4)) { // Limit to top 4
        addNewPageIfNeeded(60);
        
        page.drawText(project.title, {
          x: margin,
          y,
          size: 11,
          font: helveticaBold,
        });
        y -= 14;

        drawWrappedText(project.description, margin + 10, 10, timesRoman, contentWidth - 10);
        
        if (project.impact) {
          page.drawText(`Impact: ${project.impact}`, {
            x: margin + 10,
            y,
            size: 9,
            font: timesRoman,
            color: rgb(0.2, 0.4, 0.2),
          });
          y -= lineHeight;
        }
        
        y -= 6;
      }
    }

    // === SKILLS ===
    if (skills.length > 0 || softSkills.length > 0) {
      drawSectionHeader('Skills');
      
      if (skills.length > 0) {
        addNewPageIfNeeded(lineHeight * 2);
        const technicalText = `Technical: ${skills.map(s => s.name).join(', ')}`;
        drawWrappedText(technicalText, margin, 10, timesRoman, contentWidth);
      }
      
      if (softSkills.length > 0) {
        addNewPageIfNeeded(lineHeight * 2);
        const softText = `Professional: ${softSkills.map(s => s.name).join(', ')}`;
        drawWrappedText(softText, margin, 10, timesRoman, contentWidth);
      }
    }

    // === CERTIFICATIONS ===
    if (certifications.length > 0) {
      drawSectionHeader('Certifications');
      
      for (const cert of certifications) {
        addNewPageIfNeeded(lineHeight);
        page.drawText(`• ${cert.name}`, {
          x: margin,
          y,
          size: 10,
          font: timesRoman,
        });
        y -= lineHeight;
      }
    }

    // === EDUCATION ===
    if (education.length > 0) {
      drawSectionHeader('Education');
      
      for (const edu of education) {
        addNewPageIfNeeded(30);
        
        page.drawText(edu.degree, {
          x: margin,
          y,
          size: 11,
          font: helveticaBold,
        });
        y -= 14;

        page.drawText(`${edu.institution} - ${edu.field || ''} (${edu.year})`, {
          x: margin,
          y,
          size: 10,
          font: timesRoman,
        });
        y -= lineHeight + 4;
      }
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();

    // Return PDF with proper headers
    const filename = `${profile.name.replace(/\s+/g, '_')}_Resume.pdf`;
    
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      }
    });

  } catch (error: any) {
    console.error('PDF Resume generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate PDF resume',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
