import React from 'react';
import { motion } from 'framer-motion';
import { TableContent } from '@/types/lessonContent';

interface TableBlockProps {
  data: TableContent | any;
}

export const TableBlock: React.FC<TableBlockProps> = ({ data }) => {
  // Normalize data structure from database format
  const normalizedData: TableContent = {
    headers: Array.isArray(data?.headers) ? data.headers : [],
    rows: Array.isArray(data?.rows) ? data.rows : []
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full overflow-x-auto"
    >
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                {normalizedData.headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-4 text-left text-sm font-semibold text-foreground"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {normalizedData.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 text-sm text-muted-foreground whitespace-normal"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
