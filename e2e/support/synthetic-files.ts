import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TestInfo } from '@playwright/test';

const ONE_PIXEL_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

export async function createSyntheticPdf(testInfo: TestInfo, marker: string): Promise<string> {
  const path = testInfo.outputPath(`fixtures/${marker}.pdf`);
  await mkdir(dirname(path), { recursive: true });
  const padding = `\n% ${marker} `.repeat(1_500);
  await writeFile(
    path,
    `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n${padding}\n%%EOF\n`,
  );
  return path;
}

export async function createSyntheticPng(testInfo: TestInfo, marker: string): Promise<string> {
  const path = testInfo.outputPath(`fixtures/${marker}.png`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, Buffer.from(ONE_PIXEL_PNG, 'base64'));
  return path;
}
