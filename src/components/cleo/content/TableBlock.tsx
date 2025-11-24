import React from 'react';
import { motion } from 'framer-motion';
import { TableContent } from '@/types/lessonContent';
import { ContentActionButtons } from './ContentActionButtons';
import { LatexRenderer } from '../LatexRenderer';

interface TableBlockProps {
  data: TableContent;
  onContentAction?: (action: string, message: string) => void;
}

export const TableBlock: React.FC<TableBlockProps> = ({ data, onContentAction }) => {
  // Safety check: ensure headers and rows exist
  const headers = data?.headers || [];
  const rows = data?.rows || [];

  if (headers.length === 0 && rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full p-4 border border-border rounded-lg bg-muted/50"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xl">📊</span>
          <span className="text-sm">Table data is loading...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full overflow-x-auto"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">📊</span>
        <span className="text-sm font-medium text-muted-foreground">Table</span>
      </div>
      
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-4 text-left text-sm font-semibold text-foreground"
                  >
                    <LatexRenderer content={header} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors"
                >
                  {(row || []).map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-6 py-4 text-sm text-muted-foreground whitespace-normal"
                    >
                      <LatexRenderer content={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {onContentAction && headers.length > 0 && (
        <ContentActionButtons
          contentId={`table-${headers.join('-').toLowerCase().replace(/\s+/g, '-')}`}
          contentTitle={headers.length > 0 ? headers[0] : 'Table'}
          onActionClick={onContentAction}
        />
      )}
    </motion.div>
  );
};
