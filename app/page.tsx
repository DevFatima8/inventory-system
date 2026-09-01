"use client";

import { useState, useRef } from "react";

type InvoiceDetails = {
  invoiceNo: string;
  accountCode: string;
  clientName: string;
  address: string;
  phoneNo: string;
  mobileNo: string;
  invoiceDate: string;
  summaryNo: string;
  bookedBy: string;
  suppliedBy: string;
  territory: string;
};

type MedicineItem = {
  id: number;
  code: string;
  name: string;
  batch: string;
  expiry: string;
  qty: number;
  free: number;
  realPrice: number;
  extraDiscountPercent: number;
  stax: number;
};

export default function MidicareReceiptApp() {
  const [details, setDetails] = useState<InvoiceDetails>({
    invoiceNo: "67262",
    accountCode: "9234",
    clientName: "GULL M/S",
    address: "BAJAUR KHAAR",
    phoneNo: "",
    mobileNo: "",
    invoiceDate: new Date().toLocaleDateString("en-GB"),
    summaryNo: "3790",
    bookedBy: "Matti",
    suppliedBy: "21",
    territory: "Bajawar Hospital",
  });

  const [items, setItems] = useState<MedicineItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [currentItem, setCurrentItem] = useState({
    code: "", name: "", batch: "", expiry: "", qty: 10, free: 0, realPrice: 0, extraDiscountPercent: 10.0, stax: 0
  });

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name || currentItem.realPrice <= 0) return;

    const isDuplicate = items.some(
      (item) => item.name.toLowerCase() === currentItem.name.toLowerCase()
    );

    if (isDuplicate) {
      alert(`⚠️ ${currentItem.name} pehly hi receipt mai add ho chuki hai!`);
      return;
    }

    setItems([...items, {
      ...currentItem,
      id: Date.now(),
      qty: Number(currentItem.qty),
      free: Number(currentItem.free),
      realPrice: Number(currentItem.realPrice),
      extraDiscountPercent: Number(currentItem.extraDiscountPercent),
      stax: Number(currentItem.stax)
    }]);

    setCurrentItem({ code: "", name: "", batch: "", expiry: "", qty: 10, free: 0, realPrice: 0, extraDiscountPercent: 10.0, stax: 0 });
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = items.reduce((acc, item) => {
    const tradePrice = item.realPrice * 0.85;
    const grossAmount = tradePrice * item.qty;
    const discountAmount = (grossAmount * item.extraDiscountPercent) / 100;
    return {
      gross: acc.gross + grossAmount,
      discount: acc.discount + discountAmount,
      stax: acc.stax + item.stax,
      qty: acc.qty + item.qty
    };
  }, { gross: 0, discount: 0, stax: 0, qty: 0 });

  const netBillAmount = totals.gross - totals.discount + totals.stax;

  const handleSharePDF = async () => {
    if (!invoiceRef.current) return;
    setIsSharing(true);

    try {
      const htmlToImage = await import("html-to-image");
      const { jsPDF } = await import("jspdf");

      const elem = invoiceRef.current;

      const imgData = await htmlToImage.toPng(elem, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
          width: '800px'
        }
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const aspectRatio = elem.offsetHeight / 800;
      let imgHeight = pdfWidth * aspectRatio;
      let imgWidth = pdfWidth;

      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = pageHeight / aspectRatio;
      }

      const marginX = (pdfWidth - imgWidth) / 2;

      pdf.addImage(imgData, "PNG", marginX, 0, imgWidth, imgHeight);

      const pdfBlob = pdf.output("blob");
      const fileName = `Invoice_${details.invoiceNo}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice #${details.invoiceNo}`,
          text: `Azad Medicine Company Invoice #${details.invoiceNo} attached.`,
        });
      } else {
        pdf.save(fileName);
        alert("Aapka browser file sharing support nahi karta. PDF download ho gayi hai, aap usay manually WhatsApp par bhej sakte hain.");
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF banane mein masla aa raha hai.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen print:min-h-0 bg-gray-200 print:bg-white p-2 sm:p-4 md:p-8 font-sans text-gray-900">

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm; 
          }
          body, html {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}} />

      {/* ================= DATA ENTRY FORM ================= */}
      {!showPreview && (
        <div className="max-w-5xl mx-auto space-y-6 print:hidden">

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-t-4 border-blue-400">
            <h2 className="text-lg font-bold mb-4 text-blue-800">1. Invoice Header Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(details).map((key) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold mb-1 uppercase text-gray-600">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type="text" name={key} value={details[key as keyof InvoiceDetails]} onChange={handleDetailChange}
                    className="w-full border border-gray-300 p-2 text-sm rounded focus:outline-none focus:border-blue-500 bg-gray-50"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border-t-4 border-cyan-500">
            <h2 className="text-lg font-bold mb-4 text-cyan-800">2. Add Product Item</h2>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div><label className="block text-xs font-semibold mb-1">Code</label><input type="text" name="code" value={currentItem.code} onChange={handleItemChange} className="w-full border p-2 text-sm rounded" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold mb-1">Product Name *</label><input type="text" name="name" value={currentItem.name} onChange={handleItemChange} required className="w-full border p-2 text-sm rounded" /></div>
              <div><label className="block text-xs font-semibold mb-1">Batch No</label><input type="text" name="batch" value={currentItem.batch} onChange={handleItemChange} className="w-full border p-2 text-sm rounded" /></div>
              <div><label className="block text-xs font-semibold mb-1">Expiry Date</label><input type="text" name="expiry" value={currentItem.expiry} onChange={handleItemChange} placeholder="MM-YY" className="w-full border p-2 text-sm rounded" /></div>
              <div><label className="block text-xs font-semibold mb-1">Qty *</label><input type="number" name="qty" value={currentItem.qty} onChange={handleItemChange} required className="w-full border p-2 text-sm rounded" /></div>
              <div><label className="block text-xs font-semibold mb-1">Free</label><input type="number" name="free" value={currentItem.free} onChange={handleItemChange} className="w-full border p-2 text-sm rounded" /></div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-700">Real Price *</label>
                <input type="number" step="0.01" name="realPrice" value={currentItem.realPrice || ''} onChange={handleItemChange} required className="w-full border border-blue-400 p-2 text-sm rounded bg-blue-50" placeholder="e.g. 403.5" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-red-600">Extra Disc %</label>
                <input type="number" step="0.1" name="extraDiscountPercent" value={currentItem.extraDiscountPercent || ''} onChange={handleItemChange} className="w-full border border-red-300 p-2 text-sm rounded focus:border-red-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-500">Trade Price</label>
                <input type="text" readOnly value={currentItem.realPrice ? (Number(currentItem.realPrice) * 0.85).toFixed(2) : "0.00"} className="w-full border p-2 text-sm rounded bg-gray-100 text-gray-500 cursor-not-allowed font-medium" />
              </div>
              <div><label className="block text-xs font-semibold mb-1">STAX</label><input type="number" step="0.01" name="stax" value={currentItem.stax || ''} onChange={handleItemChange} className="w-full border p-2 text-sm rounded" /></div>

              <div className="sm:col-span-2 lg:col-span-6 mt-2">
                <button type="submit" className="w-full bg-cyan-600 text-white py-3 rounded hover:bg-cyan-700 font-bold shadow-md">Add Item to Invoice</button>
              </div>
            </form>

            {items.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-bold text-sm mb-2 text-gray-700">Added Items ({items.length}):</h3>
                <ul className="text-sm bg-gray-50 p-2 sm:p-4 rounded-lg space-y-2 border">
                  {items.map((it, idx) => {
                    const tradePrice = it.realPrice * 0.85;
                    const gross = tradePrice * it.qty;
                    const discAmount = (gross * it.extraDiscountPercent) / 100;
                    return (
                      <li key={idx} className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-2 border-gray-300 last:border-0 last:pb-0 gap-2">
                        <span>{it.code} - <b>{it.name}</b> (Qty: {it.qty}, Trade Price: {tradePrice.toFixed(2)})</span>
                        <div className="flex gap-4 items-center">
                          <span className="text-red-600 font-semibold bg-red-100 px-2 py-1 rounded text-xs">- Rs {discAmount.toFixed(2)} Extra Disc</span>
                          <button className="text-red-500 font-bold text-xs hover:underline whitespace-nowrap" onClick={() => setItems(items.filter(i => i.id !== it.id))}>X Remove</button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <button onClick={() => setShowPreview(true)} disabled={items.length === 0} className="w-full bg-gray-800 text-white py-4 rounded-lg text-lg font-bold hover:bg-black transition disabled:bg-gray-400 shadow-lg">
            Generate & View Invoice
          </button>
        </div>
      )}

      {/* ================= INVOICE PREVIEW & PDF SECTION ================= */}
      {showPreview && (
        <div className="max-w-[1000px] mx-auto bg-white print:bg-white shadow-xl print:shadow-none print:max-w-full text-[#333]">

          <div className="flex flex-wrap justify-between p-4 bg-gray-800 print:hidden rounded-t-lg gap-4">
            <button onClick={() => setShowPreview(false)} className="text-white border border-gray-500 px-4 py-2 rounded hover:bg-gray-700 w-full sm:w-auto">← Edit Invoice</button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={handleSharePDF} disabled={isSharing} className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded font-bold hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-500">
                {isSharing ? "⏳ Processing..." : "📤 Share PDF"}
              </button>
              <button onClick={handlePrint} className="bg-cyan-600 text-white px-4 sm:px-8 py-2 rounded font-bold hover:bg-cyan-700">🖨️ Print</button>
            </div>
          </div>

          <div className="overflow-x-auto w-full bg-gray-100 print:bg-white p-2 sm:p-8 print:p-0 print:overflow-visible">

            <div ref={invoiceRef} className="bg-white p-6 print:p-0 text-[11px] leading-snug font-sans mx-auto shadow-sm print:shadow-none min-w-[800px] max-w-4xl print:min-w-0 print:w-full">

              <div className="flex justify-between items-center mb-6">
                <div className="w-1/4 flex flex-col items-center justify-center">
                  <img src="/Azad.jpg" alt="Azad Distributor Logo" className="w-24 h-auto object-contain mb-1" />
                </div>
                <div className="w-2/4 text-center">
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">Azad Medicine Company</h1>
                  <p className="text-gray-700 font-medium">Captan Sajjad Shaheed,Bypass Road Near Hospital St</p>
                  <p className="text-gray-700 font-medium">Cell# 03444110035,web:www.azadmedicinecompany.pk</p>
                  <h2 className="text-lg font-bold mt-4 tracking-wide text-blue-900 print:text-black">Sales Invoice</h2>
                </div>
                <div className="w-1/4 text-right">
                  <p className="text-gray-600"><span className="text-gray-500 mr-2">Branch Name:</span> AMC(BAJAUR)</p>
                  <p className="text-gray-600"><span className="text-gray-500 mr-2">Operator ID:</span> SAJJAD KHAN(KPC)</p>
                </div>
              </div>

              <div className="border border-gray-400 rounded-md p-3 flex justify-between mb-4">
                <div className="grid grid-cols-[100px_1fr] gap-y-1 w-[45%]">
                  <div className="text-gray-600 text-right pr-2">Invoice No:</div><div className="font-bold">{details.invoiceNo}</div>
                  <div className="text-gray-600 text-right pr-2">Account Code:</div><div>{details.accountCode}</div>
                  <div className="text-gray-600 text-right pr-2">Name:</div><div className="font-bold">{details.clientName}</div>
                  <div className="text-gray-600 text-right pr-2">Address:</div><div>{details.address}</div>
                  <div className="text-gray-600 text-right pr-2 mt-2">Contact No:</div><div className="mt-2">{details.phoneNo}</div>
                </div>
                <div className="w-[10%] relative">
                  <div className="absolute bottom-0 left-0 text-gray-600">License#:</div>
                </div>
                <div className="grid grid-cols-[130px_1fr] gap-y-1 w-[40%]">
                  <div className="text-gray-600 text-right pr-2">Invoice Date:</div><div>{details.invoiceDate}</div>
                  <div className="text-gray-600 text-right pr-2">Summary/PRS No:</div><div>{details.summaryNo}</div>
                  <div className="text-gray-600 text-right pr-2">Booked By:</div><div>{details.bookedBy}</div>
                  <div className="text-gray-600 text-right pr-2">Supplied By:</div><div>{details.suppliedBy}</div>
                  <div className="text-gray-600 text-right pr-2">Territory:</div><div>{details.territory}</div>
                </div>
              </div>

              <table className="w-full mb-1 border-collapse text-[10px] text-center border border-gray-400">
                <thead>
                  <tr className="border-b border-gray-400 bg-gray-50 print:bg-transparent">
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[5%]">Code</th>
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-2 font-semibold text-left w-[25%]">Product Name</th>
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[8%]">Batch No</th>
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[8%]">Expiry<br />Date</th>
                    <th colSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[10%]">Quantity</th>
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[8%]">Trade<br />Price</th>
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[10%]">Gross<br />Amount</th>
                    <th colSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[12%]">Discount</th>
                    <th rowSpan={2} className="border-r border-gray-400 py-[2px] px-1 font-semibold w-[5%]">STAX</th>
                    <th rowSpan={2} className="py-[2px] px-1 font-semibold w-[9%]">Net Amount</th>
                  </tr>
                  <tr className="border-b border-gray-400 bg-gray-50 print:bg-transparent">
                    <th className="border-r border-gray-400 py-[2px] px-1 font-semibold border-t">Qty</th>
                    <th className="border-r border-gray-400 py-[2px] px-1 font-semibold border-t">Free</th>
                    <th className="border-r border-gray-400 py-[2px] px-1 font-semibold border-t">%</th>
                    <th className="border-r border-gray-400 py-[2px] px-1 font-semibold border-t">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const tradePrice = item.realPrice * 0.85;
                    const gross = tradePrice * item.qty;
                    const discAmount = (gross * item.extraDiscountPercent) / 100;
                    const net = gross - discAmount + item.stax;

                    return (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="border-r border-gray-400 py-[4px] px-1 text-gray-700">{item.code}</td>
                        <td className="border-r border-gray-400 py-[4px] px-2 text-left">{item.name}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1 text-gray-700">{item.batch}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1 text-gray-700">{item.expiry}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1">{item.qty}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1">{item.free}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1">{tradePrice.toFixed(1)}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1">{gross.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1">{item.extraDiscountPercent.toFixed(1)}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1 text-right pr-2">{discAmount.toFixed(1)}</td>
                        <td className="border-r border-gray-400 py-[4px] px-1">{item.stax > 0 ? item.stax : ""}</td>
                        <td className="py-[4px] px-1 font-semibold text-right pr-2">{net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex border border-gray-400 rounded-sm mb-4 mt-2">
                <div className="w-2/3 p-2 border-r border-gray-400 flex flex-col justify-between">
                  <div className="flex gap-12 font-medium">
                    <div>No of Item(s) <span className="ml-4">{items.length}</span></div>
                    <div className="ml-16">{totals.qty}</div>
                  </div>
                </div>
                <div className="w-1/3 p-2 bg-gray-50 print:bg-transparent">
                  <div className="grid grid-cols-[1fr_80px] gap-y-1 text-right text-[10px]">
                    <div className="font-semibold text-gray-600">Total Gross Amount:</div><div className="font-semibold">{totals.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-gray-600">Total Discount:</div><div>{totals.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-gray-600">S.Tax Amount:</div><div>{totals.stax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="font-bold pt-1 border-t border-gray-400 mt-1">Net Bill Amount:</div><div className="font-bold pt-1 border-t border-gray-400 mt-1">{netBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  </div>
                </div>
              </div>

              {/* Exact Footer Text & Warning matching the image */}
              <div className="flex justify-between items-end mt-2">
                <div className="w-3/4 pr-4">
                  <p className="text-[9px] text-gray-600 mb-2 text-justify leading-tight">
                    Warranty: Under section 23(1)(1) for Pharmaceutical Products of the Drug Act 1976 & DRAP Act, 2012 for
                    Alternative Medicine & Health Products. I, Salman Khan, being a person resident in Pakistan and am a
                    qualified person of AZAD MEDICINE COMPANY, Captan Sajjad Shaheed, Bypass Road, Near Hospital
                    Stop Bajaur, do here by give this Warranty that the drug sold by me, contain in this invoice do not
                    contravene in any way the provision of Section 23 of Drug ACT, 1976.
                  </p>
                  <div className="text-[10px] font-bold text-gray-700 leading-tight mb-2">
                    <p className="mb-1">** NOTE 1:- Intimation of Expired Stock within Six(6) months will be highly appreciated...</p>
                    <p className="ml-4">Note 2 :Helix Stallion Team(Bonus Products) expiry will not be accepted.</p>
                  </div>
                </div>

                {/* Signature Box */}
                <div className="w-1/4 text-center">
                  <div className="h-10 border-b border-gray-400 mb-1 flex items-end justify-center">
                    <span className="text-gray-300 italic text-xl opacity-50">Signature</span>
                  </div>
                  <p className="text-[9px] text-gray-700">For AMC Bajaur</p>
                </div>
              </div>

              {/* Urdu Warning (Exact Match) */}
              <div className="mt-4 mb-2 text-center text-[13px] font-bold text-gray-800" dir="rtl" style={{ fontFamily: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", Arial, serif' }}>
                خبردار:- سٹاک وصول کرتے وقت بل کی رقوم ، تعداد اشیاء وغیرہ تسلی سے چیک کریں۔ بعد میں ہم ذمہ دار نہ ہوں گے۔
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}