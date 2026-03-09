import React, { useEffect, useState } from 'react';
import { ExpenseItem, ExpenseCategory, UserProfile } from '../types';
import { Printer, Download, Loader2 } from 'lucide-react';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const safeReportMonthStr = reportMonthStr.replace(/\//g, '-');
  const pdfFileName = `出張経費精算書_${safeReportMonthStr}_${userProfile.name}`;

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

    setTimeout(async () => {
      try {
        const pages = document.querySelectorAll('.pdf-page');
        if (pages.length === 0) {
          setIsGenerating(false);
          return;
        }

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();

        for (let i = 0; i < pages.length; i++) {
          const canvas = await html2canvas(pages[i] as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL('image/jpeg', 0.98);
          // Scale height proportionally to fit the A4 width
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

          if (i > 0) {
            pdf.addPage();
          }
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        }

        pdf.save(`${pdfFileName}.pdf`);
      } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('PDF生成に失敗しました。印刷ボタンをお試しください。');
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  // Derive summary info
  const totalAmount = sortedExpenses.reduce((sum, item) => sum + item.amount, 0);

  // Actual Cost Total (実費合計): Transportation + Accommodation
  const actualCostTotal = sortedExpenses.reduce((sum, item) => {
    if (item.category === ExpenseCategory.TRANSPORTATION || item.category === ExpenseCategory.ACCOMMODATION) {
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

  // ページ分割設定
  const ITEMS_P1 = 20; // 1ページ目は出張内容があるため20件
  const ITEMS_PN = 26; // 2ページ目以降は出張内容がないため26件

  // ページごとにデータを分割
  const pages: ExpenseItem[][] = [];
  let currentIndex = 0;

  while (currentIndex < sortedExpenses.length || pages.length === 0) {
    const isFirstPage = pages.length === 0;
    const itemsLimit = isFirstPage ? ITEMS_P1 : ITEMS_PN;
    const pageItems = sortedExpenses.slice(currentIndex, currentIndex + itemsLimit);

    // レイアウト固定のため空行でパディング
    const paddedItems = [...pageItems];
    while (paddedItems.length < itemsLimit) {
      paddedItems.push({
        id: `placeholder-${pages.length}-${paddedItems.length}`,
        userId: '',
        date: '',
        category: ExpenseCategory.OTHER,
        amount: 0,
        description: '',
        transportMethod: '',
      });
    }
    pages.push(paddedItems);
    currentIndex += itemsLimit;
    if (currentIndex >= sortedExpenses.length && pages.length > 0) break;
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-12 relative z-0">
      {/* Explicit Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
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

      {/* Report Preview - ページごとに分割 */}
      <div id="printable-area" className="relative z-10">
        {pages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === pages.length - 1;
          return (
            <React.Fragment key={pageIndex}>
              {/* ページ間に改ページ用の空divを挿入（html2pdfが認識する正式な方法） */}
              {pageIndex > 0 && (
                <div className="html2pdf__page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />
              )}
              <div
                className="pdf-page w-[210mm] h-[297mm] mx-auto bg-white p-[20mm] shadow-lg print:shadow-none print:p-0 print:w-[210mm] print:h-[297mm] print:max-w-none mb-8 print:mb-0 box-border overflow-hidden relative"
              >
                {/* Scale content slightly using standard tailwind to ensure fit if necessary, but compact margins should do it */}
                <div className="text-black print:text-black font-serif text-xs h-full flex flex-col">

                  <div className="text-right mb-2 !text-black text-[10px]">No. ____________</div>

                  <h1 className="text-xl font-bold text-center mb-4 tracking-widest border-b-2 border-transparent !text-black">出張経費精算書</h1>

                  {/* Header Section */}
                  <div className="flex justify-between items-end mb-3 border-b !border-black pb-1">
                    <div className="space-y-1 !text-black">
                      <div>申請日： {applicationDateStr}</div>
                      <div>申請者： {userProfile.name}</div>
                      {pages.length > 1 && (
                        <div className="text-[10px] text-gray-500">（{pageIndex + 1} / {pages.length} ページ）</div>
                      )}
                    </div>
                    <div className="border !border-black w-40 h-12 flex">
                      <div className="flex-1 border-r !border-black"></div>
                      <div className="flex-1 border-r !border-black"></div>
                      <div className="flex-1"></div>
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* Summary Box */}
                    {pageIndex === 0 && (
                      <div className="mb-2">
                        <p className="mb-1 !text-black text-[11px]">出張経費について下記の通り申請致します</p>
                        <table className="w-full border-collapse border !border-black !text-black text-[11px]">
                          <thead className="bg-gray-200 print:bg-gray-200">
                            <tr>
                              <th colSpan={2} className="border !border-black py-0.5 font-bold !text-black">出張内容</th>
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
                      </div>
                    )}

                    {/* Detail Table */}
                    <table className="w-full border-collapse border !border-black text-center mb-0 !text-black text-[11px]">
                      <thead>
                        <tr className="bg-gray-200 print:bg-gray-200">
                          <th colSpan={7} className="border !border-black py-0.5 !text-black">出張旅費内訳</th>
                        </tr>
                        <tr className="bg-gray-100 print:bg-gray-100 text-[10px]">
                          <th className="border !border-black py-0.5 w-20 !text-black">日付</th>
                          <th className="border !border-black py-0.5 !text-black">訪問先</th>
                          <th className="border !border-black py-0.5 w-16 !text-black">交通手段</th>
                          <th className="border !border-black py-0.5 w-20 !text-black">交通費</th>
                          <th className="border !border-black py-0.5 w-20 !text-black">宿泊費</th>
                          <th className="border !border-black py-0.5 w-20 !text-black">日当</th>
                          <th className="border !border-black py-0.5 w-20 !text-black">計</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageItems.map((item) => {
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
                            <tr key={item.id} className="h-6">
                              <td className="border !border-black p-0.5 !text-black truncate max-w-[4rem]">{dateStr}</td>
                              <td className="border !border-black p-0.5 text-left px-1 !text-black truncate max-w-[10rem]">{item.description}</td>
                              <td className="border !border-black p-0.5 !text-black truncate max-w-[4rem]">{item.transportMethod}</td>
                              <td className="border !border-black p-0.5 text-right px-1 !text-black">{transportCost}</td>
                              <td className="border !border-black p-0.5 text-right px-1 !text-black">{accomCost}</td>
                              <td className="border !border-black p-0.5 text-right px-1 !text-black">{dailyAllowance}</td>
                              <td className="border !border-black p-0.5 text-right px-1 !text-black">{item.amount > 0 ? item.amount.toLocaleString() : ''}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 最終ページのみ合計・備考を表示 */}
                  {isLastPage && (
                    <div className="mt-2 shrink-0 border-t-2 border-transparent break-inside-avoid">
                      {/* Totals Section */}
                      <div className="flex justify-end mt-0 text-[11px]">
                        <table className="border-collapse border !border-black w-48 text-center !text-black">
                          <tbody>
                            <tr>
                              <td className="border !border-black py-0.5 bg-gray-100 print:bg-gray-100 w-16 font-medium !text-black">実費合計</td>
                              <td className="border !border-black py-0.5 font-bold !text-black">¥{actualCostTotal.toLocaleString()}</td>
                            </tr>
                            <tr>
                              <td className="border !border-black py-0.5 bg-gray-100 print:bg-gray-100 font-medium !text-black">仮払金額</td>
                              <td className="border !border-black py-0.5 !text-black">0</td>
                            </tr>
                            <tr>
                              <td className="border !border-black py-0.5 bg-gray-100 print:bg-gray-100 font-bold !text-black">精算額</td>
                              <td className="border !border-black py-0.5 font-bold text-sm !text-black">¥{settlementAmount.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Remarks */}
                      <div className="mt-2 border !border-black h-[50px] !text-black flex flex-col">
                        <div className="bg-gray-200 print:bg-gray-200 border-b !border-black py-0.5 text-center font-bold text-[10px] !text-black shrink-0">備　考</div>
                        <div className="p-1 !text-black flex-1"></div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};