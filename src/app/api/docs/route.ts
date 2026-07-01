import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DOCS_ROOT = path.join(process.cwd(), 'docs');

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get('category');

  if (!category) {
    try {
      const entries = fs.readdirSync(DOCS_ROOT, { withFileTypes: true });
      const categories = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);
      return NextResponse.json({ categories });
    } catch {
      return NextResponse.json({ categories: [] });
    }
  }

  const safeName = category.replace(/[^a-zA-Z0-9_-]/g, '');
  const categoryDir = path.join(DOCS_ROOT, safeName);

  if (!fs.existsSync(categoryDir)) {
    return NextResponse.json({ files: [] });
  }

  try {
    const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
    const files = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => {
        const filePath = path.join(categoryDir, e.name);
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
          name: e.name.replace(/\.md$/, '').replace(/-/g, ' '),
          filename: e.name,
          path: `docs/${safeName}/${e.name}`,
          content,
        };
      });

    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ files: [] });
  }
}
