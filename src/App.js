import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── PALETTE ───────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F2EC", card: "#FFFFFF", primary: "#1C3A2A",
  amber: "#C97E1A", amberLight: "#FEF6E7",
  red: "#B93C22", redLight: "#FEF0ED",
  green: "#276130", greenLight: "#EAF4EC",
  blue: "#1A5276", blueLight: "#EAF2FB",
  purple: "#5B2D8E", purpleLight: "#F3EEF9",
  border: "#DDD5C8", text: "#1E1E1E",
  textSub: "#6B6355", textLight: "#9E9487",
};

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────
const T = {
  id: {
    nav: { rawmat: "Bahan Baku", production: "Produksi", stock: "Stok" },
    langToggle: "切换中文",
    common: { save: "Simpan", cancel: "Batal", date: "Tanggal", notes: "Catatan", loading: "Memuat...", noData: "Belum ada data", allMonths: "Semua Bulan", thisMonth: "Bulan Ini", exportBtn: "Export Laporan", all: "Semua", update: "Update" },
    rawmat: {
      appName: "Penerimaan Bahan Baku", addBtn: "+ Tambah Kiriman",
      common: { nomorKiriman: "No. Kiriman", supplier: "Supplier", type: "Jenis" },
      fields: {
        sjVol: "Kubikasi Surat Jalan", tallyLog: "Hasil Tally LOG", tallyFinal: "Hasil Tally Final",
        tallyFinalHint: "Kosongkan jika tidak ada negosiasi — akan mengikuti Tally LOG",
        gesek: "Hasil Gesek", gesekDate: "Tanggal Gesek", rendemen: "Rendemen", rendemenHint: "Gesek ÷ Final × 100",
        tallyRST: "Hasil Tally RST", finalRST: "Kubikasi Final",
        finalRSTHint: "Kosongkan jika tidak ada negosiasi — akan mengikuti Tally",
        effectiveFinal: "Kubikasi Final (Dibayar)", diffVsSJ: "Selisih vs SJ", diffVsFinal: "Selisih Gesek vs Final",
      },
      status: { sj: "SJ Masuk", tally: "Tally Selesai", final: "Final", gesek: "Gesek Selesai" },
      steps: { LOG: ["SJ", "Tally LOG", "Tally Final", "Gesek"], RST: ["SJ", "Tally", "Final"] },
      table: { date: "Tanggal", nomorKiriman: "No. Kiriman", supplier: "Supplier", type: "Jenis", sj: "SJ (m³)", tally: "Tally (m³)", final: "Final (m³)", gesek: "Gesek (m³)", rendemen: "Rendemen %", status: "Status" },
      summary: { logSJ: "LOG · SJ", logFinal: "LOG · Final", rstSJ: "RST · SJ", rstFinal: "RST · Final", pendingTally: "Pending Tally", pendingFinal: "Pending Final", kiriman: "kiriman", gesek: "Gesek" },
      modalTitle: { add: "Tambah Kiriman Baru", updateLog: "Update Data LOG", updateRST: "Update Data RST" },
      export: { title: "Laporan Penerimaan Bahan Baku", copy: "Salin", copied: "Tersalin!", print: "Print", detail: "Detail Kiriman", avgRendemen: "Rata-rata Rendemen" },
      filter: { allSuppliers: "Semua Supplier" },
    },
    production: {
      appName: "Laporan Produksi", addBtn: "+ Tambah Produksi",
      form: {
        shift: "Shift", jamKerja: "Jam Kerja", inputRST: "Input RST (m³)",
        outputPlaner: "Output Planer (m³)", outputPit: "Output Pit (m³)", outputBlok: "Output Blok Jadi (m³)",
        jumlahBlok: "Jumlah Blok", rejectedM3: "WIP Rejected / Door Core (m³)", glueKg: "Glue Used (kg)",
      },
      calc: { title: "Kalkulasi Otomatis", overallYield: "Overall Yield %", planerYield: "Planer Yield %", rejectRate: "Reject Rate %", m3PerJam: "m³/Jam", gluePerm3: "Glue/m³ (kg)" },
      table: { date: "Tanggal", shift: "Shift", inputRST: "Input RST (m³)", outputPlaner: "Output Planer (m³)", outputPit: "Output Pit (m³)", outputBlok: "Output Blok", rejected: "Rejected (m³)", glue: "Glue (kg)", yieldPct: "Yield %", planerYield: "Planer %", rejectRate: "Reject %", m3Jam: "m³/Jam", gluem3: "Glue/m³" },
      summary: { totalInput: "Total Input RST", totalOutput: "Total Output Blok", totalBlok: "Total Blok", avgYield: "Avg Yield %", avgPlanerYield: "Avg Planer Yield %", avgM3Jam: "Avg m³/Jam", avgGluem3: "Avg Glue/m³", totalDays: "Hari Produksi" },
      export: { title: "Laporan Produksi", copy: "Salin", copied: "Tersalin!", print: "Print", detail: "Detail Produksi Harian" },
    },
    stock: {
      appName: "Stok Harian", addBtn: "+ Tambah Entry Stok", updateBtn: "Update",
      opening: { btn: "Set Stok Awal", title: "Stok Awal", bjLabel: "Barang Jadi Awal (m³)", hint: "Input sekali saat pertama kali menggunakan sistem", notSet: "Stok awal belum diset", notSetHint: "Set stok awal sebelum memulai" },
      auto: { label: "⚡ Otomatis dari modul lain", incomingRST: "Masuk RST", incomingGesek: "Masuk LOG Gesek", totalIncoming: "Total Masuk", prodInput: "Input Produksi", prodOutput: "Output Produksi", prevBJ: "Barang Jadi Kemarin" },
      manual: { label: "✏️ Input Manual", kdPIK: "KD PIK (m³)", kdLuar: "KD LUAR (m³)", rstKering: "RST KERING (m³)", wip: "WIP (m³)", ekspor: "EKSPOR KELUAR (m³)", eksporHint: "Kosongkan jika tidak ada ekspor hari ini" },
      calc: { kdTotal: "Total KD", bj: "BARANG JADI", netBJ: "Net Barang Jadi" },
      opname: { btn: "Koreksi Opname", title: "Koreksi Stock Opname", calculated: "Nilai Sistem", actual: "Nilai Aktual (Fisik)", variance: "Selisih", hint: "Kosongkan field yang tidak dikoreksi — akan mengikuti nilai sistem", label: "⚖️ OPNAME" },
      table: { date: "Tanggal", inRST: "Masuk RST", inGesek: "Masuk Gesek", totalIn: "Total Masuk", kdPIK: "KD PIK", kdLuar: "KD LUAR", kdTotal: "Total KD", rstKering: "RST KERING", prodInput: "Input Prod", prodOutput: "Output Prod", wip: "WIP", ekspor: "EKSPOR", netBJ: "Net BJ" },
      summary: { rstKering: "RST KERING", kdTotal: "Total KD", wip: "WIP", netBJ: "Net Barang Jadi", lastIncoming: "Total Masuk", lastProdOutput: "Output Produksi" },
      noData: "Belum ada data stok",
    },
  },
  cn: {
    nav: { rawmat: "原材料", production: "生产", stock: "库存" },
    langToggle: "Bahasa ID",
    common: { save: "保存", cancel: "取消", date: "日期", notes: "备注", loading: "加载中...", noData: "暂无数据", allMonths: "全部月份", thisMonth: "本月", exportBtn: "导出报告", all: "全部", update: "更新" },
    rawmat: {
      appName: "原材料入库记录", addBtn: "+ 添加入库",
      common: { nomorKiriman: "送货编号", supplier: "供应商", type: "类型" },
      fields: {
        sjVol: "送货单方量", tallyLog: "原木盘点方量", tallyFinal: "最终盘点方量",
        tallyFinalHint: "如无协商，留空 — 将沿用原木盘点值",
        gesek: "锯切方量", gesekDate: "锯切日期", rendemen: "出材率", rendemenHint: "锯切 ÷ 最终 × 100",
        tallyRST: "RST盘点方量", finalRST: "最终结算方量",
        finalRSTHint: "如无协商，留空 — 将沿用盘点值",
        effectiveFinal: "最终结算方量", diffVsSJ: "与送货单差异", diffVsFinal: "锯切与最终差异",
      },
      status: { sj: "已入库", tally: "盘点完成", final: "已确认", gesek: "锯切完成" },
      steps: { LOG: ["送货单", "原木盘点", "最终盘点", "锯切"], RST: ["送货单", "盘点", "确认"] },
      table: { date: "日期", nomorKiriman: "送货编号", supplier: "供应商", type: "类型", sj: "送货单 (m³)", tally: "盘点 (m³)", final: "最终 (m³)", gesek: "锯切 (m³)", rendemen: "出材率 %", status: "状态" },
      summary: { logSJ: "原木·送货单", logFinal: "原木·最终", rstSJ: "RST·送货单", rstFinal: "RST·最终", pendingTally: "待盘点", pendingFinal: "待确认", kiriman: "笔", gesek: "锯切" },
      modalTitle: { add: "添加新入库", updateLog: "更新原木数据", updateRST: "更新RST数据" },
      export: { title: "原材料入库报告", copy: "复制", copied: "已复制!", print: "打印", detail: "入库明细", avgRendemen: "平均出材率" },
      filter: { allSuppliers: "全部供应商" },
    },
    production: {
      appName: "生产报告", addBtn: "+ 添加生产记录",
      form: {
        shift: "班次", jamKerja: "工时 (h)", inputRST: "RST投入量 (m³)",
        outputPlaner: "刨床产量 (m³)", outputPit: "坑位产量 (m³)", outputBlok: "成品方量 (m³)",
        jumlahBlok: "成品块数", rejectedM3: "废料 / 门芯料 (m³)", glueKg: "胶水用量 (kg)",
      },
      calc: { title: "自动计算", overallYield: "综合出材率 %", planerYield: "刨床出材率 %", rejectRate: "废品率 %", m3PerJam: "m³/小时", gluePerm3: "胶水/m³ (kg)" },
      table: { date: "日期", shift: "班次", inputRST: "RST投入 (m³)", outputPlaner: "刨床产量 (m³)", outputPit: "坑位产量 (m³)", outputBlok: "成品", rejected: "废料 (m³)", glue: "胶水 (kg)", yieldPct: "出材率 %", planerYield: "刨床 %", rejectRate: "废品率 %", m3Jam: "m³/时", gluem3: "胶水/m³" },
      summary: { totalInput: "RST总投入", totalOutput: "成品总量", totalBlok: "总块数", avgYield: "平均出材率 %", avgPlanerYield: "刨床平均出材率 %", avgM3Jam: "平均m³/小时", avgGluem3: "平均胶水/m³", totalDays: "生产天数" },
      export: { title: "生产报告", copy: "复制", copied: "已复制!", print: "打印", detail: "每日生产明细" },
    },
    stock: {
      appName: "每日库存", addBtn: "+ 添加库存记录", updateBtn: "更新",
      opening: { btn: "设置期初库存", title: "期初库存", bjLabel: "期初成品库存 (m³)", hint: "首次使用时填写一次即可", notSet: "未设置期初库存", notSetHint: "请先设置期初库存" },
      auto: { label: "⚡ 自动从其他模块获取", incomingRST: "RST入库", incomingGesek: "锯切入库", totalIncoming: "总入库", prodInput: "生产投入", prodOutput: "生产产出", prevBJ: "昨日成品库存" },
      manual: { label: "✏️ 手动输入", kdPIK: "内部窑干 (m³)", kdLuar: "外部窑干 (m³)", rstKering: "已干RST (m³)", wip: "在制品 (m³)", ekspor: "出口扣减 (m³)", eksporHint: "当日无出口则留空" },
      calc: { kdTotal: "窑干合计", bj: "成品库存", netBJ: "净成品库存" },
      opname: { btn: "盘点修正", title: "库存盘点修正", calculated: "系统值", actual: "实际盘点值", variance: "差异", hint: "留空字段将保留系统值", label: "⚖️ 盘点" },
      table: { date: "日期", inRST: "RST入库", inGesek: "锯切入库", totalIn: "总入库", kdPIK: "内部窑干", kdLuar: "外部窑干", kdTotal: "窑干合计", rstKering: "已干RST", prodInput: "生产投入", prodOutput: "生产产出", wip: "在制品", ekspor: "出口", netBJ: "净成品" },
      summary: { rstKering: "已干RST", kdTotal: "窑干合计", wip: "在制品", netBJ: "净成品库存", lastIncoming: "总入库", lastProdOutput: "生产产出" },
      noData: "暂无库存数据",
    },
  },
};

