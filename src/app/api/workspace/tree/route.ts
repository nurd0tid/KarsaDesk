import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getRecord } from '@/lib/nocodb';
import type { Project } from '@/types';

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.vscode',
  '.idea'
]);

async function buildFileTree(
  dirPath: string,
  currentDepth: number,
  maxDepth: number
): Promise<FileNode[]> {
  if (currentDepth > maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    // Sort entries: directories first, then files, both alphabetically
    const sortedEntries = entries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    const nodes: FileNode[] = [];

    for (const entry of sortedEntries) {
      if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.env')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      
      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        isDirectory: entry.isDirectory(),
      };

      if (entry.isDirectory()) {
        node.children = await buildFileTree(fullPath, currentDepth + 1, maxDepth);
      }

      nodes.push(node);
    }

    return nodes;
  } catch (error) {
    console.error(`Failed to read directory ${dirPath}:`, error);
    return []; // Return empty array for inaccessible directories
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    let targetPath = searchParams.get('path');
    const projectId = searchParams.get('projectId');
    
    // Default max depth
    const maxDepth = searchParams.get('depth') ? Number(searchParams.get('depth')) : 3;

    if (!targetPath && projectId) {
      // Try to get path from project
      try {
        const project = await getRecord<Project>('projects', Number(projectId));
        if (project.local_path) {
          targetPath = project.local_path;
        }
      } catch {
        console.warn(`Could not fetch project ${projectId} to resolve path`);
      }
    }

    if (!targetPath) {
      return NextResponse.json({ error: 'Either path or projectId is required' }, { status: 400 });
    }

    const resolvedPath = path.resolve(targetPath);

    try {
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        return NextResponse.json({ error: 'Path is not a directory' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Directory not found or inaccessible' }, { status: 404 });
    }

    const tree = await buildFileTree(resolvedPath, 1, maxDepth);
    
    return NextResponse.json(tree);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
