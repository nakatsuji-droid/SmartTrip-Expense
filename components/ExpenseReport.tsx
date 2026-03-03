import React, { useEffect, useState } from 'react';
import { ExpenseItem, ExpenseCategory, UserProfile } from '../types';
import { Printer, Download, Loader2 } from 'lucide-react';

// Declare html2pdf for TypeScript
declare var html2pdf: any;

interface ExpenseReportProps {
  expenses: ExpenseItem[];
  userProfile: UserProfile;
  onBack: () => void;
}

export const ExpenseReport: React.FC<ExpenseReportProps> = ({ expenses, userProfile, onBack }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Sort expenses by date
  const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Determine Report Month (YYYY-MM) for filename
  let reportMonthStr = new Date().toISOString().slice(0, 7);
  if (sortedExpenses.length > 0) {
    reportMonthStr = sortedExpenses[0].date.slice(0, 7);
  }
  const pdfFileName = `出張経費精算書_${reportMonthStr}_${userProfile.name}`;

  // Set document title for PDF filename (fallback for print)
  useEffect(() => {
    const originalTitle = document.title;
    document.title = pdfFileName;
    return () => {
      document.title = originalTitle;
    };
  }, [pdfFileName]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    const element = document.getElementById('printable-area');
    
    // Configure html2pdf options
    const opt = {
      margin: 0, // We handle margins via CSS padding in the container
      filename: `${pdfFileName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Generate and save
    html2pdf().set(opt).from(element).save().then(() => {
      setIsGenerating(false);
    }).catch((err: any) => {
      console.error('PDF Generation Error:', err);
      setIsGenerating(false);
      alert('PDF生成に失敗しました。印刷ボタンをお試しください。');
    });
  };

  // Derive summary info
  const totalAmount = sortedExpenses.reduce((sum, item) => sum + item.amount, 0);
  
  // Actual Cost Total (実費合計): Only Transportation
  const actualCostTotal = sortedExpenses.reduce((sum, item) => {
    if (item.category === ExpenseCategory.TRANSPORTATION) {
      return sum + item.amount;
    }
    return sum;
  }, 0);

  const settlementAmount = totalAmount; // Settlement amount is the full total

  // Calculate Application Date (End of the month of the trip)
  let applicationDateStr = new Date().toLocaleDateString('ja-JP');
  if (sortedExpenses.length > 0) {
    const firstDate = new Date(sortedExpenses[0].date);
    const lastDayOfMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0);
    applicationDateStr = lastDayOfMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  // Unique destinations for the header
  const destinations = Array.from(new Set(sortedExpenses.map(e => {
    return e.description.replace('（支援）', '').replace('様', '');
  }))).join('、');

  // Trip dates formatted
  const tripDates = sortedExpenses.map(e => {
    const d = new Date(e.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }).join('，');

  // Fill empty rows
  const rowsToRender = [...sortedExpenses];
  const minRows = 12;
  while (rowsToRender.length < minRows) {
    rowsToRender.push({
      id: `placeholder-${rowsToRender.length}`,
      userId: '',
      date: '',
      category: ExpenseCategory.OTHER,
      amount: 0,
      description: '',
      transportMethod: '',
    });
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-12 relative z-0">
      {/* Explicit Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print max-w-4xl mx-auto px-4 py-4 flex justify-between items-center relative z-50">
        <button 
          type="button"
          onClick={onBack}
          className="cursor-pointer px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium active:scale-95 transition-transform"
        >
          ← 戻る
        </button>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={handlePrint}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium shadow-sm active:scale-95 transition-transform"
          >
            <Printer size={16} />
            印刷
          </button>
          <button 
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm active:scale-95 transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            PDFダウンロード
          </button>
        </div>
      </div>

      {/* Report Preview */}
      <div id="printable-area" className="max-w-[210mm] mx-auto bg-white p-[10mm] shadow-lg print:shadow-none print:p-0 print:w-full print:max-w-none relative z-10">
        <div className="text-black print:text-black font-serif text-sm">
          
          <div className="text-right mb-4 !text-black">No. ____________</div>
          
          <h1 className="text-2xl font-bold text-center mb-8 tracking-widest border-b-2 border-transparent !text-black">出張経費精算書</h1>

          {/* Header Section */}
          <div className="flex justify-between items-end mb-4 border-b !border-black pb-2">
            <div className="space-y-2 !text-black">
               <div>申請日： {applicationDateStr}</div>
               <div>申請者： {userProfile.name}</div>
            </div>
            <div className="border !border-black w-48 h-16 flex">
               <div className="flex-1 border-r !border-black"></div>
               <div className="flex-1 border-r !border-black"></div>
               <div className="flex-1"></div>
            </div>
          </div>

          <p className="mb-2 !text-black">出張経費について下記の通り申請致します</p>

          {/* Summary Box */}
          <table className="w-full border-collapse border !border-black mb-6 !text-black">
            <thead className="bg-gray-200 print:bg-gray-200">
               <tr>
                 <th colSpan={2} className="border !border-black py-1 font-bold !text-black">出張内容</th>
               </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border !border-black p-1 w-24 bg-gray-100 print:bg-gray-100 font-medium !text-black">出張先</td>
                <td className="border !border-black p-1 !text-black">{destinations}</td>
              </tr>
              <tr>
                <td className="border !border-black p-1 bg-gray-100 print:bg-gray-100 font-medium !text-black">出張期間</td>
                <td className="border !border-black p-1 !text-black">{tripDates}</td>
              </tr>
              <tr>
                <td className="border !border-black p-1 bg-gray-100 print:bg-gray-100 font-medium !text-black">出張目的</td>
                <td className="border !border-black p-1 !text-black">商談、営業、支援</td>
              </tr>
            </tbody>
          </table>

          {/* Detail Table */}
          <table className="w-full border-collapse border !border-black text-center mb-0 !text-black">
            <thead>
              <tr className="bg-gray-200 print:bg-gray-200">
                <th colSpan={7} className="border !border-black py-1 !text-black">出張旅費内訳</th>
              </tr>
              <tr className="bg-gray-100 print:bg-gray-100 text-xs">
                <th className="border !border-black p-1 w-24 !text-black">日付</th>
                <th className="border !border-black p-1 !text-black">訪問先</th>
                <th className="border !border-black p-1 w-20 !text-black">交通手段</th>
                <th className="border !border-black p-1 w-24 !text-black">交通費</th>
                <th className="border !border-black p-1 w-24 !text-black">宿泊費</th>
                <th className="border !border-black p-1 w-24 !text-black">日当</th>
                <th className="border !border-black p-1 w-24 !text-black">計</th>
              </tr>
            </thead>
            <tbody>
              {rowsToRender.map((item, index) => {
                const d = item.date ? new Date(item.date) : null;
                const dateStr = d ? `${d.getMonth() + 1}月${d.getDate()}日` : '';
                
                let transportCost = '';
                let accomCost = '';
                let dailyAllowance = '';

                if (item.amount > 0) {
                  if (item.category === ExpenseCategory.ACCOMMODATION) {
                    accomCost = item.amount.toLocaleString();
                  } else if (item.category === ExpenseCategory.ALLOWANCE) {
                    dailyAllowance = item.amount.toLocaleString();
                  } else if (item.category === ExpenseCategory.TRANSPORTATION) {
                    transportCost = item.amount.toLocaleString();
                  } else {
                    transportCost = item.amount.toLocaleString();
                  }
                }

                return (
                  <tr key={item.id} className="h-8">
                    <td className="border !border-black p-1 !text-black">{dateStr}</td>
                    <td className="border !border-black p-1 text-left px-2 !text-black">{item.description}</td>
                    <td className="border !border-black p-1 !text-black">{item.transportMethod}</td>
                    <td className="border !border-black p-1 text-right px-2 !text-black">{transportCost}</td>
                    <td className="border !border-black p-1 text-right px-2 !text-black">{accomCost}</td>
                    <td className="border !border-black p-1 text-right px-2 !text-black">{dailyAllowance}</td>
                    <td className="border !border-black p-1 text-right px-2 !text-black">{item.amount > 0 ? item.amount.toLocaleString() : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals Section */}
          <div className="flex justify-end mt-0">
             <table className="border-collapse border border-t-0 !border-black w-64 text-center !text-black">
                <tbody>
                   <tr>
                      <td className="border !border-black p-1 bg-gray-100 print:bg-gray-100 w-24 font-medium !text-black">実費合計</td>
                      <td className="border !border-black p-1 font-bold !text-black">¥{actualCostTotal.toLocaleString()}</td>
                   </tr>
                   <tr>
                      <td className="border !border-black p-1 bg-gray-100 print:bg-gray-100 font-medium !text-black">仮払金額</td>
                      <td className="border !border-black p-1 !text-black">0</td>
                   </tr>
                   <tr>
                      <td className="border !border-black p-1 bg-gray-100 print:bg-gray-100 font-bold !text-black">精算額</td>
                      <td className="border !border-black p-1 font-bold !text-black">¥{settlementAmount.toLocaleString()}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* Remarks */}
          <div className="mt-4 border !border-black min-h-[100px] !text-black">
             <div className="bg-gray-200 print:bg-gray-200 border-b !border-black p-1 text-center font-bold text-sm !text-black">備　考</div>
             <div className="p-2 !text-black"></div>
          </div>

        </div>
      </div>
    </div>
  );
};