// ─── SUPABASE HELPERS — RAW MATERIAL ───────────────────────────────────────
function toDbRawmat(r) {
  return {
    id: r.id, date: r.date, nomor_kiriman: r.nomorKiriman || null,
    supplier: r.supplier, type: r.type, sj_vol: r.sjVol || null,
    tally_log_vol: r.tallyLogVol || null, tally_final_vol: r.tallyFinalVol || null,
    gesek_vol: r.gesekVol || null, gesek_date: r.gesekDate || null,
    tally_vol: r.tallyVol || null, final_vol: r.finalVol || null,
    rendemen: r.rendemen || null, notes: r.notes || null,
  };
}
function fromDbRawmat(r) {
  return {
    id: r.id, date: r.date, nomorKiriman: r.nomor_kiriman,
    supplier: r.supplier, type: r.type, sjVol: r.sj_vol,
    tallyLogVol: r.tally_log_vol, tallyFinalVol: r.tally_final_vol,
    gesekVol: r.gesek_vol, gesekDate: r.gesek_date,
    tallyVol: r.tally_vol, finalVol: r.final_vol,
    rendemen: r.rendemen, notes: r.notes,
  };
}

// ─── SUPABASE HELPERS — PRODUCTION ─────────────────────────────────────────
function toDbProd(r) {
  return {
    id: r.id, date: r.date, shift: r.shift,
    jam_kerja: r.jamKerja || null,
    input_rst_line1: r.inputRSTLine1 || null, input_rst_line2: r.inputRSTLine2 || null,
    output_planer_line1: r.outputPlanerLine1 || null, output_planer_line2: r.outputPlanerLine2 || null,
    output_pit: r.outputPit || null,
    output_blok: r.outputBlok || null, jumlah_blok: r.jumlahBlok || null,
    rejected_m3: r.rejectedM3 || null, glue_kg: r.glueKg || null,
    overall_yield: r.overallYield || null, planer_yield: r.planerYield || null,
    reject_rate: r.rejectRate || null, m3_per_jam: r.m3PerJam || null,
    glue_per_m3: r.gluePerM3 || null, notes: r.notes || null,
  };
}
function fromDbProd(r) {
  return {
    id: r.id, date: r.date, shift: r.shift,
    jamKerja: r.jam_kerja,
    inputRSTLine1: r.input_rst_line1, inputRSTLine2: r.input_rst_line2,
    outputPlanerLine1: r.output_planer_line1, outputPlanerLine2: r.output_planer_line2,
    outputPit: r.output_pit,
    outputBlok: r.output_blok, jumlahBlok: r.jumlah_blok,
    rejectedM3: r.rejected_m3, glueKg: r.glue_kg,
    overallYield: r.overall_yield, planerYield: r.planer_yield,
    rejectRate: r.reject_rate, m3PerJam: r.m3_per_jam,
    gluePerM3: r.glue_per_m3, notes: r.notes,
  };
}

// ─── UTILS ─────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().split("T")[0];
const currentMonth = () => new Date().toISOString().slice(0, 7);
const f2 = (n, dec = 2) => (n != null && n !== "" && !isNaN(n)) ? Number(n).toFixed(dec) : "—";
const toNum = (v) => (v !== "" && v != null && !isNaN(v)) ? +v : null;

function getRawmatStatus(r) {
  if (r.type === "LOG") {
    if (r.gesekVol != null) return "gesek";
    if (r.tallyFinalVol != null) return "final";
    if (r.tallyLogVol != null) return "tally";
    return "sj";
  } else {
    if (r.finalVol != null) return "final";
    if (r.tallyVol != null) return "tally";
    return "sj";
  }
}
function getEffectiveFinal(r) {
  if (r.type === "LOG") return r.tallyFinalVol ?? r.tallyLogVol ?? null;
  return r.finalVol ?? r.tallyVol ?? null;
}
function getTally(r) {
  return r.type === "LOG" ? r.tallyLogVol : r.tallyVol;
}
function calcProdMetrics(form) {
  const rst1 = toNum(form.inputRSTLine1) || 0;
  const rst2 = toNum(form.inputRSTLine2) || 0;
  const rst = rst1 + rst2 || null;
  const planer1 = toNum(form.outputPlanerLine1) || 0;
  const planer2 = toNum(form.outputPlanerLine2) || 0;
  const planer = planer1 + planer2 || null;
  const blok = toNum(form.outputBlok);
  const rejected = toNum(form.rejectedM3) || 0;
  const glue = toNum(form.glueKg);
  const hours = toNum(form.jamKerja);
  return {
    overallYield: rst && blok ? ((blok / rst) * 100).toFixed(2) : null,
    planerYield: rst && planer ? ((planer / rst) * 100).toFixed(2) : null,
    rejectRate: rst && rejected ? ((rejected / rst) * 100).toFixed(2) : null,
    m3PerJam: blok && hours ? (blok / hours).toFixed(3) : null,
    gluePerM3: glue && blok ? (glue / blok).toFixed(3) : null,
  };
}

