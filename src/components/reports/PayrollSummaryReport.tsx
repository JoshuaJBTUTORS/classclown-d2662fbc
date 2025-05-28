
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { calculateTutorPayroll, TutorPayrollData } from '@/services/salaryCalculationService';
import { format } from 'date-fns';

interface PayrollSummaryReportProps {
  filters: {
    dateRange: { from: Date | null; to: Date | null };
    selectedTutors: string[];
    selectedSubjects: string[];
  };
}

const PayrollSummaryReport: React.FC<PayrollSummaryReportProps> = ({ filters }) => {
  const [data, setData] = useState<TutorPayrollData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayrollData();
  }, [filters]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const payrollData = await calculateTutorPayroll(filters);
      setData(payrollData);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Tutor Name', 
      'Normal Hours', 
      'Normal Rate (£/hr)', 
      'Normal Pay (£)',
      'Absence Hours', 
      'Absence Rate (£/hr)', 
      'Absence Pay (£)',
      'Total Hours',
      'Total Pay (£)',
      'Lessons Completed',
      'Absence Lessons'
    ];
    
    const csvRows = [];
    
    // Add header
    csvRows.push(headers.join(','));
    
    // Add summary row
    const totalNormalPay = data.reduce((sum, tutor) => sum + tutor.normal_pay, 0);
    const totalAbsencePay = data.reduce((sum, tutor) => sum + tutor.absence_pay, 0);
    const totalPay = data.reduce((sum, tutor) => sum + tutor.total_pay, 0);
    const totalHours = data.reduce((sum, tutor) => sum + tutor.normal_hours + tutor.absence_hours, 0);
    
    csvRows.push([
      'TOTAL PAYROLL',
      data.reduce((sum, tutor) => sum + tutor.normal_hours, 0).toFixed(1),
      '',
      totalNormalPay.toFixed(2),
      data.reduce((sum, tutor) => sum + tutor.absence_hours, 0).toFixed(1),
      '',
      totalAbsencePay.toFixed(2),
      totalHours.toFixed(1),
      totalPay.toFixed(2),
      data.reduce((sum, tutor) => sum + tutor.lessons_completed, 0),
      data.reduce((sum, tutor) => sum + tutor.absence_lesson_count, 0)
    ].join(','));
    
    csvRows.push(''); // Empty row
    
    // Add data rows
    data.forEach(tutor => {
      csvRows.push([
        tutor.tutor_name,
        tutor.normal_hours,
        tutor.normal_hourly_rate.toFixed(2),
        tutor.normal_pay.toFixed(2),
        tutor.absence_hours,
        tutor.absence_hourly_rate.toFixed(2),
        tutor.absence_pay.toFixed(2),
        (tutor.normal_hours + tutor.absence_hours).toFixed(1),
        tutor.total_pay.toFixed(2),
        tutor.lessons_completed,
        tutor.absence_lesson_count
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPay = data.reduce((sum, tutor) => sum + tutor.total_pay, 0);
  const totalHours = data.reduce((sum, tutor) => sum + tutor.normal_hours + tutor.absence_hours, 0);
  const totalLessons = data.reduce((sum, tutor) => sum + tutor.lessons_completed, 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>Loading payroll data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#e94b7f]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>
            Complete salary calculations for all tutors including normal and absence pay rates
            {data.length > 0 && (
              <span className="block mt-1 text-green-600 font-medium">
                Total payroll: £{totalPay.toFixed(2)} for {Math.round(totalHours * 10) / 10}h across {totalLessons} lessons ({data.length} tutors)
              </span>
            )}
          </CardDescription>
        </div>
        {data.length > 0 && (
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Payroll CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead className="text-right">Normal Hours</TableHead>
                <TableHead className="text-right">Normal Pay</TableHead>
                <TableHead className="text-right">Absence Hours</TableHead>
                <TableHead className="text-right">Absence Pay</TableHead>
                <TableHead className="text-right">Total Pay</TableHead>
                <TableHead className="text-right">Lessons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tutor) => (
                <TableRow key={tutor.tutor_id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{tutor.tutor_name}</div>
                      <div className="text-sm text-gray-500">
                        £{tutor.normal_hourly_rate}/hr | £{tutor.absence_hourly_rate}/hr (absence)
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="text-green-600 border-green-200">
                      {tutor.normal_hours}h
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-green-600">
                      £{tutor.normal_pay.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {tutor.absence_hours}h
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-orange-600">
                      £{tutor.absence_pay.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="default" className="bg-[#e94b7f] text-white text-base px-3 py-1">
                      £{tutor.total_pay.toFixed(2)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-sm">
                      <div>{tutor.lessons_completed} total</div>
                      {tutor.absence_lesson_count > 0 && (
                        <div className="text-orange-600">{tutor.absence_lesson_count} absent</div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-400">No payroll data available</p>
            <p className="text-sm text-gray-400 mt-1">for the selected filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PayrollSummaryReport;
