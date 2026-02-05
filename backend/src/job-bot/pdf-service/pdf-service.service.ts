import { Injectable } from '@nestjs/common';
// import * as pdf from 'pdf-parse';
// import * as fs from 'fs';
// import * as path from 'path';

@Injectable()
export class PdfServiceService {
  /**
   * Parses a PDF directly from a file path
   * @param filePath The absolute or relative path to the resume.pdf
   */
  // async parsePdfFromPath(filePath: string) {
  //   try {
  //     // 1. Resolve the path and check if file exists
  //     const absolutePath = path.resolve(filePath);
  //     if (!fs.existsSync(absolutePath)) {
  //       throw new Error(`Resume not found at path: ${absolutePath}`);
  //     }
  //     // 2. Read the file into a Buffer
  //     const dataBuffer = fs.readFileSync(absolutePath);
  //     // 3. Parse the PDF content (Non-AI)
  //     const data = await pdf(dataBuffer);
  //     const text = data.text;
  //     // 4. Extract data using the Logic from before
  //     return this.extractDetails(text);
  //   } catch (error) {
  //     console.error('Error reading PDF file:', error.message);
  //     throw error;
  //   }
  // }
  // private extractDetails(text: string) {
  //   // Basic Regex for Contact Info
  //   const email =
  //     text.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/)?.[0] || 'Not found';
  //   // Keyword Matching (High Efficiency)
  //   const skills = [
  //     'React',
  //     'Node.js',
  //     'TypeScript',
  //     'NestJS',
  //     'PostgreSQL',
  //     'AWS',
  //     'Docker',
  //   ];
  //   const foundSkills = skills.filter((skill) =>
  //     new RegExp(`\\b${skill}\\b`, 'i').test(text),
  //   );
  //   // Domain Detection Logic
  //   const domain = foundSkills.some((s) => ['React', 'Frontend'].includes(s))
  //     ? 'Frontend'
  //     : 'Backend';
  //   return {
  //     success: true,
  //     email,
  //     skills: foundSkills,
  //     domain,
  //     fullText: text, // We keep this to pass to the Job Bot later
  //   };
  // }
}