// ─── SHARED STYLES ─────────────────────────────────────────────────────────
const S = {
  card: { background: "#FFF", borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 },
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 },
  btn: (bg = C.primary) => ({ background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }),
  btnSm: (bg = C.primary) => ({ background: bg, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }),
  btnOut: { background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  th: { padding: "10px 12px", fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}`, textAlign: "left", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", fontSize: 13, color: C.text, borderBottom: `1px solid #F0EAE0`, verticalAlign: "middle" },
  badge: (col) => {
    const m = { green: [C.greenLight, C.green], amber: [C.amberLight, C.amber], red: [C.redLight, C.red], blue: [C.blueLight, C.blue], purple: [C.purpleLight, C.purple] };
    const [bg, tc] = m[col] || m.blue;
    return { background: bg, color: tc, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" };
  },
  statCard: (accent) => ({ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, padding: "14px 16px" }),
};

// ─── SHARED UI ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 540, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: C.primary }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.textSub }}>×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );
}
function Field({ label, hint, children }) {
  return <div style={{ marginBottom: 14 }}><label style={S.label}>{label}</label>{children}{hint && <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>{hint}</div>}</div>;
}
function InfoBox({ label, value, sub, color = C.primary, bg = "#F9F7F4" }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function DiffPill({ val, base, label }) {
  if (val == null || base == null) return null;
  const diff = +val - +base, pos = diff >= 0;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: pos ? C.greenLight : C.redLight, borderRadius: 8, padding: "6px 12px", marginBottom: 14 }}>
      <span style={{ fontSize: 12, color: C.textSub }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: pos ? C.green : C.red }}>{pos ? "+" : ""}{f2(diff)} m³</span>
    </div>
  );
}
function MonthBar({ selectedMonth, setSelectedMonth, onExport, t, lang, resetFn }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      <input type="month" style={{ ...S.input, width: "auto", fontWeight: 700, fontSize: 14, color: C.primary }} value={selectedMonth === "all" ? "" : selectedMonth} onChange={e => { setSelectedMonth(e.target.value || "all"); if (resetFn) resetFn(); }} />
      <button onClick={() => { setSelectedMonth("all"); if (resetFn) resetFn(); }} style={{ background: selectedMonth === "all" ? C.primary : C.card, color: selectedMonth === "all" ? "#fff" : C.textSub, border: `1.5px solid ${selectedMonth === "all" ? C.primary : C.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.common.allMonths}</button>
      <button onClick={() => { setSelectedMonth(currentMonth()); if (resetFn) resetFn(); }} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textSub }}>{t.common.thisMonth}</button>
      <div style={{ marginLeft: "auto" }}><button style={S.btn(C.green)} onClick={onExport}>{t.common.exportBtn}</button></div>
    </div>
  );
}
function ErrorBar({ error, onRetry }) {
  if (!error) return null;
  return <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: C.red, fontWeight: 600 }}>⚠️ {error} <button onClick={onRetry} style={{ marginLeft: 12, background: C.red, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Retry</button></div>;
}

// ─── RAW MATERIAL COMPONENTS ───────────────────────────────────────────────
function StepProgress({ type, status, t }) {
  const steps = t.rawmat.steps[type];
  const order = type === "LOG" ? ["sj", "tally", "final", "gesek"] : ["sj", "tally", "final"];
  const cur = order.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {steps.map((step, i) => {
        const done = i <= cur;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: done ? C.green : "#DDD5C8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {done && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
              </div>
              <span style={{ fontSize: 10, color: done ? C.green : C.textLight, fontWeight: 700, whiteSpace: "nowrap" }}>{step}</span>
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < cur ? C.green : "#DDD5C8", margin: "0 4px", marginBottom: 14, minWidth: 16 }} />}
          </div>
        );
      })}
    </div>
  );
}
function AddRawmatModal({ onClose, onSave, t, filterType, saving }) {
  const [selectedType, setSelectedType] = useState(filterType === "all" ? "RST" : filterType);
  const [form, setForm] = useState({ date: today(), nomorKiriman: "", supplier: "", sjVol: "", notes: "" });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.supplier.trim() && form.sjVol;
  const handleSave = () => { if (!valid) return; onSave({ ...form, id: uid(), type: selectedType, sjVol: +form.sjVol, tallyVol: null, finalVol: null, tallyLogVol: null, tallyFinalVol: null, gesekVol: null, gesekDate: null }); };
  return (
    <Modal title={t.rawmat.modalTitle.add} onClose={onClose}>
      {filterType === "all" ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["RST", "LOG"].map(tp => <button key={tp} onClick={() => setSelectedType(tp)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${selectedType === tp ? C.primary : C.border}`, background: selectedType === tp ? C.primary : "#fff", color: selectedType === tp ? "#fff" : C.textSub, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>{tp}</button>)}
        </div>
      ) : <div style={{ marginBottom: 16 }}><span style={S.badge(selectedType === "LOG" ? "amber" : "blue")}>{selectedType}</span></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label={t.common.date}><input type="date" style={S.input} value={form.date} onChange={e => upd("date", e.target.value)} /></Field>
        <Field label={t.rawmat.common.nomorKiriman}><input style={S.input} value={form.nomorKiriman} onChange={e => upd("nomorKiriman", e.target.value)} /></Field>
        <Field label={t.rawmat.common.supplier}><input style={S.input} value={form.supplier} onChange={e => upd("supplier", e.target.value)} /></Field>
        <Field label={`${t.rawmat.fields.sjVol} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.sjVol} onChange={e => upd("sjVol", e.target.value)} /></Field>
      </div>
      <Field label={t.common.notes}><textarea style={{ ...S.input, height: 60 }} value={form.notes} onChange={e => upd("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={S.btnOut} onClick={onClose}>{t.common.cancel}</button>
        <button style={S.btn(valid && !saving ? C.primary : "#aaa")} onClick={handleSave} disabled={saving}>{saving ? "..." : t.common.save}</button>
      </div>
    </Modal>
  );
}
function UpdateRawmatModal({ record, onClose, onSave, t, saving }) {
  const [form, setForm] = useState({ tallyLogVol: record.tallyLogVol ?? "", tallyFinalVol: record.tallyFinalVol ?? "", gesekVol: record.gesekVol ?? "", gesekDate: record.gesekDate ?? "", tallyVol: record.tallyVol ?? "", finalVol: record.finalVol ?? "", notes: record.notes ?? "" });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const status = getRawmatStatus(record);
  const effFinalLOG = toNum(form.tallyFinalVol) ?? toNum(form.tallyLogVol) ?? null;
  const effFinalRST = toNum(form.finalVol) ?? toNum(form.tallyVol) ?? null;
  const rendemen = (toNum(form.gesekVol) != null && effFinalLOG != null && effFinalLOG > 0) ? ((toNum(form.gesekVol) / effFinalLOG) * 100).toFixed(2) : null;
  const handleSave = () => onSave({ ...record, date: record.date, tallyLogVol: toNum(form.tallyLogVol), tallyFinalVol: toNum(form.tallyFinalVol), gesekVol: toNum(form.gesekVol), gesekDate: form.gesekDate || null, tallyVol: toNum(form.tallyVol), finalVol: toNum(form.finalVol), notes: form.notes, rendemen: rendemen ? +rendemen : null });
  const title = record.type === "LOG" ? t.rawmat.modalTitle.updateLog : t.rawmat.modalTitle.updateRST;
  return (
    <Modal title={`${title} — ${record.supplier}`} onClose={onClose}>
      <div style={{ background: C.bg, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}><StepProgress type={record.type} status={status} t={t} /></div>
      <InfoBox label={`📄 ${t.rawmat.fields.sjVol}`} value={`${f2(record.sjVol, 4)} m³`} bg="#F9F7F4" />
      {record.type === "LOG" ? (
        <>
          <Field label={`${t.rawmat.fields.tallyLog} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.tallyLogVol} onChange={e => upd("tallyLogVol", e.target.value)} /></Field>
          <DiffPill val={toNum(form.tallyLogVol)} base={record.sjVol} label={t.rawmat.fields.diffVsSJ} />
          <Field label={`${t.rawmat.fields.tallyFinal} (m³)`} hint={t.rawmat.fields.tallyFinalHint}><input type="number" step="0.0001" style={S.input} value={form.tallyFinalVol} placeholder={form.tallyLogVol || ""} onChange={e => upd("tallyFinalVol", e.target.value)} /></Field>
          {effFinalLOG != null && <InfoBox label={`✅ ${t.rawmat.fields.effectiveFinal}`} value={`${f2(effFinalLOG, 4)} m³`} sub={`${t.rawmat.fields.diffVsSJ}: ${(effFinalLOG - record.sjVol >= 0 ? "+" : "")}${f2(effFinalLOG - record.sjVol, 4)} m³`} color={C.green} bg={C.greenLight} />}
          <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label={`${t.rawmat.fields.gesek} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.gesekVol} onChange={e => upd("gesekVol", e.target.value)} /></Field>
            <Field label={t.rawmat.fields.gesekDate}><input type="date" style={S.input} value={form.gesekDate} onChange={e => upd("gesekDate", e.target.value)} /></Field>
          </div>
          <DiffPill val={toNum(form.gesekVol)} base={effFinalLOG} label={t.rawmat.fields.diffVsFinal} />
          {rendemen != null && <InfoBox label={`🌿 ${t.rawmat.fields.rendemen}`} value={`${rendemen}%`} sub={t.rawmat.fields.rendemenHint} color={+rendemen >= 60 ? C.green : +rendemen >= 50 ? C.amber : C.red} bg={+rendemen >= 60 ? C.greenLight : +rendemen >= 50 ? C.amberLight : C.redLight} />}
        </>
      ) : (
        <>
          <Field label={`${t.rawmat.fields.tallyRST} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.tallyVol} onChange={e => upd("tallyVol", e.target.value)} /></Field>
          <DiffPill val={toNum(form.tallyVol)} base={record.sjVol} label={t.rawmat.fields.diffVsSJ} />
          <Field label={`${t.rawmat.fields.finalRST} (m³)`} hint={t.rawmat.fields.finalRSTHint}><input type="number" step="0.0001" style={S.input} value={form.finalVol} placeholder={form.tallyVol || ""} onChange={e => upd("finalVol", e.target.value)} /></Field>
          {effFinalRST != null && <InfoBox label={`✅ ${t.rawmat.fields.effectiveFinal}`} value={`${f2(effFinalRST, 4)} m³`} sub={`${t.rawmat.fields.diffVsSJ}: ${(effFinalRST - record.sjVol >= 0 ? "+" : "")}${f2(effFinalRST - record.sjVol, 4)} m³`} color={C.green} bg={C.greenLight} />}
        </>
      )}
      <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
      <Field label={t.common.notes}><textarea style={{ ...S.input, height: 56 }} value={form.notes} onChange={e => upd("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={S.btnOut} onClick={onClose}>{t.common.cancel}</button>
        <button style={S.btn(saving ? "#aaa" : C.primary)} onClick={handleSave} disabled={saving}>{saving ? "..." : t.common.save}</button>
      </div>
    </Modal>
  );
}
// ─── PRINT UTILITY ─────────────────────────────────────────────────────────
const PRINT_CSS = `
  @page { size: landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 10px; color: #1E1E1E; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .header { margin-bottom: 12px; border-bottom: 2px solid #1C3A2A; padding-bottom: 8px; }
  .header h1 { font-size: 15px; font-weight: 800; color: #1C3A2A; }
  .header p { font-size: 10px; color: #6B6355; margin-top: 2px; }
  .summary { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .sbox { border-left: 3px solid #1C3A2A; padding: 6px 10px; background: #F5F2EC; flex: 1; min-width: 90px; }
  .sbox .sl { font-size: 7px; font-weight: 700; text-transform: uppercase; color: #6B6355; margin-bottom: 2px; }
  .sbox .sv { font-size: 13px; font-weight: 800; color: #1C3A2A; }
  .sbox .ss { font-size: 8px; color: #6B6355; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { padding: 5px 6px; font-size: 8px; font-weight: 700; text-transform: uppercase; background: #F5F2EC; border-bottom: 1.5px solid #DDD5C8; text-align: left; white-space: nowrap; }
  td { padding: 5px 6px; font-size: 9px; border-bottom: 1px solid #F0EAE0; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .sub { font-size: 8px; color: #6B6355; margin-top: 1px; }
  .bold { font-weight: 700; }
  .green { color: #276130; font-weight: 700; }
  .red { color: #B93C22; font-weight: 700; }
  .amber { color: #C97E1A; font-weight: 700; }
  .blue { color: #1A5276; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 8px; font-weight: 700; }
  .ba { background: #FEF6E7; color: #C97E1A; }
  .bb { background: #EAF2FB; color: #1A5276; }
  .bg { background: #EAF4EC; color: #276130; }
`;

