import { NextResponse } from 'next/server';
import { syncPDFToJsonFiles, findResumePDF, parseResumePDF } from '@/lib/pdf-parser';

/**
 * GET /api/parse-resume — Check PDF resume status
 */
export async function GET() {
  try {
    const pdfPath = findResumePDF();

    if (!pdfPath) {
      return NextResponse.json({
        found: false,
        message: 'No PDF resume found in /public. Place a file with "resume" in the name (e.g. Seth_DeWhitt_Resume.pdf).',
      }, { status: 404 });
    }

    return NextResponse.json({
      found: true,
      pdfPath: pdfPath.replace(process.cwd(), ''),
      message: 'PDF resume found. Send a POST request to parse and sync.',
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/parse-resume — Parse PDF and sync to JSON data files
 * 
 * Query params:
 *   ?merge=false  — Overwrite JSON files instead of merging (default: merge)
 *   ?preview=true — Return parsed data without writing files
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const merge = searchParams.get('merge') !== 'false';
    const preview = searchParams.get('preview') === 'true';

    const pdfPath = findResumePDF();
    if (!pdfPath) {
      return NextResponse.json({
        error: 'No PDF resume found in /public.',
      }, { status: 404 });
    }

    if (preview) {
      // Parse but don't write
      const parsed = await parseResumePDF(pdfPath);
      return NextResponse.json({
        success: true,
        preview: true,
        data: {
          name: parsed.name,
          contact: parsed.contact,
          experienceCount: parsed.experience.length,
          educationCount: parsed.education.length,
          skillCategories: Object.keys(parsed.skills),
          projectCount: parsed.projects.length,
          experience: parsed.experience,
          education: parsed.education,
          skills: parsed.skills,
          projects: parsed.projects,
        },
      });
    }

    // Parse and write
    const parsed = await syncPDFToJsonFiles({ pdfPath, merge });

    return NextResponse.json({
      success: true,
      merge,
      summary: {
        name: parsed.name,
        experienceCount: parsed.experience.length,
        educationCount: parsed.education.length,
        skillCategories: Object.keys(parsed.skills).length,
        projectCount: parsed.projects.length,
      },
      message: `Parsed PDF and ${merge ? 'merged' : 'wrote'} data to career.json, education.json, and resume.json. Run a content sync to update embeddings.`,
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
