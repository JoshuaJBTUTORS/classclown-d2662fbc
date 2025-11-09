export interface CurriculumCsvRow {
  moduleOrder: number;
  moduleTitle: string;
  moduleDescription: string;
  lessonOrder: number;
  lessonTitle: string;
  lessonDescription: string;
  learningObjectives: string[];
}

export interface ParsedModule {
  title: string;
  description: string;
  order: number;
  lessons: Array<{
    title: string;
    description: string;
    order: number;
    objectives: string[];
  }>;
}

export interface ParsedCurriculumData {
  modules: ParsedModule[];
}

// CSV template for download
const CSV_TEMPLATE = `Module Order,Module Title,Module Description,Lesson Order,Lesson Title,Lesson Description,Learning Objectives
1,Number Systems,Introduction to numbers and place value,1,Place Value,Understanding place value in large numbers,"Understand place value up to 1000000|Identify the value of each digit|Compare and order large numbers"
1,Number Systems,Introduction to numbers and place value,2,Rounding Numbers,Learn to round numbers to different degrees,"Round to nearest 10, 100, 1000|Apply rounding in real contexts|Estimate calculations"
2,Algebra Basics,Introduction to algebraic thinking,1,Variables and Expressions,Understanding variables in algebra,"Use letters to represent numbers|Form simple expressions|Substitute values into expressions"
2,Algebra Basics,Introduction to algebraic thinking,2,Solving Equations,Basic equation solving techniques,"Solve one-step equations|Solve two-step equations|Check solutions"`;

/**
 * Parse a CSV string into structured curriculum data
 */
export function parseCurriculumCsv(csvText: string): ParsedCurriculumData {
  const lines = csvText.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }

  const header = lines[0];
  const expectedHeaders = [
    'Module Order',
    'Module Title',
    'Module Description',
    'Lesson Order',
    'Lesson Title',
    'Lesson Description',
    'Learning Objectives'
  ];

  // Parse CSV line handling quoted values
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const headerColumns = parseCsvLine(header);
  
  // Validate headers
  const normalizedHeaders = headerColumns.map(h => h.trim());
  const missingHeaders = expectedHeaders.filter(
    expected => !normalizedHeaders.some(h => h.toLowerCase() === expected.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
  }

  // Parse data rows
  const rows: CurriculumCsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCsvLine(line);
    
    if (values.length !== expectedHeaders.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${expectedHeaders.length}`);
    }

    const moduleOrder = parseInt(values[0]);
    const lessonOrder = parseInt(values[3]);

    if (isNaN(moduleOrder)) {
      throw new Error(`Row ${i + 1}: Module Order must be a number`);
    }
    if (isNaN(lessonOrder)) {
      throw new Error(`Row ${i + 1}: Lesson Order must be a number`);
    }

    // Parse learning objectives (pipe-separated)
    const objectivesText = values[6].replace(/^"|"$/g, ''); // Remove surrounding quotes
    const objectives = objectivesText
      .split('|')
      .map(obj => obj.trim())
      .filter(obj => obj.length > 0);

    rows.push({
      moduleOrder,
      moduleTitle: values[1],
      moduleDescription: values[2],
      lessonOrder,
      lessonTitle: values[4],
      lessonDescription: values[5],
      learningObjectives: objectives
    });
  }

  if (rows.length === 0) {
    throw new Error('No valid data rows found in CSV');
  }

  // Group rows by module
  const moduleMap = new Map<string, ParsedModule>();

  for (const row of rows) {
    const moduleKey = `${row.moduleOrder}-${row.moduleTitle}`;
    
    if (!moduleMap.has(moduleKey)) {
      moduleMap.set(moduleKey, {
        title: row.moduleTitle,
        description: row.moduleDescription,
        order: row.moduleOrder,
        lessons: []
      });
    }

    const module = moduleMap.get(moduleKey)!;
    module.lessons.push({
      title: row.lessonTitle,
      description: row.lessonDescription,
      order: row.lessonOrder,
      objectives: row.learningObjectives
    });
  }

  // Convert to array and sort
  const modules = Array.from(moduleMap.values())
    .sort((a, b) => a.order - b.order);

  // Sort lessons within each module
  modules.forEach(module => {
    module.lessons.sort((a, b) => a.order - b.order);
  });

  return { modules };
}

/**
 * Generate a CSV template string
 */
export function generateCurriculumCsvTemplate(): string {
  return CSV_TEMPLATE;
}

/**
 * Download the CSV template file
 */
export function downloadCurriculumCsvTemplate(): void {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'curriculum-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