function printHTML(title, bodyHTML) {
  const w = window.open("", "_blank");
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>${PRINT_CSS}</style></head><body>${bodyHTML}<script>window.onload=function(){window.print();}</script></body></html>`);
  w.document.close();
}

function RawmatExportModal({ records, month, t, onClose }) {
  const monthLabel = month === "all" ? t.common.allMonths : month;
  const logs = records.filter(r => r.type === "LOG"), rsts = records.filter(r => r.type === "RST");
  const totalSJLog = logs.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalFinalLog = logs.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const totalGesek = logs.reduce((a, r) => a + (r.gesekVol || 0), 0);
  const rendemenLogs = logs.filter(r => r.rendemen != null);
  const avgRendemen = rendemenLogs.length > 0 ? (rendemenLogs.reduce((a, r) => a + r.rendemen, 0) / rendemenLogs.length).toFixed(2) : null;
  const totalSJRST = rsts.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalFinalRST = rsts.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);

  const handlePrint = () => {
    const title = `${t.rawmat.export.title} - ${monthLabel}`;
    const rows = records.map(r => {
      const ef = getEffectiveFinal(r);
      const status = getRawmatStatus(r);
      return `<tr>
        <td>${r.date}</td>
        <td>${r.nomorKiriman || "—"}</td>
        <td class="bold">${r.supplier}</td>
        <td><span class="badge ${r.type === "LOG" ? "ba" : "bb"}">${r.type}</span></td>
        <td>${f2(r.sjVol, 4)}</td>
        <td>${r.type === "LOG" ? (r.tallyLogVol != null ? f2(r.tallyLogVol, 4) : "—") : (r.tallyVol != null ? f2(r.tallyVol, 4) : "—")}</td>
        <td class="bold">${ef != null ? f2(ef, 4) : "—"}</td>
        <td>${r.type === "LOG" && r.gesekVol != null ? `${f2(r.gesekVol, 4)}${r.gesekDate ? `<div class="sub">${r.gesekDate}</div>` : ""}` : "—"}</td>
        <td>${r.type === "LOG" && r.rendemen != null ? `<span class="${r.rendemen >= 60 ? "green" : r.rendemen >= 50 ? "amber" : "red"}">${r.rendemen.toFixed(2)}%</span>` : "—"}</td>
        <td><span class="badge ${status === "gesek" || status === "final" ? "bg" : status === "tally" ? "bb" : "ba"}">${t.rawmat.status[status]}</span></td>
      </tr>`;
    }).join("");

    const html = `
      <div class="header"><h1>${t.rawmat.export.title}</h1><p>Pioneer Wood · ${monthLabel} · ${new Date().toLocaleDateString()}</p></div>
      <div class="summary">
        <div class="sbox" style="border-color:#C97E1A"><div class="sl">LOG · ${logs.length} kiriman</div><div class="sv">${f2(totalSJLog, 4)} m³ <span style="font-size:10px;font-weight:400">SJ</span></div><div class="ss">Final: ${f2(totalFinalLog, 4)} m³ · Gesek: ${f2(totalGesek, 4)} m³${avgRendemen ? ` · Rendemen: ${avgRendemen}%` : ""}</div></div>
        <div class="sbox" style="border-color:#1A5276"><div class="sl">RST · ${rsts.length} kiriman</div><div class="sv">${f2(totalSJRST, 4)} m³ <span style="font-size:10px;font-weight:400">SJ</span></div><div class="ss">Final: ${f2(totalFinalRST, 4)} m³</div></div>
      </div>
      <h2 style="font-size:12px;font-weight:800;color:#1C3A2A;margin:16px 0 8px;text-transform:uppercase;letter-spacing:0.05em;">Detail Kiriman</h2>
      <table>
        <thead><tr><th>Tanggal</th><th>No. Kiriman</th><th>Supplier</th><th>Jenis</th><th>SJ (m³)</th><th>Tally (m³)</th><th>Final (m³)</th><th>Gesek (m³)</th><th>Rendemen %</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    printHTML(title, html);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div><div style={{ fontSize: 17, fontWeight: 800, color: C.primary }}>{t.rawmat.export.title}</div><div style={{ fontSize: 13, color: C.textSub }}>Pioneer Wood · {monthLabel}</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={S.btn(C.green)}>⬇ PDF</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.textSub }}>×</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: C.amberLight, borderRadius: 10, padding: 16, border: `1px solid ${C.amber}40` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.amber, marginBottom: 10 }}>LOG · {logs.length} {t.rawmat.summary.kiriman}</div>
              {[{ label: "SJ", val: totalSJLog }, { label: "Final", val: totalFinalLog }, { label: t.rawmat.summary.gesek, val: totalGesek }].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.amber}20` }}>
                  <span style={{ color: C.textSub }}>{row.label}</span><span style={{ fontWeight: 700 }}>{f2(row.val, 4)} m³</span>
                </div>
              ))}
              {avgRendemen && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 6 }}><span style={{ color: C.textSub }}>{t.rawmat.export.avgRendemen}</span><span style={{ fontWeight: 800, color: +avgRendemen >= 60 ? C.green : +avgRendemen >= 50 ? C.amber : C.red }}>{avgRendemen}%</span></div>}
            </div>
            <div style={{ background: C.blueLight, borderRadius: 10, padding: 16, border: `1px solid ${C.blue}40` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.blue, marginBottom: 10 }}>RST · {rsts.length} {t.rawmat.summary.kiriman}</div>
              {[{ label: "SJ", val: totalSJRST }, { label: "Final", val: totalFinalRST }].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.blue}20` }}>
                  <span style={{ color: C.textSub }}>{row.label}</span><span style={{ fontWeight: 700 }}>{f2(row.val, 4)} m³</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: C.bg }}>{[t.common.date, t.rawmat.table.nomorKiriman, t.rawmat.table.supplier, t.rawmat.table.type, t.rawmat.table.sj, t.rawmat.table.tally, t.rawmat.table.final, t.rawmat.table.gesek, t.rawmat.table.rendemen, t.rawmat.table.status].map((h, i) => <th key={i} style={{ ...S.th, fontSize: 10 }}>{h}</th>)}</tr></thead>
              <tbody>{records.map(r => { const ef = getEffectiveFinal(r); const status = getRawmatStatus(r); const tally = getTally(r); return (<tr key={r.id}><td style={{ ...S.td, fontSize: 12 }}>{r.date}</td><td style={{ ...S.td, fontSize: 12 }}>{r.nomorKiriman || "—"}</td><td style={{ ...S.td, fontSize: 12, fontWeight: 600 }}>{r.supplier}</td><td style={{ ...S.td, fontSize: 12 }}><span style={S.badge(r.type === "LOG" ? "amber" : "blue")}>{r.type}</span></td><td style={{ ...S.td, fontSize: 12 }}>{f2(r.sjVol, 4)}</td><td style={{ ...S.td, fontSize: 12 }}>{tally != null ? f2(tally, 4) : "—"}</td><td style={{ ...S.td, fontSize: 12, fontWeight: 700 }}>{ef != null ? f2(ef, 4) : "—"}</td><td style={{ ...S.td, fontSize: 12 }}>{r.type === "LOG" && r.gesekVol != null ? <div>{f2(r.gesekVol, 4)}{r.gesekDate && <div style={{ fontSize: 10, color: C.textLight }}>{r.gesekDate}</div>}</div> : "—"}</td><td style={{ ...S.td, fontSize: 12 }}>{r.type === "LOG" && r.rendemen != null ? <span style={{ fontWeight: 700, color: r.rendemen >= 60 ? C.green : r.rendemen >= 50 ? C.amber : C.red }}>{r.rendemen.toFixed(2)}%</span> : "—"}</td><td style={{ ...S.td, fontSize: 12 }}><span style={S.badge(status === "gesek" || status === "final" ? "green" : status === "tally" ? "blue" : "amber")}>{t.rawmat.status[status]}</span></td></tr>); })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RawmatModule({ t, lang }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [showExport, setShowExport] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase.from("deliveries").select("*").order("date", { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setRecords(data.map(fromDbRawmat)); setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const onAdd = async (rec) => { setSaving(true); const { error } = await supabase.from("deliveries").insert([toDbRawmat(rec)]); if (error) { alert("Error: " + error.message); setSaving(false); return; } await fetchRecords(); setSaving(false); setShowAdd(false); };
  const onUpdate = async (updated) => { setSaving(true); const { error } = await supabase.from("deliveries").update(toDbRawmat(updated)).eq("id", updated.id); if (error) { alert("Error: " + error.message); setSaving(false); return; } await fetchRecords(); setSaving(false); setEditing(null); };
  const onDelete = async (id) => { if (!window.confirm("Hapus data ini?")) return; const { error } = await supabase.from("deliveries").delete().eq("id", id); if (error) { alert("Error: " + error.message); return; } await fetchRecords(); };

  const monthRecords = selectedMonth === "all" ? records : records.filter(r => r.date && r.date.startsWith(selectedMonth));

  // First 4 boxes — always all suppliers
  const allLogs = monthRecords.filter(r => r.type === "LOG");
  const allRsts = monthRecords.filter(r => r.type === "RST");
  const totalSJLog = allLogs.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalSJRST = allRsts.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalFinalLog = allLogs.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const totalFinalRST = allRsts.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const totalGesek = allLogs.reduce((a, r) => a + (r.gesekVol || 0), 0);
  const pendingTally = monthRecords.filter(r => getRawmatStatus(r) === "sj").length;
  const pendingFinal = monthRecords.filter(r => getRawmatStatus(r) === "tally").length;

  // Supplier-specific boxes when supplier selected
  const supLogs = selectedSupplier === "all" ? [] : monthRecords.filter(r => r.type === "LOG" && r.supplier === selectedSupplier);
  const supRsts = selectedSupplier === "all" ? [] : monthRecords.filter(r => r.type === "RST" && r.supplier === selectedSupplier);
  const supLogFinal = supLogs.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const supGesek = supLogs.reduce((a, r) => a + (r.gesekVol || 0), 0);
  const supRendemenLogs = supLogs.filter(r => r.rendemen != null);
  const supAvgRendemen = supRendemenLogs.length > 0 ? (supRendemenLogs.reduce((a, r) => a + r.rendemen, 0) / supRendemenLogs.length).toFixed(2) : null;
  const supRstSJ = supRsts.reduce((a, r) => a + (r.sjVol || 0), 0);
  const supRstFinal = supRsts.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);

  const suppliers = [...new Set(monthRecords.map(r => r.supplier).filter(Boolean))].sort();
  const filtered = [...monthRecords].filter(r => filter === "all" || r.type === filter).filter(r => selectedSupplier === "all" || r.supplier === selectedSupplier).sort((a, b) => { const an = parseInt(a.nomorKiriman), bn = parseInt(b.nomorKiriman); if (isNaN(an) && isNaN(bn)) return 0; if (isNaN(an)) return 1; if (isNaN(bn)) return -1; return an - bn; });
  const statusBadgeColor = (r) => { const s = getRawmatStatus(r); return s === "gesek" || s === "final" ? "green" : s === "tally" ? "blue" : "amber"; };

  return (
    <div>
      <ErrorBar error={error} onRetry={fetchRecords} />
      <MonthBar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} onExport={() => setShowExport(true)} t={t} lang={lang} resetFn={() => setSelectedSupplier("all")} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: t.rawmat.summary.logSJ, val: f2(totalSJLog, 4), unit: "m³", sub: `${allLogs.length} ${t.rawmat.summary.kiriman}`, accent: C.amber },
          { label: t.rawmat.summary.logFinal, val: f2(totalFinalLog, 4), unit: "m³", sub: `${t.rawmat.summary.gesek}: ${f2(totalGesek, 4)} m³`, accent: C.green },
          { label: t.rawmat.summary.rstSJ, val: f2(totalSJRST, 4), unit: "m³", sub: `${allRsts.length} ${t.rawmat.summary.kiriman}`, accent: C.blue },
          { label: t.rawmat.summary.rstFinal, val: f2(totalFinalRST, 4), unit: "m³", accent: C.green },
          ...(selectedSupplier === "all" ? [
            { label: `⏳ ${t.rawmat.summary.pendingTally}`, val: pendingTally, unit: t.rawmat.summary.kiriman, accent: C.amber },
            { label: `⏳ ${t.rawmat.summary.pendingFinal}`, val: pendingFinal, unit: t.rawmat.summary.kiriman, accent: C.red },
          ] : [
            ...(supRsts.length > 0 ? [
              { label: `${selectedSupplier} · RST SJ`, val: f2(supRstSJ, 4), unit: "m³", accent: C.blue },
              { label: `${selectedSupplier} · RST Final`, val: f2(supRstFinal, 4), unit: "m³", accent: C.green },
            ] : []),
            ...(supLogs.length > 0 ? [
              { label: `${selectedSupplier} · LOG Final`, val: f2(supLogFinal, 4), unit: "m³", accent: C.amber },
              { label: `${selectedSupplier} · Gesek`, val: f2(supGesek, 4), unit: "m³", sub: supAvgRendemen ? `Rendemen: ${supAvgRendemen}%` : null, accent: C.green },
            ] : []),
          ]),
        ].map((c, i) => (
          <div key={i} style={S.statCard(c.accent)}>
            <div style={S.label}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{c.val} <span style={{ fontSize: 12, fontWeight: 400, color: C.textSub }}>{c.unit}</span></div>
            {c.sub && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "LOG", "RST"].map(f => <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.primary : C.card, color: filter === f ? "#fff" : C.textSub, border: `1.5px solid ${filter === f ? C.primary : C.border}`, borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{f === "all" ? t.common.all : f}</button>)}
          <select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} style={{ ...S.input, width: "auto", fontWeight: 600, fontSize: 13, color: selectedSupplier === "all" ? C.textSub : C.primary, border: `1.5px solid ${selectedSupplier === "all" ? C.border : C.primary}`, cursor: "pointer" }}>
            <option value="all">{t.rawmat.filter.allSuppliers}</option>
            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button style={S.btn()} onClick={() => setShowAdd(true)}>{t.rawmat.addBtn}</button>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 48, color: C.textLight }}>{t.common.loading}</div> : filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 64, color: C.textLight }}><div style={{ fontSize: 44, marginBottom: 12 }}>🪵</div><div style={{ fontWeight: 700, fontSize: 15 }}>{t.common.noData}</div></div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
            <thead><tr style={{ background: C.bg }}>{[t.common.date, t.rawmat.table.nomorKiriman, t.rawmat.table.supplier, t.rawmat.table.type, t.rawmat.table.sj, t.rawmat.table.tally, t.rawmat.table.final, t.rawmat.table.gesek, t.rawmat.table.rendemen, t.rawmat.table.status, ""].map((h, i) => <th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(r => {
                const effFinal = getEffectiveFinal(r), tally = getTally(r), status = getRawmatStatus(r);
                return (
                  <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={S.td}>{r.date}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: C.primary }}>{r.nomorKiriman || <span style={{ color: C.textLight }}>—</span>}</td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{r.supplier}</td>
                    <td style={S.td}><span style={S.badge(r.type === "LOG" ? "amber" : "blue")}>{r.type}</span></td>
                    <td style={S.td}>{f2(r.sjVol, 4)}</td>
                    <td style={S.td}>{tally != null ? f2(tally, 4) : <span style={{ color: C.textLight }}>—</span>}</td>
                    <td style={{ ...S.td, fontWeight: 700 }}>{effFinal != null ? f2(effFinal, 4) : <span style={{ color: C.textLight }}>—</span>}</td>
                    <td style={S.td}>{r.type === "LOG" ? (r.gesekVol != null ? <div><div>{f2(r.gesekVol, 4)}</div>{r.gesekDate && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{r.gesekDate}</div>}</div> : <span style={{ color: C.textLight }}>—</span>) : <span style={{ color: C.textLight }}>N/A</span>}</td>
                    <td style={S.td}>{r.type === "LOG" && r.rendemen != null ? <span style={{ fontWeight: 700, color: r.rendemen >= 60 ? C.green : r.rendemen >= 50 ? C.amber : C.red }}>{Number(r.rendemen).toFixed(2)}%</span> : <span style={{ color: C.textLight }}>—</span>}</td>
                    <td style={S.td}><span style={S.badge(statusBadgeColor(r))}>{t.rawmat.status[status]}</span></td>
                    <td style={S.td}><div style={{ display: "flex", gap: 6 }}><button style={S.btnSm(C.primary)} onClick={() => setEditing(r)}>{t.common.update}</button><button style={S.btnSm(C.red)} onClick={() => onDelete(r.id)}>✕</button></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && <AddRawmatModal t={t} filterType={filter} onClose={() => setShowAdd(false)} onSave={onAdd} saving={saving} />}
      {editing && <UpdateRawmatModal record={editing} t={t} onClose={() => setEditing(null)} onSave={onUpdate} saving={saving} />}
      {showExport && <RawmatExportModal records={filtered} month={selectedMonth} t={t} onClose={() => setShowExport(false)} />}
    </div>
  );
}

