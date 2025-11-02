export interface CsvRow {
  topic: string;
  description?: string;
  prompt: string;
}

export function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const topicIndex = headers.indexOf('topic');
  const descIndex = headers.indexOf('description');
  const promptIndex = headers.indexOf('prompt');

  if (topicIndex === -1 || promptIndex === -1) {
    throw new Error('CSV must have "Topic" and "Prompt" columns');
  }

  // Parse data rows
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    
    if (values.length < Math.max(topicIndex, promptIndex) + 1) {
      continue; // Skip incomplete rows
    }

    const topic = values[topicIndex]?.trim();
    const prompt = values[promptIndex]?.trim();

    if (topic && prompt) {
      rows.push({
        topic,
        description: descIndex !== -1 ? values[descIndex]?.trim() : undefined,
        prompt,
      });
    }
  }

  return rows;
}

// Handle CSV values that may contain commas within quotes
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  values.push(current.trim());
  return values.map(v => v.replace(/^"|"$/g, '')); // Remove surrounding quotes
}

export function generateCsvTemplate(): string {
  return `Topic,Description,Prompt
"Algebra - Quadratic Equations","Solving quadratic equations","Create 20 questions about solving quadratic equations including factoring, completing the square, and using the quadratic formula"
"Algebra - Linear Equations","Solving linear equations","Create 20 questions about solving linear equations with one variable, including word problems"
"Geometry - Angles","Angle properties","Create 20 questions about angle properties in triangles, parallel lines, and polygons"`;
}

export function downloadCsvTemplate() {
  const content = generateCsvTemplate();
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'assessment-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
