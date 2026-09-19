"use client";

import { useState, useRef } from "react";

type InvoiceDetails = {
  branchName: string;
  operatorId: string;
  summaryNo: string;
  invoiceDate: string;
  territory: string;
  bookedBy: string;
  suppliedBy: string;
  invoiceNo: string;
  accountCode: string;
  clientName: string;
  address: string;
  phoneNo: string;
  mobileNo: string;
  generationNo: string;
  expiryInvoiceNo: string;
  generationDate: string;
  searchExpInv: string;
  prevBalance: string;
};

type MedicineItem = {
  id: number;
  code: string;
  name: string;
  batch: string;
  expiry: string;
  qty: number | string;
  free: number | string;
  realPrice: number | string;
  extraDiscountPercent: number | string;
  stax: number | string;
};

export default function MidicareReceiptApp() {
  const initialDetails: InvoiceDetails = {
    branchName: "AMC(BAJAUR)",
    operatorId: "SAJJAD KHAN (KPO)",
    summaryNo: "",
    invoiceDate: "",
    territory: "",
    bookedBy: "Matti",
    suppliedBy: "Matti",
    invoiceNo: "",
    accountCode: "",
    clientName: "",
    address: "",
    phoneNo: "",
    mobileNo: "",
    generationNo: "",
    expiryInvoiceNo: "",
    generationDate: "",
    searchExpInv: "",
    prevBalance: "",
  };

  const [details, setDetails] = useState<InvoiceDetails>(initialDetails);
  const [items, setItems] = useState<MedicineItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const emptyItem = {
    id: 0, code: "", name: "", batch: "", expiry: "", qty: "", free: "0", realPrice: "", extraDiscountPercent: "10.0", stax: "0"
  };
  const [currentItem, setCurrentItem] = useState<MedicineItem>(emptyItem);

  const handleDetailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentItem({ ...currentItem, [e.target.name]: e.target.value });
  };

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "BUTTON") return;
      e.preventDefault();

      const itemFields = ['code', 'name', 'batch', 'expiry', 'realPrice', 'qty', 'free', 'extraDiscountPercent', 'stax'];
      const isItemInput = itemFields.includes((target as HTMLInputElement).name);

      if (isItemInput) {
        const isAllFilled =
          String(currentItem.code).trim() !== "" &&
          String(currentItem.name).trim() !== "" &&
          String(currentItem.batch).trim() !== "" &&
          String(currentItem.expiry).trim() !== "" &&
          String(currentItem.realPrice).trim() !== "" &&
          String(currentItem.qty).trim() !== "";

        if (isAllFilled) {
          document.getElementById("addBtn")?.click();
          return;
        }
      }

      const form = e.currentTarget;
      const elements = Array.from(form.elements) as HTMLElement[];
      const focusableElements = elements.filter((el) => {
        if (el.tagName !== "INPUT" && el.tagName !== "BUTTON" && el.tagName !== "SELECT") return false;
        const inputEl = el as HTMLInputElement;
        return !inputEl.disabled && !inputEl.readOnly && inputEl.tabIndex !== -1;
      });

      const currentIndex = focusableElements.indexOf(target);
      if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
        const nextEl = focusableElements[currentIndex + 1];
        if (nextEl.getAttribute("type") === "submit" || nextEl.tagName === "BUTTON") {
          nextEl.click();
        } else {
          nextEl.focus();
        }
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name || Number(currentItem.realPrice) <= 0) {
      alert("⚠️ Product Name aur Real Price likhna lazmi hai!");
      return;
    }

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
      qty: Number(currentItem.qty) || 1,
      free: Number(currentItem.free) || 0,
      realPrice: Number(currentItem.realPrice),
      extraDiscountPercent: Number(currentItem.extraDiscountPercent) || 0,
      stax: Number(currentItem.stax) || 0
    }]);

    setCurrentItem(emptyItem);

    setTimeout(() => {
      document.getElementById("productCodeInput")?.focus();
    }, 10);
  };

  const handleCancel = () => {
    setDetails(initialDetails);
    setItems([]);
    setCurrentItem(emptyItem);
  };

  const handlePrint = () => {
    window.print();
  };

  const totals = items.reduce((acc, item) => {
    const tradePrice = Number(item.realPrice) * 0.85;
    const grossAmount = tradePrice * Number(item.qty);
    const discountAmount = (grossAmount * Number(item.extraDiscountPercent)) / 100;
    return {
      gross: acc.gross + grossAmount,
      discount: acc.discount + discountAmount,
      stax: acc.stax + Number(item.stax),
      qty: acc.qty + Number(item.qty)
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

      const imgData = await htmlToImage.toJpeg(elem, {
        pixelRatio: 1.5,
        quality: 0.9,
        backgroundColor: '#ffffff',
        style: { margin: '0', width: '800px' }
      });

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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
      pdf.addImage(imgData, "JPEG", marginX, 0, imgWidth, imgHeight);

      const pdfBlob = pdf.output("blob");
      const fileName = `Invoice_${details.invoiceNo || 'Draft'}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: fileName,
          });
        } catch (shareErr) {
          console.log("Share cancelled or failed", shareErr);
        }
      } else {
        pdf.save(fileName);
        alert("Aapka browser file sharing support nahi karta. PDF download ho gayi hai.");
      }
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDF banane mein masla aa raha hai.");
    } finally {
      setIsSharing(false);
    }
  };

  const tempTradePrice = Number(currentItem.realPrice || 0) * 0.85;
  const tempGross = tempTradePrice * Number(currentItem.qty || 0);
  const tempDiscount = (tempGross * Number(currentItem.extraDiscountPercent || 0)) / 100;
  const tempNet = tempGross - tempDiscount + Number(currentItem.stax || 0);

  return (
    <div className={`min-h-screen ${showPreview ? 'bg-gray-200' : 'bg-[#00478F]'} print:bg-white font-sans text-gray-900 overflow-x-hidden`}>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4 portrait; margin: 6mm; }
          body, html { background-color: white !important; margin: 0 !important; padding: 0 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          
          /* Print text tone: readable dark gray instead of pitch black */
          #printArea, #printArea * {
            color: #27272a !important;
            font-weight: 500 !important;
          }
          #printArea h1 {
            font-weight: 700 !important;
            color: #18181b !important;
          }
          #printArea h2 {
            font-weight: 600 !important;
            color: #27272a !important;
          }
          
          /* Light & fine borders for print headers */
          #printArea .print-border,
          #printArea table,
          #printArea th {
            border-width: 1px !important;
            border-color: #71717a !important;
          }
          #printArea .print-border-b {
            border-bottom-width: 1px !important;
            border-bottom-color: #71717a !important;
          }
          #printArea .print-border-r {
            border-right-width: 1px !important;
            border-right-color: #71717a !important;
          }
          #printArea .print-border-t {
            border-top-width: 1px !important;
            border-top-color: #71717a !important;
          }
        }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #e0e0e0; border-left: 1px solid #a0a0a0; }
        ::-webkit-scrollbar-thumb { background: #c0c0c0; border: 1px solid #fff; border-right-color: #888; border-bottom-color: #888; }
      `}} />

      {!showPreview && (
        <div className="w-full min-h-screen flex flex-col p-1 sm:p-2 text-[11px] sm:text-[12px] text-white print:hidden font-mono selection:bg-blue-800">

          <form onSubmit={handleAddItem} onKeyDown={handleFormKeyDown} className="flex flex-col h-full gap-1 sm:gap-2">

            <div className="flex flex-col md:flex-row items-center justify-between border-[2px] border-black bg-[#0055A4] p-1 gap-2 md:gap-0">
              <div className="flex gap-1 items-center w-full md:w-1/3">
                <span className="bg-gray-200 text-black px-2 font-black whitespace-nowrap border-[2px] border-black">Branch Code: 13</span>
                <input name="branchName" value={details.branchName || ""} onChange={handleDetailChange} className="bg-[#ccffff] text-black font-black px-2 outline-none w-full border-[2px] border-black" />
              </div>
              <div className="w-full md:w-1/3 text-center text-lg sm:text-xl font-black tracking-widest text-white shadow-sm">Sales Invoice Entry</div>
              <div className="w-full md:w-1/3 text-center md:text-right text-[11px] font-bold leading-tight pr-0 md:pr-2">
                <div>DMS (V. 2014)</div>
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span>User Name:</span>
                  <input
                    name="operatorId"
                    value={details.operatorId || ""}
                    onChange={handleDetailChange}
                    className="bg-gray-200 text-black px-1 font-black outline-none border-[1px] border-gray-400 w-44"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_4fr_2.5fr] gap-1 sm:gap-2">
              <div className="border-[2px] border-black bg-[#0060B0] p-1 sm:p-2 flex flex-col gap-1 sm:gap-[4px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                  <div className="flex items-center gap-1 w-full sm:w-auto border-[2px] border-black bg-red-600">
                    <label className="w-24 sm:w-20 lg:w-24 text-white pl-1 font-black whitespace-nowrap">Summary No:</label>
                    <input type="text" name="summaryNo" value={details.summaryNo || ""} onChange={handleDetailChange} className="w-full sm:w-20 bg-white text-black font-black px-1 outline-none border-l-[2px] border-black" />
                  </div>
                  <div className="flex items-center gap-1 w-full sm:w-auto flex-1 border-[2px] border-black bg-cyan-800">
                    <label className="w-24 sm:w-12 text-white font-bold pl-1">Date</label>
                    <input type="text" name="invoiceDate" value={details.invoiceDate || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold px-1 outline-none min-w-[80px] border-l-[2px] border-black" />
                  </div>
                </div>
                <div className="flex items-center gap-1 border-[2px] border-black bg-cyan-800">
                  <label className="w-24 text-white font-bold pl-1 whitespace-nowrap">MainArea: 8</label>
                  <input type="text" name="territory" value={details.territory || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold px-1 outline-none border-l-[2px] border-black" />
                </div>
                <div className="flex items-center gap-1 border-[2px] border-black bg-cyan-800">
                  <label className="w-24 text-white font-bold pl-1 whitespace-nowrap">Booked By:</label>
                  <input type="text" name="bookedBy" value={details.bookedBy || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold px-1 outline-none border-l-[2px] border-black" />
                </div>
                <div className="flex items-center gap-1 border-[2px] border-black bg-cyan-800">
                  <label className="w-24 text-white font-bold pl-1 whitespace-nowrap">Supplied By:</label>
                  <input type="text" name="suppliedBy" value={details.suppliedBy || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold px-1 outline-none border-l-[2px] border-black" />
                </div>
              </div>

              <div className="border-[2px] border-black bg-[#0060B0] flex flex-col">
                <div className="bg-[#00478F] text-white pl-2 font-black border-b-[2px] border-black py-1">Account Information</div>
                <div className="p-1 sm:p-2 flex flex-col gap-1 sm:gap-[4px]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                    <div className="flex items-center gap-1 w-full sm:w-auto">
                      <label className="w-28 text-white font-bold pl-1 text-left sm:text-right pr-1 whitespace-nowrap">PRS Invoice No:</label>
                      <input type="text" name="invoiceNo" value={details.invoiceNo || ""} onChange={handleDetailChange} className="w-full sm:w-24 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                    </div>
                    <input type="text" placeholder="Search PRS Inv. No" className="w-full sm:flex-1 bg-white text-black font-bold border-[2px] border-black px-1 outline-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-28 text-white font-bold pl-1 text-left sm:text-right pr-1 whitespace-nowrap">Account Code:</label>
                    <input type="text" name="accountCode" value={details.accountCode || ""} onChange={handleDetailChange} className="flex-1 sm:w-24 sm:flex-none bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-28 text-white font-bold pl-1 text-left sm:text-right pr-1 whitespace-nowrap">Customer Name:</label>
                    <input type="text" name="clientName" value={details.clientName || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-28 text-white font-bold pl-1 text-left sm:text-right pr-1 whitespace-nowrap">Address:</label>
                    <input type="text" name="address" value={details.address || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-28 text-white font-bold pl-1 text-left sm:text-right pr-1 whitespace-nowrap">Contact No:</label>
                    <input type="text" name="phoneNo" value={details.phoneNo || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                  </div>
                  <div className="flex items-center gap-1 w-full sm:w-auto">
                    <label className="w-28 sm:w-16 text-white font-bold text-left sm:text-right pr-1 whitespace-nowrap">Bill Amnt:</label>
                    <input type="text" readOnly value={netBillAmount.toFixed(0)} className="flex-1 sm:w-24 sm:flex-none bg-[#ccffff] text-black font-black border-[2px] border-black px-1 outline-none" />
                  </div>
                </div>
              </div>

              <div className="border-[2px] border-black bg-[#0060B0] p-1 sm:p-2 flex flex-col justify-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1">
                  <label className="w-32 sm:w-28 text-white font-bold text-left sm:text-right pr-1 whitespace-nowrap">Generation No:</label>
                  <input type="text" name="generationNo" value={details.generationNo || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                </div>
                <div className="flex items-center gap-1">
                  <label className="w-32 sm:w-28 text-white font-bold text-left sm:text-right pr-1 whitespace-nowrap">Expiry Invoice#:</label>
                  <input type="text" name="expiryInvoiceNo" value={details.expiryInvoiceNo || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                </div>
                <div className="flex items-center gap-1">
                  <label className="w-32 sm:w-28 text-white font-bold text-left sm:text-right pr-1 whitespace-nowrap">Date:</label>
                  <input type="text" name="generationDate" value={details.generationDate || ""} onChange={handleDetailChange} className="flex-1 bg-[#ccffff] text-black font-bold border-[2px] border-black px-1 outline-none" />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 lg:mt-2">
                  <label className="w-full sm:w-36 lg:w-28 text-white font-bold text-left sm:text-right pr-1 whitespace-nowrap">Search Exp.Inv#:</label>
                  <input type="text" name="searchExpInv" value={details.searchExpInv || ""} onChange={handleDetailChange} className="w-full sm:flex-1 bg-white text-black font-bold border-[2px] border-black px-1 outline-none" />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto border-[2px] border-black bg-[#008080] mt-1 sm:mt-2 flex flex-col relative min-h-[300px]">
              <table className="w-full min-w-[900px] text-left whitespace-nowrap border-collapse">
                <thead className="sticky top-0 bg-[#0055A4] text-white z-10 shadow-sm border-b-[2px] border-black">
                  <tr>
                    <th className="font-bold px-1 border-[2px] border-black w-[5%] py-1">Item Code</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[20%] py-1">Item Name</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[8%] py-1">Batch No</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[8%] py-1">Exp_Date</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[6%] py-1">Retail Price</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[6%] py-1">T.Price</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[5%] py-1">Qty</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[5%] py-1">Bns</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[5%] py-1">Extra%</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[5%] py-1">S.Tax</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[8%] py-1">Net Amount</th>
                    <th className="font-bold px-1 border-[2px] border-black w-[4%] text-center py-1">Del</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-black font-bold">
                  <tr className="bg-[#A0FFFF] border-b-[2px] border-black">
                    <td className="p-0 border-[2px] border-black"><input id="productCodeInput" name="code" value={currentItem.code || ""} onChange={handleItemChange} className="w-full min-w-[60px] bg-transparent px-1 outline-none text-black font-bold border-none" /></td>
                    <td className="p-0 border-[2px] border-black"><input name="name" value={currentItem.name || ""} onChange={handleItemChange} className="w-full min-w-[120px] bg-transparent px-1 outline-none text-black font-bold uppercase border-none" required /></td>
                    <td className="p-0 border-[2px] border-black"><input name="batch" value={currentItem.batch || ""} onChange={handleItemChange} className="w-full min-w-[60px] bg-transparent px-1 outline-none text-black font-bold border-none" /></td>
                    <td className="p-0 border-[2px] border-black"><input name="expiry" value={currentItem.expiry || ""} onChange={handleItemChange} placeholder="MM-YY" className="w-full min-w-[60px] bg-transparent px-1 outline-none text-black font-bold border-none" /></td>
                    <td className="p-0 border-[2px] border-black"><input type="number" step="0.01" name="realPrice" value={currentItem.realPrice || ""} onChange={handleItemChange} className="w-full min-w-[60px] bg-transparent px-1 outline-none text-black font-bold border-none" required /></td>
                    <td className="p-0 border-[2px] border-black bg-gray-300 px-1 text-right text-black font-black">{tempTradePrice.toFixed(2)}</td>
                    <td className="p-0 border-[2px] border-black"><input type="number" name="qty" value={currentItem.qty || ""} onChange={handleItemChange} className="w-full min-w-[40px] bg-transparent px-1 outline-none text-black font-bold border-none" required /></td>
                    <td className="p-0 border-[2px] border-black"><input type="number" name="free" value={currentItem.free || ""} onChange={handleItemChange} className="w-full min-w-[40px] bg-transparent px-1 outline-none text-black font-bold border-none" /></td>
                    <td className="p-0 border-[2px] border-black"><input type="number" step="0.1" name="extraDiscountPercent" value={currentItem.extraDiscountPercent || ""} onChange={handleItemChange} className="w-full min-w-[40px] bg-transparent px-1 outline-none text-black font-bold border-none" /></td>
                    <td className="p-0 border-[2px] border-black"><input type="number" step="0.01" name="stax" value={currentItem.stax || ""} onChange={handleItemChange} className="w-full min-w-[40px] bg-transparent px-1 outline-none text-black font-bold border-none" /></td>
                    <td className="p-0 border-[2px] border-black bg-gray-300 px-1 text-right text-black font-black">{tempNet.toFixed(2)}</td>
                    <td className="p-0 text-center border-[2px] border-black"><button id="addBtn" type="submit" className="w-full bg-green-600 text-white font-bold px-1 py-[2px] hover:bg-green-700 outline-none focus:ring-2 focus:ring-black">Add</button></td>
                  </tr>

                  {items.map((item, idx) => {
                    const tPrice = Number(item.realPrice) * 0.85;
                    const grs = tPrice * Number(item.qty);
                    const dAmount = (grs * Number(item.extraDiscountPercent)) / 100;
                    const nt = grs - dAmount + Number(item.stax);
                    return (
                      <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-[#E0FFFF]'} border-b-[2px] border-black hover:bg-blue-200`}>
                        <td className="px-1 py-[4px] border-[2px] border-black font-bold text-black">{item.code}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black truncate font-bold text-black">{item.name}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black font-bold text-black">{item.batch}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black font-bold text-black">{item.expiry}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-bold text-black">{Number(item.realPrice).toFixed(2)}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-bold text-black">{tPrice.toFixed(2)}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-bold text-black">{item.qty}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-bold text-black">{item.free}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-bold text-black">{Number(item.extraDiscountPercent).toFixed(1)}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-bold text-black">{Number(item.stax) > 0 ? item.stax : ""}</td>
                        <td className="px-1 py-[4px] border-[2px] border-black text-right font-black text-black">{nt.toFixed(2)}</td>
                        <td className="px-1 py-[4px] text-center border-[2px] border-black"><button type="button" onClick={() => setItems(items.filter(i => i.id !== item.id))} className="bg-red-600 text-white font-bold px-3 py-1 rounded-sm hover:bg-red-800 transition-colors">Del</button></td>
                      </tr>
                    );
                  })}

                  {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b-[2px] border-black bg-white">
                      <td className="border-[2px] border-black p-3"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td><td className="border-[2px] border-black"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-[2px] border-black bg-[#0060B0] p-1 sm:p-2 mt-1 flex flex-col gap-1 sm:gap-2">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 text-[11px] sm:text-[12px]">
                <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                  <div className="flex gap-1 items-center">
                    <button type="button" className="text-white font-bold hover:underline outline-none px-2 whitespace-nowrap">Add:</button>
                    <input className="w-16 bg-[#008080] border-[2px] border-black text-white font-bold outline-none px-1" />
                  </div>
                  <div className="flex items-center gap-1"><label className="text-white font-bold">S.Tax:</label><input readOnly value={totals.stax.toFixed(2)} className="w-16 bg-[#008080] text-white font-black text-right px-1 border-[2px] border-black outline-none" /></div>
                  <div className="flex items-center gap-1"><label className="text-white font-bold">G.S.T:</label><input readOnly value="0.00" className="w-16 bg-[#008080] text-white font-black text-right px-1 border-[2px] border-black outline-none" /></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center w-full lg:w-auto mt-2 lg:mt-0">
                  <div className="flex items-center gap-1"><label className="text-white font-bold whitespace-nowrap">Bill Amount:</label><input readOnly value={totals.gross.toFixed(2)} className="w-24 bg-[#008080] text-white font-black text-right px-1 border-[2px] border-black outline-none" /></div>
                  <div className="flex items-center gap-1"><label className="text-white font-bold whitespace-nowrap">Net Amnt:</label><input readOnly value={netBillAmount.toFixed(2)} className="w-24 bg-[#ccffff] text-black text-right px-1 border-[2px] border-black outline-none font-black" /></div>
                  <div className="flex items-center gap-1"><label className="text-white font-bold whitespace-nowrap">Inv Balance:</label><input readOnly value={netBillAmount.toFixed(2)} className="w-24 bg-[#ccffff] text-black text-right px-1 border-[2px] border-black outline-none font-black" /></div>
                </div>
              </div>

              <div className="flex justify-center items-center mt-1 border-t-[2px] border-black pt-2 gap-4">
                <button type="button" onClick={handleCancel} className="bg-gray-300 text-black font-bold px-6 py-1 border-[2px] border-black hover:bg-gray-400 transition-colors">Cancel</button>
                <button type="button" onClick={() => setShowPreview(true)} disabled={items.length === 0} className="bg-[#ccffff] text-black font-black px-6 py-1 border-[2px] border-black hover:bg-white disabled:bg-gray-500 disabled:text-gray-300 transition-colors">Print Invoice</button>
              </div>
            </div>

          </form>
        </div>
      )}

      {showPreview && (
        <div className="max-w-[1000px] mx-auto bg-gray-200 print:bg-white shadow-2xl print:shadow-none print:max-w-full text-zinc-800 pb-10">

          <div className="flex flex-wrap justify-between p-4 bg-gray-800 print:hidden rounded-t-lg gap-4">
            <button onClick={() => setShowPreview(false)} className="text-white font-bold border-[2px] border-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto">← Back to Data Entry</button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button onClick={handleSharePDF} disabled={isSharing} className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded font-black hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-500 border-[2px] border-black">
                {isSharing ? "⏳ Processing..." : "📤 Share PDF"}
              </button>
              <button onClick={handlePrint} className="bg-cyan-600 text-black px-4 sm:px-8 py-2 rounded font-black hover:bg-cyan-700 border-[2px] border-black">🖨️ Print</button>
            </div>
          </div>

          <div className="overflow-x-auto w-full bg-gray-200 print:bg-white p-2 sm:p-8 print:p-0 print:overflow-visible">

            <div id="printArea" ref={invoiceRef} className="bg-white p-6 print:p-0 text-[11px] leading-snug font-sans mx-auto shadow-xl print:shadow-none min-w-[800px] max-w-4xl print:min-w-0 print:w-full text-zinc-800">

              <div className="flex justify-between items-center mb-5">
                <div className="w-1/4 flex flex-col items-center justify-center">
                  <img src="/Azad.jpg" alt="Azad Distributor Logo" className="w-28 h-auto object-contain mb-1" />
                </div>
                <div className="w-2/4 text-center text-zinc-800">
                  <h1 className="text-2xl font-bold mb-1 text-zinc-900">Azad Medicine Company</h1>
                  <p className="font-medium text-zinc-700">Captan Sajjad Shaheed,Bypass Road Near Hospital St</p>
                  <p className="font-medium text-zinc-700">Cell# 03444110035,web:www.azadmedicinecompany.pk</p>
                  <h2 className="text-lg font-bold mt-3 tracking-wide text-zinc-800 uppercase">Sales Invoice</h2>
                </div>
                <div className="w-1/4 text-right text-zinc-800 font-medium">
                  <p><span className="mr-2 font-semibold">Branch Name:</span> {details.branchName || "_________________"}</p>
                  <p><span className="mr-2 font-semibold">Operator ID:</span> {details.operatorId}</p>
                </div>
              </div>

              {/* IS DIV SE BORDER REMOVE KIYA GAYA HAI */}
              <div className="rounded-sm p-2.5 flex justify-between mb-3 bg-white">
                <div className="grid grid-cols-[100px_1fr] gap-y-1 w-[45%] text-zinc-800 font-medium">
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Invoice No:</div><div className="font-semibold text-zinc-900">{details.invoiceNo}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Account Code:</div><div>{details.accountCode}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Name:</div><div className="font-semibold text-zinc-900">{details.clientName}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Address:</div><div>{details.address}</div>
                  <div className="text-right pr-2 mt-1 text-zinc-600 font-semibold">Contact No:</div><div className="mt-1">{details.phoneNo}</div>
                </div>
                <div className="w-[10%] relative font-medium text-zinc-700">
                  <div className="absolute bottom-0 left-0 font-semibold">License#:</div>
                </div>
                <div className="grid grid-cols-[130px_1fr] gap-y-1 w-[40%] text-zinc-800 font-medium">
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Invoice Date:</div><div>{details.invoiceDate}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Summary/PRS No:</div><div>{details.summaryNo}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Booked By:</div><div>{details.bookedBy}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Supplied By:</div><div>{details.suppliedBy}</div>
                  <div className="text-right pr-2 text-zinc-600 font-semibold">Territory:</div><div>{details.territory}</div>
                </div>
              </div>

              <table className="w-full mb-1 border-collapse text-[10.5px] text-center print-border border-[1px] border-zinc-500">
                <thead>
                  <tr className="print-border-b border-b-[1px] border-zinc-500 print:bg-transparent text-zinc-900">
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[5%]">Code</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-2 font-semibold text-left w-[25%]">Product Name</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[8%]">Batch No</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[8%]">Expiry<br />Date</th>
                    <th colSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[10%]">Quantity</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[8%]">Trade<br />Price</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[10%]">Gross<br />Amount</th>
                    <th colSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[12%]">Discount</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[5%]">STAX</th>
                    <th rowSpan={2} className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold w-[9%]">Net Amount</th>
                  </tr>
                  <tr className="print-border-b border-b-[1px] border-zinc-500 print:bg-transparent text-zinc-900">
                    <th className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold">Qty</th>
                    <th className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold">Free</th>
                    <th className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold">%</th>
                    <th className="print-border border-[1px] border-zinc-500 py-[2px] px-1 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-zinc-800 font-medium">
                  {items.map((item) => {
                    const tradePrice = Number(item.realPrice) * 0.85;
                    const gross = tradePrice * Number(item.qty);
                    const discAmount = (gross * Number(item.extraDiscountPercent)) / 100;
                    const net = gross - discAmount + Number(item.stax);

                    return (
                      <tr key={item.id} className="border-none print:border-none">
                        <td className="py-[3px] px-1">{item.code}</td>
                        <td className="py-[3px] px-2 text-left uppercase font-semibold text-zinc-900">{item.name}</td>
                        <td className="py-[3px] px-1">{item.batch}</td>
                        <td className="py-[3px] px-1">{item.expiry}</td>
                        <td className="py-[3px] px-1">{item.qty}</td>
                        <td className="py-[3px] px-1">{item.free}</td>
                        <td className="py-[3px] px-1">{tradePrice.toFixed(1)}</td>
                        <td className="py-[3px] px-1 font-semibold">{gross.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                        <td className="py-[3px] px-1">{Number(item.extraDiscountPercent).toFixed(1)}</td>
                        <td className="py-[3px] px-1 text-right pr-2">{discAmount.toFixed(1)}</td>
                        <td className="py-[3px] px-1">{Number(item.stax) > 0 ? item.stax : ""}</td>
                        <td className="py-[3px] px-1 text-right pr-2 font-semibold text-zinc-900">{net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex mb-2 mt-2 px-1">
                <div className="w-[66%] pr-4 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-12 font-semibold text-zinc-800 text-[11px] mb-1.5">
                      <div>No of Item(s) <span className="ml-4">{items.length}</span></div>
                      <div className="ml-16">{totals.qty}</div>
                    </div>

                    <p className="text-[8.5px] text-zinc-700 text-justify leading-tight font-normal mb-1">
                      Warranty: Under section 23(1)(1) for Pharmaceutical Products of the Drug Act 1976 &amp; DRAP Act, 2012 for
                      Alternative Medicine &amp; Health Products. I, Salman Khan, being a person resident in Pakistan and am a
                      qualified person of AZAD MEDICINE COMPANY, Captan Sajjad Shaheed, Bypass Road, Near Hospital
                      Stop Bajaur, do here by give this Warranty that the drug sold by me, contain in this invoice do not
                      contravene in any way the provision of Section 23 of Drug ACT, 1976.
                    </p>
                  </div>

                  <div className="text-[9px] font-semibold text-zinc-700 leading-tight">
                    <p className="mb-0.5">** NOTE 1:- Intimation of Expired Stock within Six(6) months will be highly appreciated...</p>
                    <p className="ml-3">Note 2 :Helix Stallion Team(Bonus Products) expiry will not be accepted.</p>
                  </div>
                </div>

                <div className="w-[34%] pl-2 bg-white print:bg-transparent flex flex-col justify-start">
                  <div className="grid grid-cols-[1fr_80px] gap-y-1 text-right text-[10.5px] text-zinc-800">
                    <div className="font-semibold text-zinc-800">Total Gross Amount:</div>
                    <div className="font-semibold">{totals.gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

                    <div className="font-medium text-zinc-700">Total Discount:</div>
                    <div>{totals.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

                    <div className="font-medium text-zinc-700">S.Tax Amount:</div>
                    <div>{totals.stax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>

                    <div className="font-semibold pt-1 mt-1 text-[11px] text-zinc-900">
                      Net Bill Amount:
                    </div>
                    <div className="font-semibold pt-1 mt-1 text-[11px] text-zinc-900">
                      {netBillAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end items-end mt-2 pr-4">
                <div className="w-1/3 text-center">
                  <div className="h-8 mb-1"></div>
                  <p className="text-[11px] font-semibold text-zinc-700">For {details.branchName || "AMC Bajaur"}</p>
                </div>
              </div>

              <div className="mt-2 mb-1 text-center text-[13px] font-semibold text-zinc-800" dir="rtl" style={{ fontFamily: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", Arial, serif' }}>
                خبردار:- سٹاک وصول کرتے وقت بل کی رقوم ، تعداد اشیاء وغیرہ تسلی سے چیک کریں۔ بعد میں ہم ذمہ دار نہ ہوں گے۔
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}