// ─── PRODUCTION COMPONENTS ─────────────────────────────────────────────────
function CalcPreview({ metrics, t }) {
  const items = [
    { label: t.production.calc.overallYield, val: metrics.overallYield, unit: "%", color: metrics.overallYield ? (+metrics.overallYield >= 40 ? C.green : C.red) : C.textLight },
    { label: t.production.calc.planerYield, val: metrics.planerYield, unit: "%", color: C.blue },
    { label: t.production.calc.rejectRate, val: metrics.rejectRate, unit: "%", color: metrics.rejectRate ? (+metrics.rejectRate > 10 ? C.red : C.amber) : C.textLight },
    { label: t.production.calc.m3PerJam, val: metrics.m3PerJam, unit: "", color: C.primary },
    { label: t.production.calc.gluePerm3, val: metrics.gluePerM3, unit: " kg", color: C.amber },
  ];
  return (
    <div style={{ background: C.greenLight, border: `1px solid ${C.green}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 10 }}>⚡ {t.production.calc.title}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: item.val ? item.color : C.textLight }}>{item.val ? `${item.val}${item.unit}` : "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
function ProductionForm({ initial, onClose, onSave, t, saving }) {
  const empty = { date: today(), shift: "1", jamKerja: "8", inputRSTLine1: "", inputRSTLine2: "", outputPlanerLine1: "", outputPlanerLine2: "", outputPit: "", outputBlok: "", jumlahBlok: "", rejectedM3: "", glueKg: "", notes: "" };
  const [form, setForm] = useState(initial || empty);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const metrics = calcProdMetrics(form);
  const valid = (form.inputRSTLine1 || form.inputRSTLine2) && form.outputBlok && form.jamKerja;
  const handleSave = () => { if (!valid) return; onSave({ ...form, id: initial?.id || uid(), ...metrics }); };
  const totalRST = (toNum(form.inputRSTLine1) || 0) + (toNum(form.inputRSTLine2) || 0);
  const totalPlaner = (toNum(form.outputPlanerLine1) || 0) + (toNum(form.outputPlanerLine2) || 0);
  return (
    <>
      <CalcPreview metrics={metrics} t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label={t.common.date}><input type="date" style={S.input} value={form.date} onChange={e => upd("date", e.target.value)} /></Field>
        <Field label={t.production.form.shift}><select style={S.input} value={form.shift} onChange={e => upd("shift", e.target.value)}><option value="1">Shift 1</option><option value="2">Shift 2</option><option value="3">Shift 3</option></select></Field>
        <Field label={t.production.form.jamKerja}><input type="number" step="0.5" style={S.input} value={form.jamKerja} onChange={e => upd("jamKerja", e.target.value)} /></Field>
      </div>
      <div style={{ background: "#F9F7F4", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", marginBottom: 10 }}>{t.production.form.inputRST}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Field label="Line 1 (m³)"><input type="number" step="0.01" style={S.input} value={form.inputRSTLine1} onChange={e => upd("inputRSTLine1", e.target.value)} /></Field>
          <Field label="Line 2 (m³)"><input type="number" step="0.01" style={S.input} value={form.inputRSTLine2} onChange={e => upd("inputRSTLine2", e.target.value)} /></Field>
        </div>
        {totalRST > 0 && <div style={{ fontSize: 13, color: C.primary, fontWeight: 700 }}>Total: {f2(totalRST)} m³</div>}
      </div>
      <div style={{ background: "#F9F7F4", borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", marginBottom: 10 }}>{t.production.form.outputPlaner}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <Field label="Line 1 (m³)"><input type="number" step="0.01" style={S.input} value={form.outputPlanerLine1} onChange={e => upd("outputPlanerLine1", e.target.value)} /></Field>
          <Field label="Line 2 (m³)"><input type="number" step="0.01" style={S.input} value={form.outputPlanerLine2} onChange={e => upd("outputPlanerLine2", e.target.value)} /></Field>
        </div>
        {totalPlaner > 0 && <div style={{ fontSize: 13, color: C.primary, fontWeight: 700 }}>Total: {f2(totalPlaner)} m³</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label={t.production.form.outputPit}><input type="number" step="0.01" style={S.input} value={form.outputPit} onChange={e => upd("outputPit", e.target.value)} /></Field>
        <Field label={t.production.form.outputBlok}><input type="number" step="0.01" style={S.input} value={form.outputBlok} onChange={e => upd("outputBlok", e.target.value)} /></Field>
        <Field label={t.production.form.jumlahBlok}><input type="number" style={S.input} value={form.jumlahBlok} onChange={e => upd("jumlahBlok", e.target.value)} /></Field>
        <Field label={t.production.form.rejectedM3}><input type="number" step="0.01" style={S.input} value={form.rejectedM3} onChange={e => upd("rejectedM3", e.target.value)} /></Field>
        <Field label={t.production.form.glueKg}><input type="number" step="0.1" style={S.input} value={form.glueKg} onChange={e => upd("glueKg", e.target.value)} /></Field>
      </div>
      <Field label={t.common.notes}><textarea style={{ ...S.input, height: 56 }} value={form.notes} onChange={e => upd("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={S.btnOut} onClick={onClose}>{t.common.cancel}</button>
        <button style={S.btn(valid && !saving ? C.primary : "#aaa")} onClick={handleSave} disabled={!valid || saving}>{saving ? "..." : t.common.save}</button>
      </div>
    </>
  );
}
function ProdExportModal({ records, month, t, onClose }) {
  const monthLabel = month === "all" ? t.common.allMonths : month;
  const totalInput = records.reduce((a, r) => a + ((+r.inputRSTLine1 || 0) + (+r.inputRSTLine2 || 0)), 0);
  const totalOutput = records.reduce((a, r) => a + (+r.outputBlok || 0), 0);
  const totalBlok = records.reduce((a, r) => a + (+r.jumlahBlok || 0), 0);
  const totalGlue = records.reduce((a, r) => a + (+r.glueKg || 0), 0);
  const totalJam = records.reduce((a, r) => a + (+r.jamKerja || 0), 0);
  const withYield = records.filter(r => r.overallYield != null);
  const avgYield = withYield.length ? (withYield.reduce((a, r) => a + +r.overallYield, 0) / withYield.length).toFixed(2) : null;
  const withM3 = records.filter(r => r.m3PerJam != null);
  const avgM3 = withM3.length ? (withM3.reduce((a, r) => a + +r.m3PerJam, 0) / withM3.length).toFixed(3) : null;
  const withGlue = records.filter(r => r.gluePerM3 != null);
  const avgGlue = withGlue.length ? (withGlue.reduce((a, r) => a + +r.gluePerM3, 0) / withGlue.length).toFixed(3) : null;
  const withPlaner = records.filter(r => r.planerYield != null);
  const avgPlaner = withPlaner.length ? (withPlaner.reduce((a, r) => a + +r.planerYield, 0) / withPlaner.length).toFixed(2) : null;

  const handlePrint = () => {
    const title = `${t.production.export.title} - ${monthLabel}`;
    const rows = records.map(r => {
      const rst1 = +r.inputRSTLine1 || 0, rst2 = +r.inputRSTLine2 || 0;
      const pl1 = +r.outputPlanerLine1 || 0, pl2 = +r.outputPlanerLine2 || 0;
      return `<tr>
        <td>${r.date}</td>
        <td><span class="badge bb">S${r.shift}</span><div class="sub">${r.jamKerja} jam</div></td>
        <td class="bold">${f2(rst1 + rst2)}<div class="sub">L1: ${f2(rst1)} · L2: ${f2(rst2)}</div></td>
        <td>${f2(pl1 + pl2)}<div class="sub">L1: ${f2(pl1)} · L2: ${f2(pl2)}</div></td>
        <td>${r.outputPit ? f2(r.outputPit) : "—"}</td>
        <td class="bold">${f2(r.outputBlok)} m³<div class="sub">${r.jumlahBlok || "—"} blok</div></td>
        <td>${f2(r.rejectedM3)}</td>
        <td>${f2(r.glueKg)}</td>
        <td class="${r.overallYield ? (+r.overallYield >= 40 ? "green" : "red") : ""}">${r.overallYield ? r.overallYield + "%" : "—"}</td>
        <td class="blue">${r.planerYield ? r.planerYield + "%" : "—"}</td>
        <td class="${r.rejectRate ? (+r.rejectRate > 10 ? "red" : "amber") : ""}">${r.rejectRate ? r.rejectRate + "%" : "—"}</td>
        <td>${r.m3PerJam || "—"}</td>
        <td>${r.gluePerM3 || "—"}</td>
      </tr>`;
    }).join("");
    const html = `
      <div class="header"><h1>${t.production.export.title}</h1><p>Pioneer Wood · ${monthLabel} · ${new Date().toLocaleDateString()}</p></div>
      <div class="summary">
        <div class="sbox"><div class="sl">Total Input RST</div><div class="sv">${f2(totalInput)} m³</div></div>
        <div class="sbox" style="border-color:#276130"><div class="sl">Total Output Blok</div><div class="sv">${f2(totalOutput)} m³</div><div class="ss">${totalBlok} blok</div></div>
        <div class="sbox" style="border-color:${avgYield && +avgYield >= 40 ? "#276130" : "#B93C22"}"><div class="sl">Avg Yield</div><div class="sv">${avgYield ? avgYield + "%" : "—"}</div><div class="ss">Planer: ${avgPlaner ? avgPlaner + "%" : "—"}</div></div>
        <div class="sbox" style="border-color:#C97E1A"><div class="sl">Avg m³/Jam</div><div class="sv">${avgM3 || "—"}</div></div>
        <div class="sbox" style="border-color:#5B2D8E"><div class="sl">Avg Glue/m³</div><div class="sv">${avgGlue ? avgGlue + " kg" : "—"}</div></div>
        <div class="sbox" style="border-color:#6B6355"><div class="sl">Hari Produksi</div><div class="sv">${records.length}</div><div class="ss">${f2(totalJam, 1)} jam · ${f2(totalGlue)} kg glue</div></div>
      </div>
      <table>
        <thead><tr><th>Tanggal</th><th>Shift</th><th>Input RST (m³)</th><th>Output Planer (m³)</th><th>Output Pit (m³)</th><th>Output Blok</th><th>Rejected (m³)</th><th>Glue (kg)</th><th>Yield %</th><th>Planer %</th><th>Reject %</th><th>m³/Jam</th><th>Glue/m³</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
    printHTML(title, html);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div><div style={{ fontSize: 17, fontWeight: 800, color: C.primary }}>{t.production.export.title}</div><div style={{ fontSize: 13, color: C.textSub }}>Pioneer Wood · {monthLabel}</div></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handlePrint} style={S.btn(C.green)}>⬇ PDF</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.textSub }}>×</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12, marginBottom: 24 }}>
            {[
              { label: "Total Input RST", val: `${f2(totalInput)} m³`, accent: C.blue },
              { label: "Total Output Blok", val: `${f2(totalOutput)} m³`, sub: `${totalBlok} blok`, accent: C.green },
              { label: "Avg Yield", val: avgYield ? `${avgYield}%` : "—", sub: avgPlaner ? `Planer: ${avgPlaner}%` : null, accent: avgYield && +avgYield >= 40 ? C.green : C.red },
              { label: "Avg m³/Jam", val: avgM3 || "—", accent: C.amber },
              { label: "Avg Glue/m³", val: avgGlue ? `${avgGlue} kg` : "—", accent: C.purple },
              { label: "Hari Produksi", val: `${records.length}`, sub: `${f2(totalJam, 1)} jam · ${f2(totalGlue)} kg`, accent: C.textSub },
            ].map((c, i) => (
              <div key={i} style={S.statCard(c.accent)}>
                <div style={S.label}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.primary }}>{c.val}</div>
                {c.sub && <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{c.sub}</div>}
              </div>
            ))}
          </div>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: C.bg }}>{["Tanggal", "Shift", "Input RST (m³)", "Output Planer (m³)", "Output Pit (m³)", "Output Blok", "Rejected (m³)", "Glue (kg)", "Yield %", "Planer %", "Reject %", "m³/Jam", "Glue/m³"].map((h, i) => <th key={i} style={{ ...S.th, fontSize: 10 }}>{h}</th>)}</tr></thead>
              <tbody>{records.map(r => {
                const rst1 = +r.inputRSTLine1 || 0, rst2 = +r.inputRSTLine2 || 0;
                const pl1 = +r.outputPlanerLine1 || 0, pl2 = +r.outputPlanerLine2 || 0;
                return (<tr key={r.id}>
                  <td style={{ ...S.td, fontSize: 12 }}>{r.date}</td>
                  <td style={{ ...S.td, fontSize: 12 }}><span style={S.badge("blue")}>S{r.shift}</span><div style={{ fontSize: 10, color: C.textSub, marginTop: 2 }}>{r.jamKerja} jam</div></td>
                  <td style={{ ...S.td, fontSize: 12 }}><div style={{ fontWeight: 700 }}>{f2(rst1 + rst2)}</div><div style={{ fontSize: 10, color: C.textSub }}>L1: {f2(rst1)} · L2: {f2(rst2)}</div></td>
                  <td style={{ ...S.td, fontSize: 12 }}><div style={{ fontWeight: 700 }}>{f2(pl1 + pl2)}</div><div style={{ fontSize: 10, color: C.textSub }}>L1: {f2(pl1)} · L2: {f2(pl2)}</div></td>
                  <td style={{ ...S.td, fontSize: 12 }}>{r.outputPit ? f2(r.outputPit) : "—"}</td>
                  <td style={{ ...S.td, fontSize: 12, fontWeight: 700 }}><div>{f2(r.outputBlok)} m³</div><div style={{ fontSize: 10, color: C.textSub }}>{r.jumlahBlok || "—"} blok</div></td>
                  <td style={{ ...S.td, fontSize: 12 }}>{f2(r.rejectedM3)}</td>
                  <td style={{ ...S.td, fontSize: 12 }}>{f2(r.glueKg)}</td>
                  <td style={{ ...S.td, fontSize: 12, fontWeight: 700, color: r.overallYield ? (+r.overallYield >= 40 ? C.green : C.red) : C.textLight }}>{r.overallYield ? `${r.overallYield}%` : "—"}</td>
                  <td style={{ ...S.td, fontSize: 12, color: C.blue }}>{r.planerYield ? `${r.planerYield}%` : "—"}</td>
                  <td style={{ ...S.td, fontSize: 12, color: r.rejectRate ? (+r.rejectRate > 10 ? C.red : C.amber) : C.textLight }}>{r.rejectRate ? `${r.rejectRate}%` : "—"}</td>
                  <td style={{ ...S.td, fontSize: 12 }}>{r.m3PerJam || "—"}</td>
                  <td style={{ ...S.td, fontSize: 12 }}>{r.gluePerM3 || "—"}</td>
                </tr>);
              })}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductionModule({ t, lang }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [showExport, setShowExport] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null);
    const { data, error } = await supabase.from("production").select("*").order("date", { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setRecords(data.map(fromDbProd)); setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const onAdd = async (rec) => { setSaving(true); const { error } = await supabase.from("production").insert([toDbProd(rec)]); if (error) { alert("Error: " + error.message); setSaving(false); return; } await fetchRecords(); setSaving(false); setShowAdd(false); };
  const onUpdate = async (updated) => { setSaving(true); const { error } = await supabase.from("production").update(toDbProd(updated)).eq("id", updated.id); if (error) { alert("Error: " + error.message); setSaving(false); return; } await fetchRecords(); setSaving(false); setEditing(null); };
  const onDelete = async (id) => { if (!window.confirm("Hapus data ini?")) return; const { error } = await supabase.from("production").delete().eq("id", id); if (error) { alert("Error: " + error.message); return; } await fetchRecords(); };

  const monthRecords = selectedMonth === "all" ? records : records.filter(r => r.date && r.date.startsWith(selectedMonth));
  const sorted = [...monthRecords].sort((a, b) => a.date > b.date ? -1 : 1);
  const totalInput = monthRecords.reduce((a, r) => a + ((+r.inputRSTLine1 || 0) + (+r.inputRSTLine2 || 0)), 0);
  const totalOutput = monthRecords.reduce((a, r) => a + (+r.outputBlok || 0), 0);
  const totalBlok = monthRecords.reduce((a, r) => a + (+r.jumlahBlok || 0), 0);
  const totalJamKerja = monthRecords.reduce((a, r) => a + (+r.jamKerja || 0), 0);
  const withYield = monthRecords.filter(r => r.overallYield != null);
  const avgYield = withYield.length ? (withYield.reduce((a, r) => a + +r.overallYield, 0) / withYield.length).toFixed(2) : null;
  const withM3 = monthRecords.filter(r => r.m3PerJam != null);
  const avgM3 = withM3.length ? (withM3.reduce((a, r) => a + +r.m3PerJam, 0) / withM3.length).toFixed(3) : null;
  const withGlue = monthRecords.filter(r => r.gluePerM3 != null);
  const avgGlue = withGlue.length ? (withGlue.reduce((a, r) => a + +r.gluePerM3, 0) / withGlue.length).toFixed(3) : null;
  const withPlaner = monthRecords.filter(r => r.planerYield != null);
  const avgPlanerYield = withPlaner.length ? (withPlaner.reduce((a, r) => a + +r.planerYield, 0) / withPlaner.length).toFixed(2) : null;

  return (
    <div>
      <ErrorBar error={error} onRetry={fetchRecords} />
      <MonthBar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} onExport={() => setShowExport(true)} t={t} lang={lang} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: t.production.summary.totalInput, val: `${f2(totalInput)} m³`, accent: C.blue },
          { label: t.production.summary.totalOutput, val: `${f2(totalOutput)} m³`, sub: `${totalBlok} blok`, accent: C.green },
          { label: t.production.summary.avgYield, val: avgYield ? `${avgYield}%` : "—", sub: avgPlanerYield ? `Planer: ${avgPlanerYield}%` : null, accent: avgYield && +avgYield >= 40 ? C.green : C.red },
          { label: t.production.summary.avgM3Jam, val: avgM3 || "—", accent: C.amber },
          { label: t.production.summary.avgGluem3, val: avgGlue ? `${avgGlue} kg` : "—", accent: C.purple },
          { label: t.production.summary.totalDays, val: `${monthRecords.length}`, sub: `${f2(totalJamKerja, 1)} ${lang === "id" ? "jam kerja" : "工时"}`, accent: C.textSub },
        ].map((c, i) => (
          <div key={i} style={S.statCard(c.accent)}>
            <div style={S.label}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{c.val}</div>
            {c.sub && <div style={{ fontSize: 11, color: C.textSub, marginTop: 3 }}>{c.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button style={S.btn()} onClick={() => setShowAdd(true)}>{t.production.addBtn}</button>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 48, color: C.textLight }}>{t.common.loading}</div> : sorted.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 64, color: C.textLight }}><div style={{ fontSize: 44, marginBottom: 12 }}>⚙️</div><div style={{ fontWeight: 700, fontSize: 15 }}>{t.common.noData}</div></div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead><tr style={{ background: C.bg }}>{[t.production.table.date, t.production.table.shift, "Input RST (m³)", "Output Planer (m³)", t.production.table.outputPit, t.production.table.outputBlok, t.production.table.rejected, t.production.table.glue, t.production.table.yieldPct, t.production.table.planerYield, t.production.table.rejectRate, t.production.table.m3Jam, t.production.table.gluem3, ""].map((h, i) => <th key={i} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {sorted.map(r => {
                const totalRST = (+r.inputRSTLine1 || 0) + (+r.inputRSTLine2 || 0);
                const totalPlaner = (+r.outputPlanerLine1 || 0) + (+r.outputPlanerLine2 || 0);
                return (
                <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                  <td style={S.td}>{r.date}</td>
                  <td style={S.td}><span style={S.badge("blue")}>S{r.shift}</span>{r.jamKerja && <div style={{ fontSize: 11, color: C.textSub, marginTop: 3 }}>{r.jamKerja} jam</div>}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 700 }}>{f2(totalRST)}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>L1: {f2(r.inputRSTLine1)} · L2: {f2(r.inputRSTLine2)}</div>
                  </td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 700 }}>{f2(totalPlaner)}</div>
                    <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>L1: {f2(r.outputPlanerLine1)} · L2: {f2(r.outputPlanerLine2)}</div>
                  </td>
                  <td style={S.td}>{r.outputPit ? f2(r.outputPit) : <span style={{ color: C.textLight }}>—</span>}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}><div>{f2(r.outputBlok)} m³</div>{r.jumlahBlok && <div style={{ fontSize: 11, color: C.textSub, marginTop: 2 }}>{r.jumlahBlok} blok</div>}</td>
                  <td style={S.td}>{f2(r.rejectedM3)}</td>
                  <td style={S.td}>{f2(r.glueKg)}</td>
                  <td style={{ ...S.td, fontWeight: 700, color: r.overallYield ? (+r.overallYield >= 40 ? C.green : C.red) : C.textLight }}>{r.overallYield ? `${r.overallYield}%` : "—"}</td>
                  <td style={{ ...S.td, color: C.blue }}>{r.planerYield ? `${r.planerYield}%` : "—"}</td>
                  <td style={{ ...S.td, color: r.rejectRate ? (+r.rejectRate > 10 ? C.red : C.amber) : C.textLight }}>{r.rejectRate ? `${r.rejectRate}%` : "—"}</td>
                  <td style={S.td}>{r.m3PerJam || "—"}</td>
                  <td style={S.td}>{r.gluePerM3 || "—"}</td>
                  <td style={S.td}><div style={{ display: "flex", gap: 6 }}><button style={S.btnSm(C.primary)} onClick={() => setEditing(r)}>{t.common.update}</button><button style={S.btnSm(C.red)} onClick={() => onDelete(r.id)}>✕</button></div></td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showAdd && <Modal title={t.production.addBtn} onClose={() => setShowAdd(false)}><ProductionForm t={t} onClose={() => setShowAdd(false)} onSave={onAdd} saving={saving} /></Modal>}
      {editing && <Modal title={t.common.update} onClose={() => setEditing(null)}><ProductionForm t={t} initial={editing} onClose={() => setEditing(null)} onSave={onUpdate} saving={saving} /></Modal>}
      {showExport && <ProdExportModal records={sorted} month={selectedMonth} t={t} onClose={() => setShowExport(false)} />}
    </div>
  );
}

