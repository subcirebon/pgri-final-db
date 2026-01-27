import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { 
  Wallet, TrendingUp, TrendingDown, Plus, Download, Trash2, Filter, 
  FileSpreadsheet, Printer, ChevronDown, X, ArrowRightLeft, Lock, 
  Upload, Eye, FileText, Loader2 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'outcome';
  category: string;
  amount: number;
  description: string;
  proof_url?: string;
}

const Finance = () => {
  const { userRole } = useOutletContext<{ userRole: string }>();
  
  // HAK AKSES
  const canAdd = userRole === 'super_admin' || userRole === 'admin';
  const canDelete = userRole === 'super_admin';
  const canDownload = userRole === 'super_admin' || userRole === 'admin';

  // STATE DATA
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // LOAD DATA
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('finance').select('*').order('date', { ascending: false });
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // STATE UI & FORM
  const [showModal, setShowModal] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [previewProof, setPreviewProof] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('all');
  const [formData, setFormData] = useState<{ date: string, type: string, category: string, amount: string, description: string }>({ 
    date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Wajib', amount: '', description: '' 
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedProofUrl, setUploadedProofUrl] = useState('');

  // --- FUNGSI FORMAT RUPIAH ---
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // --- FUNGSI CETAK PDF (PREVIEW MODE) ---
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // 1. SET FONT TIMES NEW ROMAN
    doc.setFont("times", "normal");

    // 2. KOP JUDUL
    doc.setFontSize(14);
    doc.setFont("times", "bold");
    doc.text("PERSATUAN GURU REPUBLIK INDONESIA (PGRI)", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text("RANTING KALIJAGA", 105, 22, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text("Laporan Keuangan & Kas Organisasi", 105, 28, { align: "center" });
    
    // Garis Pemisah
    doc.line(14, 32, 196, 32);

    // 3. TABEL DATA
    const tableBody = transactions.map((t, index) => [
      index + 1,
      t.date,
      t.category,
      t.description,
      t.type === 'income' ? formatRp(t.amount) : '-',
      t.type === 'outcome' ? formatRp(t.amount) : '-',
    ]);

    autoTable(doc, {
      startY: 35,
      head: [['No', 'Tanggal', 'Kategori', 'Keterangan', 'Masuk', 'Keluar']],
      body: tableBody,
      theme: 'grid',
      styles: { 
        font: "times", 
        fontSize: 9,
        cellPadding: 2
      },
      headStyles: { 
        fillColor: [153, 27, 27], // Warna Merah PGRI
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 }, // No
        4: { halign: 'right', fontStyle: 'bold', textColor: [22, 163, 74] }, // Masuk (Hijau)
        5: { halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] }, // Keluar (Merah)
      }
    });

    // 4. RINGKASAN SALDO (Di bawah tabel)
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // Hitung Total
    const totalInc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const totalOut = transactions.filter(t => t.type === 'outcome').reduce((a, b) => a + b.amount, 0);
    const balance = totalInc - totalOut;

    doc.setFontSize(10);
    doc.setFont("times", "bold");
    doc.text("RINGKASAN:", 14, finalY);
    doc.setFont("times", "normal");
    doc.text(`Total Pemasukan : ${formatRp(totalInc)}`, 14, finalY + 6);
    doc.text(`Total Pengeluaran : ${formatRp(totalOut)}`, 14, finalY + 12);
    doc.setFont("times", "bold");
    doc.text(`SALDO AKHIR      : ${formatRp(balance)}`, 14, finalY + 18);

    // 5. TANDA TANGAN (Standar Organisasi)
    const signY = finalY + 30;
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFont("times", "normal");
    doc.text("Mengetahui,", 30, signY, { align: "center" });
    doc.text("Ketua Ranting", 30, signY + 5, { align: "center" });
    doc.text("( ........................... )", 30, signY + 25, { align: "center" });

    doc.text(`Cirebon, ${today}`, 170, signY, { align: "center" });
    doc.text("Bendahara", 170, signY + 5, { align: "center" });
    doc.text("( ........................... )", 170, signY + 25, { align: "center" });

    // --- PERUBAHAN DI SINI: PREVIEW DI TAB BARU ---
    // Mengubah PDF menjadi URL Blob agar bisa dibuka di browser
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // --- KOMPRESI GAMBAR ---
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error('Gagal')); }, 'image/jpeg', 0.6); 
        } else reject(new Error('Context null'));
      };
      img.onerror = reject;
    });
  };

  // HANDLERS
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `finance-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('transfer-proofs').upload(fileName, compressed, { contentType: 'image/jpeg' });
      if (!error) {
        const { data } = supabase.storage.from('transfer-proofs').getPublicUrl(fileName);
        setUploadedProofUrl(data.publicUrl);
      }
    } catch (e) { alert('Gagal upload'); }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploading) return alert('Tunggu upload...');
    const { error } = await supabase.from('finance').insert([{
      date: formData.date, type: formData.type as 'income' | 'outcome', category: formData.category,
      amount: Number(formData.amount), description: formData.description, proof_url: uploadedProofUrl
    }]);
    if (!error) {
      setShowModal(false); fetchData(); setUploadedProofUrl('');
      setFormData({ date: new Date().toISOString().split('T')[0], type: 'income', category: 'Iuran Wajib', amount: '', description: '' });
      alert('Berhasil disimpan!');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Hapus permanen?')) {
      const { error } = await supabase.from('finance').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Keuangan");
    XLSX.writeFile(wb, `Laporan_Keuangan_PGRI.xlsx`);
  };

  // PERHITUNGAN TOTAL
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'outcome').reduce((sum, t) => sum + Number(t.amount), 0);
  const currentBalance = totalIncome - totalExpense;
  const filteredTransactions = transactions.filter(t => filterType === 'all' || (filterType === 'income' ? t.type === 'income' : t.type === 'outcome'));

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-700" size={48} /></div>;

  return (
    <div className="space-y-6 relative animate-in fade-in duration-300">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Laporan Keuangan</h1><p className="text-gray-500 text-sm italic">Transparansi Pengelolaan Kas Organisasi</p></div>
        <div className="flex gap-3 relative">
          {canDownload && (
            <div className="relative">
               <button onClick={() => setShowExportMenu(!showExportMenu)} className="bg-white text-green-700 border border-green-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-50 shadow-sm text-sm font-bold"><Download size={18} /> <span className="hidden sm:inline">Download</span> <ChevronDown size={14} /></button>
               {showExportMenu && (
                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-20 overflow-hidden">
                   <button onClick={exportToExcel} className="w-full text-left px-4 py-3 hover:bg-green-50 text-gray-700 text-sm font-bold"><FileSpreadsheet size={16} className="inline mr-2"/> Excel (.xlsx)</button>
                   {/* TOMBOL CETAK PDF (Preview) */}
                   <button onClick={generatePDF} className="w-full text-left px-4 py-3 hover:bg-red-50 text-gray-700 border-t text-sm font-bold"><Printer size={16} className="inline mr-2"/> Preview PDF</button>
                 </div>
               )}
            </div>
          )}
          {canAdd && <button onClick={() => setShowModal(true)} className="bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-800 shadow-md text-sm font-bold"><Plus size={18} /> <span>Catat Transaksi</span></button>}
        </div>
      </div>

      {/* CARDS SALDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"><div className="absolute top-0 right-0 p-4 opacity-10"><Wallet size={64} /></div><p className="text-indigo-100 text-xs font-bold uppercase mb-1 tracking-wider">Saldo Kas Saat Ini</p><h2 className="text-3xl font-bold">{formatRp(currentBalance)}</h2></div>
        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm flex items-center justify-between"><div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Pemasukan</p><h3 className="text-2xl font-bold text-green-600">{formatRp(totalIncome)}</h3></div><div className="bg-green-50 p-3 rounded-full text-green-600"><TrendingUp size={24} /></div></div>
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between"><div><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Pengeluaran</p><h3 className="text-2xl font-bold text-red-600">{formatRp(totalExpense)}</h3></div><div className="bg-red-50 p-3 rounded-full text-red-600"><TrendingDown size={24} /></div></div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase"><ArrowRightLeft size={18} /> Riwayat Transaksi</h3>
          <div className="flex items-center gap-2"><Filter size={16} className="text-gray-400" /><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white border border-gray-300 text-gray-600 text-xs font-bold rounded-lg p-2 outline-none"><option value="all">Semua</option><option value="income">Pemasukan (+)</option><option value="expense">Pengeluaran (-)</option></select></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-xs uppercase font-bold text-gray-500">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Bukti</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 italic">Belum ada data transaksi.</td></tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-600 whitespace-nowrap font-mono text-xs">{t.date}</td>
                    <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${t.type === 'income' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{t.category}</span></td>
                    <td className="p-4 text-gray-800 font-medium">{t.description}</td>
                    <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+ ' : '- '} {formatRp(t.amount)}</td>
                    <td className="p-4 text-center">{t.proof_url ? <button onClick={() => setPreviewProof(t.proof_url || null)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors"><Eye size={18} /></button> : <span className="text-gray-300 text-xs">-</span>}</td>
                    <td className="p-4 text-center">{canDelete ? <button onClick={() => handleDelete(t.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"><Trash2 size={16} /></button> : <Lock size={14} className="text-gray-300 mx-auto"/>}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT TRANSAKSI */}
      {canAdd && showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg uppercase text-gray-800">Catat Transaksi</h3><button onClick={() => setShowModal(false)}><X size={20}/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button type="button" onClick={() => setFormData({...formData, type: 'income', category: 'Iuran Wajib'})} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.type === 'income' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pemasukan</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'outcome', category: 'ATK & Operasional'})} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${formData.type === 'outcome' ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Pengeluaran</button>
                </div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tanggal</label><input type="date" className="w-full p-2 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Kategori</label><select className="w-full p-2 border rounded-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>{formData.type === 'income' ? ['Iuran Wajib', 'Sumbangan', 'Dana Sosial', 'Lainnya'].map(o=><option key={o}>{o}</option>) : ['ATK & Operasional', 'Konsumsi', 'Transport', 'Dana Sosial', 'Lainnya'].map(o=><option key={o}>{o}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nominal (Rp)</label><input type="number" className="w-full p-2 border rounded-lg font-mono font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} /></div>
                <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Keterangan</label><input type="text" className="w-full p-2 border rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
                
                <div className="border border-dashed border-gray-300 p-3 rounded-lg bg-gray-50 text-center relative hover:bg-gray-100">
                   <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                   <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">{uploadedProofUrl ? <span className="text-green-600 font-bold flex items-center gap-1"><FileText size={14}/> File Siap</span> : uploading ? <span className="text-indigo-600 font-bold flex items-center gap-1"><Loader2 size={14} className="animate-spin"/> Mengupload...</span> : <><Upload size={16}/> Upload Bukti</>}</div>
                </div>

                <button type="submit" disabled={uploading} className="w-full bg-indigo-700 hover:bg-indigo-800 text-white py-3 rounded-lg font-bold shadow-lg mt-2 uppercase tracking-wide disabled:opacity-50">{uploading ? 'Tunggu Upload...' : 'Simpan Transaksi'}</button>
              </form>
           </div>
        </div>
      )}

      {/* MODAL PREVIEW BUKTI */}
      {previewProof && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setPreviewProof(null)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <button onClick={() => setPreviewProof(null)} className="absolute top-4 right-4 text-white hover:text-red-400 bg-white/20 p-2 rounded-full z-50"><X size={32}/></button>
            <img src={previewProof} alt="Bukti Transaksi" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;