// ─── SUPABASE HELPERS — STOCK ──────────────────────────────────────────────
function toDbStock(r) {
  return {
    id: r.id, date: r.date, is_opname: r.isOpname || false,
    incoming_rst: r.incomingRST || 0, incoming_gesek: r.incomingGesek || 0, total_incoming: r.totalIncoming || 0,
    prod_input: r.prodInput || 0, prod_output: r.prodOutput || 0,
    kd_pik: r.kdPIK || 0, kd_luar: r.kdLuar || 0, kd_total: r.kdTotal || 0,
    rst_kering: r.rstKering || 0, wip: r.wip || 0, ekspor: r.ekspor || 0,
    bj: r.bj || 0, net_bj: r.netBJ || 0, prev_bj: r.prevBJ || 0,
    corrections: r.corrections || null,
  };
}
function fromDbStock(r) {
  return {
    id: r.id, date: r.date, isOpname: r.is_opname,
    incomingRST: r.incoming_rst, incomingGesek: r.incoming_gesek, totalIncoming: r.total_incoming,
    prodInput: r.prod_input, prodOutput: r.prod_output,
    kdPIK: r.kd_pik, kdLuar: r.kd_luar, kdTotal: r.kd_total,
    rstKering: r.rst_kering, wip: r.wip, ekspor: r.ekspor,
    bj: r.bj, netBJ: r.net_bj, prevBJ: r.prev_bj,
    corrections: r.corrections,
  };
}

// ─── STOCK HELPERS ─────────────────────────────────────────────────────────
function calcStockIncoming(deliveries, date) {
  const incomingRST = deliveries.filter(d => d.type === "RST" && getRawmatStatus(d) === "final" && d.date === date).reduce((a, d) => a + (getEffectiveFinal(d) || 0), 0);
  const incomingGesek = deliveries.filter(d => d.type === "LOG" && d.gesekDate === date && d.gesekVol != null).reduce((a, d) => a + (d.gesekVol || 0), 0);
  return { incomingRST, incomingGesek, totalIncoming: incomingRST + incomingGesek };
}
function calcStockProduction(production, date) {
  const dayProd = production.filter(p => p.date === date);
  return {
    prodInput: dayProd.reduce((a, p) => a + ((+p.inputRSTLine1 || 0) + (+p.inputRSTLine2 || 0)), 0),
    prodOutput: dayProd.reduce((a, p) => a + (+p.outputBlok || 0), 0),
  };
}

// ─── STOCK COMPONENTS ──────────────────────────────────────────────────────
function StockAutoBox({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: `1px solid ${C.green}20` }}>
      <span style={{ fontSize: 12, color: C.textSub, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: C.primary }}>{f2(value)} m³</span>
    </div>
  );
}

function OpeningStockModal({ t, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    kdPIK: initial?.kdPIK ?? "", kdLuar: initial?.kdLuar ?? "",
    rstKering: initial?.rstKering ?? "", wip: initial?.wip ?? "", bj: initial?.bj ?? "",
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", boxSizing: "border-box" };
  const lbl = { fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  const valid = Object.values(form).some(v => v !== "");
  return (
    <Modal title={t.stock.opening.title} onClose={onClose}>
      <div style={{ fontSize: 12, color: C.textSub, marginBottom: 16 }}>{t.stock.opening.hint}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.kdPIK}</label><input type="number" step="0.01" style={inp} value={form.kdPIK} onChange={e => upd("kdPIK", e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.kdLuar}</label><input type="number" step="0.01" style={inp} value={form.kdLuar} onChange={e => upd("kdLuar", e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.rstKering}</label><input type="number" step="0.01" style={inp} value={form.rstKering} onChange={e => upd("rstKering", e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.wip}</label><input type="number" step="0.01" style={inp} value={form.wip} onChange={e => upd("wip", e.target.value)} /></div>
      </div>
      <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.opening.bjLabel}</label><input type="number" step="0.01" style={inp} value={form.bj} onChange={e => upd("bj", e.target.value)} /><div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>{t.stock.opening.hint}</div></div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={{ background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={onClose}>{t.common.cancel}</button>
        <button style={{ background: valid ? C.primary : "#aaa", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={() => valid && onSave({ kdPIK: +form.kdPIK || 0, kdLuar: +form.kdLuar || 0, rstKering: +form.rstKering || 0, wip: +form.wip || 0, bj: +form.bj || 0 })} disabled={!valid}>{t.common.save}</button>
      </div>
    </Modal>
  );
}

function StockOpnameModal({ t, prevRecord, onClose, onSave, lang }) {
  const [date, setDate] = useState(today());
  const [form, setForm] = useState({ rstKering: "", kdPIK: "", kdLuar: "", wip: "", bj: "" });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const fields = [
    { key: "rstKering", label: t.stock.manual.rstKering.replace(" (m³)", ""), sys: prevRecord?.rstKering },
    { key: "kdPIK", label: t.stock.manual.kdPIK.replace(" (m³)", ""), sys: prevRecord?.kdPIK },
    { key: "kdLuar", label: t.stock.manual.kdLuar.replace(" (m³)", ""), sys: prevRecord?.kdLuar },
    { key: "wip", label: t.stock.manual.wip.replace(" (m³)", ""), sys: prevRecord?.wip },
    { key: "bj", label: "Net Barang Jadi", sys: prevRecord?.netBJ },
  ];
  const valid = Object.values(form).some(v => v !== "");
  const handleSave = () => {
    if (!valid) return;
    const corrections = {};
    fields.forEach(f => { if (form[f.key] !== "") corrections[f.key] = { sys: f.sys || 0, actual: +form[f.key], variance: +(+form[f.key] - (f.sys || 0)).toFixed(2) }; });
    onSave({
      id: uid(), date, isOpname: true, corrections,
      rstKering: form.rstKering !== "" ? +form.rstKering : (prevRecord?.rstKering || 0),
      kdPIK: form.kdPIK !== "" ? +form.kdPIK : (prevRecord?.kdPIK || 0),
      kdLuar: form.kdLuar !== "" ? +form.kdLuar : (prevRecord?.kdLuar || 0),
      kdTotal: (form.kdPIK !== "" ? +form.kdPIK : (prevRecord?.kdPIK || 0)) + (form.kdLuar !== "" ? +form.kdLuar : (prevRecord?.kdLuar || 0)),
      wip: form.wip !== "" ? +form.wip : (prevRecord?.wip || 0),
      netBJ: form.bj !== "" ? +form.bj : (prevRecord?.netBJ || 0),
      bj: form.bj !== "" ? +form.bj : (prevRecord?.netBJ || 0),
      incomingRST: 0, incomingGesek: 0, totalIncoming: 0, prodInput: 0, prodOutput: 0, ekspor: 0, prevBJ: prevRecord?.netBJ || 0,
    });
  };
  return (
    <Modal title={t.stock.opname.title} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{t.common.date}</label>
        <input type="date" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", boxSizing: "border-box" }} value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <div style={{ fontSize: 11, color: C.textSub, marginBottom: 12, fontWeight: 600 }}>{t.stock.opname.hint}</div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: C.bg, padding: "8px 12px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.textSub, textTransform: "uppercase" }}>Field</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.textSub, textTransform: "uppercase", textAlign: "center" }}>{t.stock.opname.calculated}</div>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.green, textTransform: "uppercase", textAlign: "center" }}>{t.stock.opname.actual}</div>
        </div>
        {fields.map(f => {
          const actual = form[f.key] !== "" ? +form[f.key] : null;
          const variance = actual !== null ? (actual - (f.sys || 0)).toFixed(2) : null;
          const varPos = variance !== null && +variance >= 0;
          return (
            <div key={f.key} style={{ borderTop: `1px solid ${C.border}`, padding: "10px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>{f.label}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.textSub, textAlign: "center" }}>{f2(f.sys || 0)} m³</div>
              <div>
                <input type="number" step="0.01" style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, color: C.text, background: "#fff", boxSizing: "border-box" }} value={form[f.key]} placeholder={f2(f.sys || 0)} onChange={e => upd(f.key, e.target.value)} />
                {variance !== null && <div style={{ fontSize: 11, fontWeight: 700, color: varPos ? C.green : C.red, marginTop: 3, textAlign: "center" }}>{varPos ? "+" : ""}{variance} m³</div>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={{ background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={onClose}>{t.common.cancel}</button>
        <button style={{ background: valid ? C.primary : "#aaa", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={handleSave} disabled={!valid}>{t.common.save}</button>
      </div>
    </Modal>
  );
}

function StockEntryForm({ t, deliveries, production, prevBJ, onClose, onSave, initial, saving }) {
  const [date, setDate] = useState(initial?.date || today());
  const [form, setForm] = useState({ kdPIK: initial?.kdPIK ?? "", kdLuar: initial?.kdLuar ?? "", rstKering: initial?.rstKering ?? "", wip: initial?.wip ?? "", ekspor: initial?.ekspor ?? "" });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [autoData, setAutoData] = useState({ incomingRST: 0, incomingGesek: 0, totalIncoming: 0, prodInput: 0, prodOutput: 0 });
  useEffect(() => {
    setAutoData({ ...calcStockIncoming(deliveries, date), ...calcStockProduction(production, date) });
  }, [date, deliveries, production]);
  const kdTotal = (toNum(form.kdPIK) || 0) + (toNum(form.kdLuar) || 0);
  const eksporVal = toNum(form.ekspor) || 0;
  const bj = (prevBJ || 0) + autoData.prodOutput;
  const netBJ = bj - eksporVal;
  const valid = form.rstKering !== "" || form.kdPIK !== "";
  const handleSave = () => {
    if (!valid) return;
    onSave({ id: initial?.id || uid(), date, incomingRST: autoData.incomingRST, incomingGesek: autoData.incomingGesek, totalIncoming: autoData.totalIncoming, prodInput: autoData.prodInput, prodOutput: autoData.prodOutput, kdPIK: toNum(form.kdPIK) || 0, kdLuar: toNum(form.kdLuar) || 0, kdTotal, rstKering: toNum(form.rstKering) || 0, wip: toNum(form.wip) || 0, ekspor: eksporVal, bj, netBJ, prevBJ: prevBJ || 0 });
  };
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", boxSizing: "border-box" };
  const lbl = { fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  return (
    <>
      <div style={{ marginBottom: 14 }}><label style={lbl}>{t.common.date}</label><input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} /></div>
      <div style={{ background: C.greenLight, border: `1px solid ${C.green}30`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 10 }}>{t.stock.auto.label}</div>
        <StockAutoBox label={t.stock.auto.incomingRST} value={autoData.incomingRST} />
        <StockAutoBox label={t.stock.auto.incomingGesek} value={autoData.incomingGesek} />
        <StockAutoBox label={t.stock.auto.totalIncoming} value={autoData.totalIncoming} />
        <div style={{ height: 8 }} />
        <StockAutoBox label={t.stock.auto.prodInput} value={autoData.prodInput} />
        <StockAutoBox label={t.stock.auto.prodOutput} value={autoData.prodOutput} />
        <div style={{ height: 8 }} />
        <StockAutoBox label={t.stock.auto.prevBJ} value={prevBJ || 0} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.textSub, marginBottom: 12 }}>{t.stock.manual.label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.kdPIK}</label><input type="number" step="0.01" style={inp} value={form.kdPIK} onChange={e => upd("kdPIK", e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.kdLuar}</label><input type="number" step="0.01" style={inp} value={form.kdLuar} onChange={e => upd("kdLuar", e.target.value)} /></div>
      </div>
      {(form.kdPIK || form.kdLuar) && <div style={{ background: C.blueLight, borderRadius: 8, padding: "8px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, color: C.blue, fontWeight: 700 }}>{t.stock.calc.kdTotal}</span><span style={{ fontSize: 16, fontWeight: 800, color: C.primary }}>{f2(kdTotal)} m³</span></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.rstKering}</label><input type="number" step="0.01" style={inp} value={form.rstKering} onChange={e => upd("rstKering", e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.wip}</label><input type="number" step="0.01" style={inp} value={form.wip} onChange={e => upd("wip", e.target.value)} /></div>
        <div style={{ marginBottom: 14 }}><label style={lbl}>{t.stock.manual.ekspor}</label><input type="number" step="0.01" style={inp} value={form.ekspor} onChange={e => upd("ekspor", e.target.value)} /><div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>{t.stock.manual.eksporHint}</div></div>
      </div>
      <div style={{ background: C.primary, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", marginBottom: 8 }}>{t.stock.calc.bj}</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{t.stock.auto.prevBJ} + {t.stock.auto.prodOutput}</span><span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{f2(prevBJ || 0)} + {f2(autoData.prodOutput)} = {f2(bj)} m³</span></div>
        {eksporVal > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>− Ekspor</span><span style={{ fontSize: 13, fontWeight: 700, color: C.amberLight }}>− {f2(eksporVal)} m³</span></div>}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{t.stock.calc.netBJ}</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{f2(netBJ)} m³</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button style={S.btnOut} onClick={onClose}>{t.common.cancel}</button>
        <button style={S.btn(valid && !saving ? C.primary : "#aaa")} onClick={handleSave} disabled={!valid || saving}>{saving ? "..." : t.common.save}</button>
      </div>
    </>
  );
}

function StockModule({ t, lang }) {
  const [records, setRecords] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [production, setProduction] = useState([]);
  const [openingBJ, setOpeningBJ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [showOpname, setShowOpname] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null);
    const [sr, dr, pr, setting] = await Promise.all([
      supabase.from("stock").select("*").order("date", { ascending: false }),
      supabase.from("deliveries").select("*"),
      supabase.from("production").select("*"),
      supabase.from("settings").select("value").eq("key", "opening_stock").single(),
    ]);
    if (sr.error) { setError(sr.error.message); setLoading(false); return; }
    setRecords(sr.data.map(fromDbStock));
    setDeliveries((dr.data || []).map(fromDbRawmat));
    setProduction((pr.data || []).map(fromDbProd));
    setOpeningBJ(setting.data ? JSON.parse(setting.data.value) : null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onSaveOpening = async (val) => {
    await supabase.from("settings").upsert({ key: "opening_stock", value: JSON.stringify(val) });
    setOpeningBJ(val); setShowOpening(false);
  };

  const onSave = async (rec) => {
    setSaving(true);
    const existing = records.find(r => r.id === rec.id);
    if (existing) {
      const { error } = await supabase.from("stock").update(toDbStock(rec)).eq("id", rec.id);
      if (error) { alert("Error: " + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("stock").insert([toDbStock(rec)]);
      if (error) { alert("Error: " + error.message); setSaving(false); return; }
    }
    await fetchAll();
    setSaving(false); setShowAdd(false); setEditing(null); setShowOpname(false);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Hapus data ini?")) return;
    await supabase.from("stock").delete().eq("id", id);
    await fetchAll();
  };

  const prevBJForNew = records.length > 0 ? records[0].netBJ : (openingBJ?.bj || 0);
  const prevBJForEdit = (r) => { const idx = records.findIndex(x => x.id === r.id); return idx < records.length - 1 ? records[idx + 1].netBJ : (openingBJ?.bj || 0); };
  const monthRecords = selectedMonth === "all" ? records : records.filter(r => r.date && r.date.startsWith(selectedMonth));
  const latest = monthRecords[0] || null;
  const thS = (color, bl = false) => ({ ...S.th, color, fontWeight: 700, borderLeft: bl ? `1px solid ${C.border}` : "none" });

  const summaryCards = [
    { label: t.stock.summary.rstKering, val: latest ? f2(latest.rstKering) : (openingBJ ? f2(openingBJ.rstKering) : "—"), unit: "m³", sub: latest?.date, accent: C.amber },
    { label: t.stock.summary.kdTotal, val: latest ? f2(latest.kdTotal) : (openingBJ ? f2((openingBJ.kdPIK||0)+(openingBJ.kdLuar||0)) : "—"), unit: "m³", sub: latest?.date, accent: C.blue },
    { label: t.stock.summary.wip, val: latest ? f2(latest.wip) : (openingBJ ? f2(openingBJ.wip) : "—"), unit: "m³", sub: latest?.date, accent: "#7B68EE" },
    { label: t.stock.summary.netBJ, val: latest ? f2(latest.netBJ) : (openingBJ ? f2(openingBJ.bj) : "—"), unit: "m³", sub: latest?.date, accent: C.green },
    { label: t.stock.summary.lastIncoming, val: latest ? f2(latest.totalIncoming) : "—", unit: "m³", sub: latest?.date, accent: C.primary },
    { label: t.stock.summary.lastProdOutput, val: latest ? f2(latest.prodOutput) : "—", unit: "m³", sub: latest?.date, accent: C.red },
  ];

  return (
    <div>
      <ErrorBar error={error} onRetry={fetchAll} />
      {openingBJ === null && (
        <div style={{ background: C.amberLight, border: `1px solid ${C.amber}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, color: C.amber, fontSize: 14 }}>⚠️ {t.stock.opening.notSet}</div>
            <div style={{ fontSize: 12, color: C.textSub, marginTop: 2 }}>{t.stock.opening.notSetHint}</div>
          </div>
          <button style={S.btn(C.amber)} onClick={() => setShowOpening(true)}>{t.stock.opening.btn}</button>
        </div>
      )}
      {openingBJ !== null && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={() => setShowOpening(true)} style={{ background: "none", border: "none", color: C.textSub, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{t.stock.opening.btn}: {f2(openingBJ)} m³ ✏️</button>
        </div>
      )}
      <MonthBar selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} onExport={() => {}} t={t} lang={lang} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {summaryCards.map((c, i) => (
          <div key={i} style={S.statCard(c.accent)}>
            <div style={S.label}>{c.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primary }}>{c.val} <span style={{ fontSize: 12, fontWeight: 400, color: C.textSub }}>{c.unit}</span></div>
            {c.sub && <div style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>📅 {c.sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
        <button style={S.btn("#7B68EE")} onClick={() => setShowOpname(true)}>{t.stock.opname.btn}</button>
        <button style={S.btn()} onClick={() => setShowAdd(true)}>{t.stock.addBtn}</button>
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 48, color: C.textLight }}>{t.common.loading}</div> : monthRecords.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: 64, color: C.textLight }}><div style={{ fontSize: 44, marginBottom: 12 }}>📦</div><div style={{ fontWeight: 700 }}>{t.stock.noData}</div></div>
      ) : (
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1200 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                <th style={{ ...S.th, borderBottom: `1px solid ${C.border}` }} rowSpan={2}>{t.common.date}</th>
                <th colSpan={3} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: C.green, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, textAlign: "center", background: C.bg, borderLeft: `1px solid ${C.border}` }}>AUTO — MASUK</th>
                <th colSpan={3} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: C.blue, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, textAlign: "center", background: C.bg, borderLeft: `1px solid ${C.border}` }}>MANUAL — KD</th>
                <th colSpan={5} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: C.amber, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, textAlign: "center", background: C.bg, borderLeft: `1px solid ${C.border}` }}>MANUAL — STOK</th>
                <th colSpan={1} style={{ padding: "6px 12px", fontSize: 10, fontWeight: 800, color: C.green, textTransform: "uppercase", borderBottom: `1px solid ${C.border}`, textAlign: "center", background: C.bg, borderLeft: `1px solid ${C.border}` }}>NET BJ</th>
                <th style={{ ...S.th, borderBottom: `1px solid ${C.border}` }} rowSpan={2}></th>
              </tr>
              <tr style={{ background: C.bg }}>
                <th style={thS(C.green, true)}>{t.stock.table.inRST}</th><th style={thS(C.green)}>{t.stock.table.inGesek}</th><th style={{ ...thS(C.green), fontWeight: 900 }}>{t.stock.table.totalIn}</th>
                <th style={thS(C.blue, true)}>{t.stock.table.kdPIK}</th><th style={thS(C.blue)}>{t.stock.table.kdLuar}</th><th style={{ ...thS(C.blue), fontWeight: 900 }}>{t.stock.table.kdTotal}</th>
                <th style={thS(C.amber, true)}>{t.stock.table.rstKering}</th><th style={thS(C.red)}>{t.stock.table.prodInput}</th><th style={thS(C.primary)}>{t.stock.table.prodOutput}</th><th style={thS(C.textSub)}>{t.stock.table.wip}</th><th style={thS(C.red)}>{t.stock.table.ekspor}</th>
                <th style={{ ...thS(C.green, true), fontWeight: 900 }}>{t.stock.table.netBJ}</th>
              </tr>
            </thead>
            <tbody>
              {monthRecords.map(r => {
                if (r.isOpname) return (
                  <tr key={r.id} style={{ background: "#F3EEF9" }}>
                    <td style={{ ...S.td, fontWeight: 700 }}><div>{r.date}</div><div style={{ fontSize: 11, fontWeight: 800, color: C.purple, marginTop: 2 }}>{t.stock.opname.label}</div></td>
                    <td colSpan={11} style={{ ...S.td, borderLeft: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {r.corrections && Object.entries(r.corrections).map(([key, val]) => (
                          <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase" }}>{key.replace("bj", "Net BJ").replace("rstKering", "RST Kering").replace("kdPIK", "KD PIK").replace("kdLuar", "KD LUAR")}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: C.primary }}>{f2(val.actual)} m³</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: +val.variance >= 0 ? C.green : C.red }}>{+val.variance >= 0 ? "+" : ""}{f2(val.variance)}</div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...S.td, fontWeight: 900, fontSize: 14, color: C.purple, borderLeft: `1px solid ${C.border}` }}>{f2(r.netBJ)}</td>
                    <td style={S.td}><button style={S.btnSm(C.red)} onClick={() => onDelete(r.id)}>✕</button></td>
                  </tr>
                );
                return (
                  <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                    <td style={{ ...S.td, fontWeight: 700 }}>{r.date}</td>
                    <td style={{ ...S.td, color: C.green, borderLeft: `1px solid ${C.border}` }}>{f2(r.incomingRST)}</td>
                    <td style={{ ...S.td, color: C.green }}>{f2(r.incomingGesek)}</td>
                    <td style={{ ...S.td, color: C.green, fontWeight: 700 }}>{f2(r.totalIncoming)}</td>
                    <td style={{ ...S.td, borderLeft: `1px solid ${C.border}` }}>{f2(r.kdPIK)}</td>
                    <td style={S.td}>{f2(r.kdLuar)}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: C.blue }}>{f2(r.kdTotal)}</td>
                    <td style={{ ...S.td, borderLeft: `1px solid ${C.border}` }}>{f2(r.rstKering)}</td>
                    <td style={{ ...S.td, color: C.red }}>{f2(r.prodInput)}</td>
                    <td style={{ ...S.td, color: C.primary, fontWeight: 700 }}>{f2(r.prodOutput)}</td>
                    <td style={S.td}>{f2(r.wip)}</td>
                    <td style={{ ...S.td, color: C.red }}>{r.ekspor > 0 ? f2(r.ekspor) : <span style={{ color: C.textLight }}>—</span>}</td>
                    <td style={{ ...S.td, fontWeight: 900, fontSize: 14, color: C.green, borderLeft: `1px solid ${C.border}` }}>{f2(r.netBJ)}</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button style={S.btnSm(C.primary)} onClick={() => setEditing(r)}>{t.common.update}</button>
                        <button style={S.btnSm(C.red)} onClick={() => onDelete(r.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {showOpening && <OpeningStockModal t={t} onClose={() => setShowOpening(false)} onSave={onSaveOpening} initial={openingBJ} />}
      {showOpname && <StockOpnameModal t={t} lang={lang} prevRecord={records[0] || null} onClose={() => setShowOpname(false)} onSave={onSave} />}
      {showAdd && <Modal title={t.stock.addBtn} onClose={() => setShowAdd(false)}><StockEntryForm t={t} deliveries={deliveries} production={production} prevBJ={prevBJForNew} onClose={() => setShowAdd(false)} onSave={onSave} saving={saving} /></Modal>}
      {editing && <Modal title={t.common.update} onClose={() => setEditing(null)}><StockEntryForm t={t} deliveries={deliveries} production={production} prevBJ={prevBJForEdit(editing)} onClose={() => setEditing(null)} onSave={onSave} initial={editing} saving={saving} /></Modal>}
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("id");
  const [activeTab, setActiveTab] = useState("rawmat");
  const t = T[lang];
  const tabs = [{ key: "rawmat", label: t.nav.rawmat, icon: "🪵" }, { key: "production", label: t.nav.production, icon: "⚙️" }, { key: "stock", label: t.nav.stock, icon: "📦" }];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: C.primary, padding: "0 16px", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 5, height: 28, background: C.amber, borderRadius: 3 }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Pioneer Wood System</span>
          </div>
          <button onClick={() => setLang(l => l === "id" ? "cn" : "id")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{t.langToggle}</button>
        </div>
      </div>
      <div style={{ background: "#fff", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 54, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", padding: "0 16px" }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: "none", border: "none", borderBottom: activeTab === tab.key ? `3px solid ${C.primary}` : "3px solid transparent", color: activeTab === tab.key ? C.primary : C.textSub, padding: "13px 16px 10px", cursor: "pointer", fontSize: 14, fontWeight: activeTab === tab.key ? 800 : 500, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 48px" }}>
        {activeTab === "rawmat" && <RawmatModule t={t} lang={lang} />}
        {activeTab === "production" && <ProductionModule t={t} lang={lang} />}
        {activeTab === "stock" && <StockModule t={t} lang={lang} />}
      </div>
    </div>
  );
}
