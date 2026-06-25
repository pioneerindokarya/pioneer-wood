import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

// ─── PALETTE ───────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F2EC", card: "#FFFFFF", primary: "#1C3A2A",
  amber: "#C97E1A", amberLight: "#FEF6E7",
  red: "#B93C22", redLight: "#FEF0ED",
  green: "#276130", greenLight: "#EAF4EC",
  blue: "#1A5276", blueLight: "#EAF2FB",
  border: "#DDD5C8", text: "#1E1E1E",
  textSub: "#6B6355", textLight: "#9E9487",
};

// ─── TRANSLATIONS ──────────────────────────────────────────────────────────
const T = {
  id: {
    appName: "Penerimaan Bahan Baku",
    langToggle: "切换中文",
    addBtn: "+ Tambah Kiriman",
    updateBtn: "Update",
    all: "Semua",
    common: { save: "Simpan", cancel: "Batal", date: "Tanggal", supplier: "Supplier", type: "Jenis", notes: "Catatan", noData: "Belum ada data", loading: "Memuat...", nomorKiriman: "No. Kiriman" },
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
    table: { date: "Tanggal", nomorKiriman: "No. Kiriman", supplier: "Supplier", type: "Jenis", sj: "SJ (m³)", tally: "Tally (m³)", final: "Final (m³)", gesek: "Gesek (m³)", rendemen: "Rendemen %", status: "Status", action: "Aksi" },
    summary: { logSJ: "LOG · SJ", logFinal: "LOG · Final", rstSJ: "RST · SJ", rstFinal: "RST · Final", pendingTally: "Pending Tally", pendingFinal: "Pending Final", kiriman: "kiriman", gesek: "Gesek" },
    modalTitle: { add: "Tambah Kiriman Baru", updateLog: "Update Data LOG", updateRST: "Update Data RST" },
    month: { all: "Semua Bulan", label: "Bulan", exportBtn: "Export Laporan", exportTitle: "Laporan Penerimaan Bahan Baku", print: "Print", copy: "Salin", copied: "Tersalin!", close: "Tutup", supplier: "Supplier", detail: "Detail Kiriman", avgRendemen: "Rata-rata Rendemen" },
    filter: { allSuppliers: "Semua Supplier" },
  },
  cn: {
    appName: "原材料入库记录",
    langToggle: "Bahasa ID",
    addBtn: "+ 添加入库",
    updateBtn: "更新",
    all: "全部",
    common: { save: "保存", cancel: "取消", date: "日期", supplier: "供应商", type: "类型", notes: "备注", noData: "暂无数据", loading: "加载中...", nomorKiriman: "送货编号" },
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
    table: { date: "日期", nomorKiriman: "送货编号", supplier: "供应商", type: "类型", sj: "送货单 (m³)", tally: "盘点 (m³)", final: "最终 (m³)", gesek: "锯切 (m³)", rendemen: "出材率 %", status: "状态", action: "操作" },
    summary: { logSJ: "原木·送货单", logFinal: "原木·最终", rstSJ: "RST·送货单", rstFinal: "RST·最终", pendingTally: "待盘点", pendingFinal: "待确认", kiriman: "笔", gesek: "锯切" },
    modalTitle: { add: "添加新入库", updateLog: "更新原木数据", updateRST: "更新RST数据" },
    month: { all: "全部月份", label: "月份", exportBtn: "导出报告", exportTitle: "原材料入库报告", print: "打印", copy: "复制", copied: "已复制!", close: "关闭", supplier: "供应商", detail: "入库明细", avgRendemen: "平均出材率" },
    filter: { allSuppliers: "全部供应商" },
  },
};

// ─── SUPABASE HELPERS ──────────────────────────────────────────────────────
function toDb(r) {
  return {
    id: r.id, date: r.date, nomor_kiriman: r.nomorKiriman || null,
    supplier: r.supplier, type: r.type, sj_vol: r.sjVol || null,
    tally_log_vol: r.tallyLogVol || null, tally_final_vol: r.tallyFinalVol || null,
    gesek_vol: r.gesekVol || null, gesek_date: r.gesekDate || null,
    tally_vol: r.tallyVol || null, final_vol: r.finalVol || null,
    rendemen: r.rendemen || null, notes: r.notes || null,
  };
}

function fromDb(r) {
  return {
    id: r.id, date: r.date, nomorKiriman: r.nomor_kiriman,
    supplier: r.supplier, type: r.type, sjVol: r.sj_vol,
    tallyLogVol: r.tally_log_vol, tallyFinalVol: r.tally_final_vol,
    gesekVol: r.gesek_vol, gesekDate: r.gesek_date,
    tallyVol: r.tally_vol, finalVol: r.final_vol,
    rendemen: r.rendemen, notes: r.notes,
  };
}

// ─── UTILS ─────────────────────────────────────────────────────────────────
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().split("T")[0];
const currentMonth = () => new Date().toISOString().slice(0, 7);
const f2 = (n) => (n != null && n !== "" && !isNaN(n)) ? Number(n).toFixed(4) : "—";
const toNum = (v) => (v !== "" && v != null && !isNaN(v)) ? +v : null;

function getStatus(r) {
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

// ─── STYLES ────────────────────────────────────────────────────────────────
const S = {
  card: { background: "#FFF", borderRadius: 12, border: `1px solid ${C.border}`, padding: 20, marginBottom: 16 },
  input: { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 14, color: C.text, background: "#fff", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 },
  btn: (bg = C.primary) => ({ background: bg, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }),
  btnSm: (bg = C.primary) => ({ background: bg, color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }),
  btnOut: { background: "transparent", color: C.primary, border: `1.5px solid ${C.primary}`, borderRadius: 8, padding: "8px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  th: { padding: "10px 12px", fontSize: 11, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `2px solid ${C.border}`, textAlign: "left", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", fontSize: 14, color: C.text, borderBottom: `1px solid #F0EAE0`, verticalAlign: "middle" },
  badge: (col) => {
    const m = { green: [C.greenLight, C.green], amber: [C.amberLight, C.amber], red: [C.redLight, C.red], blue: [C.blueLight, C.blue] };
    const [bg, tc] = m[col] || m.blue;
    return { background: bg, color: tc, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-block", whiteSpace: "nowrap" };
  },
  statCard: (accent) => ({ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${accent}`, padding: "14px 16px" }),
};

// ─── COMPONENTS ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
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
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>{hint}</div>}
    </div>
  );
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
  const diff = +val - +base;
  const pos = diff >= 0;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: pos ? C.greenLight : C.redLight, borderRadius: 8, padding: "6px 12px", marginBottom: 14 }}>
      <span style={{ fontSize: 12, color: C.textSub }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: pos ? C.green : C.red }}>{pos ? "+" : ""}{f2(diff)} m³</span>
    </div>
  );
}

function StepProgress({ type, status, t }) {
  const steps = t.steps[type];
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

function AddModal({ onClose, onSave, t, filterType, saving }) {
  const [selectedType, setSelectedType] = useState(filterType === "all" ? "RST" : filterType);
  const [form, setForm] = useState({ date: today(), nomorKiriman: "", supplier: "", sjVol: "", notes: "" });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.supplier.trim() && form.sjVol;
  const handleSave = () => {
    if (!valid) return;
    onSave({ ...form, id: uid(), type: selectedType, sjVol: +form.sjVol, tallyVol: null, finalVol: null, tallyLogVol: null, tallyFinalVol: null, gesekVol: null, gesekDate: null });
  };
  return (
    <Modal title={t.modalTitle.add} onClose={onClose}>
      {filterType === "all" ? (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["RST", "LOG"].map(tp => (
            <button key={tp} onClick={() => setSelectedType(tp)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${selectedType === tp ? C.primary : C.border}`, background: selectedType === tp ? C.primary : "#fff", color: selectedType === tp ? "#fff" : C.textSub, fontWeight: 800, fontSize: 15, cursor: "pointer" }}>{tp}</button>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}><span style={S.badge(selectedType === "LOG" ? "amber" : "blue")}>{selectedType}</span></div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Field label={t.common.date}><input type="date" style={S.input} value={form.date} onChange={e => upd("date", e.target.value)} /></Field>
        <Field label={t.common.nomorKiriman}><input style={S.input} value={form.nomorKiriman} onChange={e => upd("nomorKiriman", e.target.value)} /></Field>
        <Field label={t.common.supplier}><input style={S.input} value={form.supplier} onChange={e => upd("supplier", e.target.value)} /></Field>
        <Field label={`${t.fields.sjVol} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.sjVol} onChange={e => upd("sjVol", e.target.value)} /></Field>
      </div>
      <Field label={t.common.notes}><textarea style={{ ...S.input, height: 60 }} value={form.notes} onChange={e => upd("notes", e.target.value)} /></Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
        <button style={S.btnOut} onClick={onClose}>{t.common.cancel}</button>
        <button style={S.btn(valid && !saving ? C.primary : "#aaa")} onClick={handleSave} disabled={saving}>{saving ? "..." : t.common.save}</button>
      </div>
    </Modal>
  );
}

function UpdateModal({ record, onClose, onSave, t, saving }) {
  const [form, setForm] = useState({
    tallyLogVol: record.tallyLogVol ?? "", tallyFinalVol: record.tallyFinalVol ?? "",
    gesekVol: record.gesekVol ?? "", gesekDate: record.gesekDate ?? "",
    tallyVol: record.tallyVol ?? "", finalVol: record.finalVol ?? "", notes: record.notes ?? "",
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const status = getStatus(record);
  const effFinalLOG = toNum(form.tallyFinalVol) ?? toNum(form.tallyLogVol) ?? null;
  const effFinalRST = toNum(form.finalVol) ?? toNum(form.tallyVol) ?? null;
  const rendemen = (toNum(form.gesekVol) != null && effFinalLOG != null && effFinalLOG > 0)
    ? ((toNum(form.gesekVol) / effFinalLOG) * 100).toFixed(2) : null;

  const handleSave = () => {
    onSave({
      ...record,
      date: record.date,
      tallyLogVol: toNum(form.tallyLogVol), tallyFinalVol: toNum(form.tallyFinalVol),
      gesekVol: toNum(form.gesekVol), gesekDate: form.gesekDate || null,
      tallyVol: toNum(form.tallyVol), finalVol: toNum(form.finalVol),
      notes: form.notes, rendemen: rendemen ? +rendemen : null,
    });
  };

  const title = record.type === "LOG" ? t.modalTitle.updateLog : t.modalTitle.updateRST;
  return (
    <Modal title={`${title} — ${record.supplier}`} onClose={onClose}>
      <div style={{ background: C.bg, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
        <StepProgress type={record.type} status={status} t={t} />
      </div>
      <InfoBox label={`📄 ${t.fields.sjVol}`} value={`${f2(record.sjVol)} m³`} bg="#F9F7F4" />
      {record.type === "LOG" ? (
        <>
          <Field label={`${t.fields.tallyLog} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.tallyLogVol} onChange={e => upd("tallyLogVol", e.target.value)} /></Field>
          <DiffPill val={toNum(form.tallyLogVol)} base={record.sjVol} label={t.fields.diffVsSJ} />
          <Field label={`${t.fields.tallyFinal} (m³)`} hint={t.fields.tallyFinalHint}>
            <input type="number" step="0.0001" style={S.input} value={form.tallyFinalVol} placeholder={form.tallyLogVol || ""} onChange={e => upd("tallyFinalVol", e.target.value)} />
          </Field>
          {effFinalLOG != null && (
            <InfoBox label={`✅ ${t.fields.effectiveFinal}`} value={`${f2(effFinalLOG)} m³`} sub={`${t.fields.diffVsSJ}: ${(effFinalLOG - record.sjVol >= 0 ? "+" : "")}${f2(effFinalLOG - record.sjVol)} m³`} color={C.green} bg={C.greenLight} />
          )}
          <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label={`${t.fields.gesek} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.gesekVol} onChange={e => upd("gesekVol", e.target.value)} /></Field>
            <Field label={t.fields.gesekDate}><input type="date" style={S.input} value={form.gesekDate} onChange={e => upd("gesekDate", e.target.value)} /></Field>
          </div>
          <DiffPill val={toNum(form.gesekVol)} base={effFinalLOG} label={t.fields.diffVsFinal} />
          {rendemen != null && (
            <InfoBox label={`🌿 ${t.fields.rendemen}`} value={`${rendemen}%`} sub={t.fields.rendemenHint}
              color={+rendemen >= 60 ? C.green : +rendemen >= 50 ? C.amber : C.red}
              bg={+rendemen >= 60 ? C.greenLight : +rendemen >= 50 ? C.amberLight : C.redLight} />
          )}
        </>
      ) : (
        <>
          <Field label={`${t.fields.tallyRST} (m³)`}><input type="number" step="0.0001" style={S.input} value={form.tallyVol} onChange={e => upd("tallyVol", e.target.value)} /></Field>
          <DiffPill val={toNum(form.tallyVol)} base={record.sjVol} label={t.fields.diffVsSJ} />
          <Field label={`${t.fields.finalRST} (m³)`} hint={t.fields.finalRSTHint}>
            <input type="number" step="0.0001" style={S.input} value={form.finalVol} placeholder={form.tallyVol || ""} onChange={e => upd("finalVol", e.target.value)} />
          </Field>
          {effFinalRST != null && (
            <InfoBox label={`✅ ${t.fields.effectiveFinal}`} value={`${f2(effFinalRST)} m³`} sub={`${t.fields.diffVsSJ}: ${(effFinalRST - record.sjVol >= 0 ? "+" : "")}${f2(effFinalRST - record.sjVol)} m³`} color={C.green} bg={C.greenLight} />
          )}
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

function ExportModal({ records, month, t, onClose }) {
  const [copied, setCopied] = useState(false);
  const monthLabel = month === "all" ? t.month.all : month;
  const logs = records.filter(r => r.type === "LOG");
  const rsts = records.filter(r => r.type === "RST");
  const totalSJLog = logs.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalFinalLog = logs.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const totalGesek = logs.reduce((a, r) => a + (r.gesekVol || 0), 0);
  const rendemenLogs = logs.filter(r => r.rendemen != null);
  const avgRendemen = rendemenLogs.length > 0 ? (rendemenLogs.reduce((a, r) => a + r.rendemen, 0) / rendemenLogs.length).toFixed(2) : null;
  const totalSJRST = rsts.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalFinalRST = rsts.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);

  const textReport = `${t.month.exportTitle.toUpperCase()}
Pioneer Wood · ${monthLabel}
${"─".repeat(40)}
LOG (${logs.length} ${t.summary.kiriman})
  SJ       : ${f2(totalSJLog)} m³
  Final    : ${f2(totalFinalLog)} m³
  Gesek    : ${f2(totalGesek)} m³
  ${t.month.avgRendemen}: ${avgRendemen ? avgRendemen + "%" : "—"}

RST (${rsts.length} ${t.summary.kiriman})
  SJ       : ${f2(totalSJRST)} m³
  Final    : ${f2(totalFinalRST)} m³
${"─".repeat(40)}
${records.map(r => {
  const ef = getEffectiveFinal(r);
  return `[${r.type}] ${r.date} · ${r.supplier}${r.nomorKiriman ? " · No." + r.nomorKiriman : ""}
  SJ: ${f2(r.sjVol)} m³  |  Final: ${ef != null ? f2(ef) : "—"} m³${r.type === "LOG" && r.gesekVol != null ? `  |  Gesek: ${f2(r.gesekVol)} m³${r.gesekDate ? " (" + r.gesekDate + ")" : ""}  |  Rendemen: ${r.rendemen != null ? r.rendemen.toFixed(2) + "%" : "—"}` : ""}`;
}).join("\n")}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textReport).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div className="no-print" style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.primary }}>{t.month.exportTitle}</div>
            <div style={{ fontSize: 13, color: C.textSub }}>Pioneer Wood · {monthLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCopy} style={S.btn(copied ? C.green : C.primary)}>{copied ? t.month.copied : t.month.copy}</button>
            <button onClick={() => window.print()} style={S.btn("#555")}>{t.month.print}</button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.textSub }}>×</button>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <div style={{ background: C.amberLight, borderRadius: 10, padding: 16, border: `1px solid ${C.amber}40` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.amber, marginBottom: 10 }}>LOG · {logs.length} {t.summary.kiriman}</div>
              {[{ label: "SJ", val: totalSJLog }, { label: "Final", val: totalFinalLog }, { label: t.summary.gesek, val: totalGesek }].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.amber}20` }}>
                  <span style={{ color: C.textSub }}>{row.label}</span>
                  <span style={{ fontWeight: 700 }}>{f2(row.val)} m³</span>
                </div>
              ))}
              {avgRendemen && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingTop: 6 }}>
                <span style={{ color: C.textSub }}>{t.month.avgRendemen}</span>
                <span style={{ fontWeight: 800, color: +avgRendemen >= 60 ? C.green : +avgRendemen >= 50 ? C.amber : C.red }}>{avgRendemen}%</span>
              </div>}
            </div>
            <div style={{ background: C.blueLight, borderRadius: 10, padding: 16, border: `1px solid ${C.blue}40` }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.blue, marginBottom: 10 }}>RST · {rsts.length} {t.summary.kiriman}</div>
              {[{ label: "SJ", val: totalSJRST }, { label: "Final", val: totalFinalRST }].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${C.blue}20` }}>
                  <span style={{ color: C.textSub }}>{row.label}</span>
                  <span style={{ fontWeight: 700 }}>{f2(row.val)} m³</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginBottom: 10, textTransform: "uppercase" }}>{t.month.detail}</div>
          <div style={{ overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {[t.table.date, t.table.nomorKiriman, t.table.supplier, t.table.type, t.table.sj, t.table.final, t.table.gesek, t.table.rendemen].map((h, i) => (
                    <th key={i} style={{ ...S.th, fontSize: 10 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(r => {
                  const ef = getEffectiveFinal(r);
                  return (
                    <tr key={r.id}>
                      <td style={{ ...S.td, fontSize: 12 }}>{r.date}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{r.nomorKiriman || "—"}</td>
                      <td style={{ ...S.td, fontSize: 12, fontWeight: 600 }}>{r.supplier}</td>
                      <td style={{ ...S.td, fontSize: 12 }}><span style={S.badge(r.type === "LOG" ? "amber" : "blue")}>{r.type}</span></td>
                      <td style={{ ...S.td, fontSize: 12 }}>{f2(r.sjVol)}</td>
                      <td style={{ ...S.td, fontSize: 12, fontWeight: 700 }}>{ef != null ? f2(ef) : "—"}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{r.type === "LOG" && r.gesekVol != null ? <div>{f2(r.gesekVol)}{r.gesekDate && <div style={{ fontSize: 10, color: C.textLight }}>{r.gesekDate}</div>}</div> : "—"}</td>
                      <td style={{ ...S.td, fontSize: 12 }}>{r.type === "LOG" && r.rendemen != null ? <span style={{ fontWeight: 700, color: r.rendemen >= 60 ? C.green : r.rendemen >= 50 ? C.amber : C.red }}>{r.rendemen.toFixed(2)}%</span> : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textSub, marginBottom: 6, textTransform: "uppercase" }}>Plain Text (WhatsApp / WeChat)</div>
            <pre style={{ background: C.bg, borderRadius: 8, padding: 14, fontSize: 12, color: C.text, overflow: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace", border: `1px solid ${C.border}` }}>{textReport}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("id");
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
  const t = T[lang];

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("deliveries")
      .select("*")
      .order("date", { ascending: false });
    if (error) { setError(error.message); setLoading(false); return; }
    setRecords(data.map(fromDb));
    setLoading(false);
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const onAdd = async (rec) => {
    setSaving(true);
    const { error } = await supabase.from("deliveries").insert([toDb(rec)]);
    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    await fetchRecords();
    setSaving(false);
    setShowAdd(false);
  };

  const onUpdate = async (updated) => {
    setSaving(true);
    const { error } = await supabase.from("deliveries").update(toDb(updated)).eq("id", updated.id);
    if (error) { alert("Error: " + error.message); setSaving(false); return; }
    await fetchRecords();
    setSaving(false);
    setEditing(null);
  };

  const onDelete = async (id) => {
    if (!window.confirm("Hapus data ini?")) return;
    const { error } = await supabase.from("deliveries").delete().eq("id", id);
    if (error) { alert("Error: " + error.message); return; }
    await fetchRecords();
  };

  const monthRecords = selectedMonth === "all" ? records : records.filter(r => r.date && r.date.startsWith(selectedMonth));
  const logs = monthRecords.filter(r => r.type === "LOG");
  const rsts = monthRecords.filter(r => r.type === "RST");
  const totalSJLog = logs.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalSJRST = rsts.reduce((a, r) => a + (r.sjVol || 0), 0);
  const totalFinalLog = logs.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const totalFinalRST = rsts.reduce((a, r) => a + (getEffectiveFinal(r) || 0), 0);
  const totalGesek = logs.reduce((a, r) => a + (r.gesekVol || 0), 0);
  const pendingTally = monthRecords.filter(r => getStatus(r) === "sj").length;
  const pendingFinal = monthRecords.filter(r => getStatus(r) === "tally").length;

  const suppliers = [...new Set(monthRecords.map(r => r.supplier).filter(Boolean))].sort();

  const filtered = [...monthRecords]
    .filter(r => filter === "all" || r.type === filter)
    .filter(r => selectedSupplier === "all" || r.supplier === selectedSupplier)
    .sort((a, b) => {
      const aNum = parseInt(a.nomorKiriman);
      const bNum = parseInt(b.nomorKiriman);
      const aValid = !isNaN(aNum);
      const bValid = !isNaN(bNum);
      if (!aValid && !bValid) return 0;
      if (!aValid) return 1;
      if (!bValid) return -1;
      return aNum - bNum;
    });

  const statusBadgeColor = (r) => {
    const s = getStatus(r);
    return s === "gesek" || s === "final" ? "green" : s === "tally" ? "blue" : "amber";
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ background: C.primary, padding: "0 16px", position: "sticky", top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 54 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 5, height: 28, background: C.amber, borderRadius: 3 }} />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>Pioneer · {t.appName}</span>
          </div>
          <button onClick={() => setLang(l => l === "id" ? "cn" : "id")} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{t.langToggle}</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 48px" }}>
        {error && <div style={{ background: C.redLight, border: `1px solid ${C.red}`, borderRadius: 8, padding: "12px 16px", marginBottom: 16, color: C.red, fontWeight: 600 }}>⚠️ {error} <button onClick={fetchRecords} style={{ marginLeft: 12, background: C.red, color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Retry</button></div>}

        {/* Month selector */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          <input type="month" style={{ ...S.input, width: "auto", fontWeight: 700, fontSize: 14, color: C.primary }} value={selectedMonth === "all" ? "" : selectedMonth} onChange={e => { setSelectedMonth(e.target.value || "all"); setSelectedSupplier("all"); }} />
          <button onClick={() => { setSelectedMonth("all"); setSelectedSupplier("all"); }} style={{ background: selectedMonth === "all" ? C.primary : C.card, color: selectedMonth === "all" ? "#fff" : C.textSub, border: `1.5px solid ${selectedMonth === "all" ? C.primary : C.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{t.month.all}</button>
          <button onClick={() => { setSelectedMonth(currentMonth()); setSelectedSupplier("all"); }} style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", color: C.textSub }}>{lang === "id" ? "Bulan Ini" : "本月"}</button>
          <div style={{ marginLeft: "auto" }}>
            <button style={S.btn(C.green)} onClick={() => setShowExport(true)}>{t.month.exportBtn}</button>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: t.summary.logSJ, val: totalSJLog, unit: "m³", sub: `${logs.length} ${t.summary.kiriman}`, accent: C.amber },
            { label: t.summary.logFinal, val: totalFinalLog, unit: "m³", sub: `${t.summary.gesek}: ${f2(totalGesek)} m³`, accent: C.green },
            { label: t.summary.rstSJ, val: totalSJRST, unit: "m³", sub: `${rsts.length} ${t.summary.kiriman}`, accent: C.blue },
            { label: t.summary.rstFinal, val: totalFinalRST, unit: "m³", sub: "", accent: C.green },
            { label: `⏳ ${t.summary.pendingTally}`, count: pendingTally, unit: t.summary.kiriman, accent: C.amber },
            { label: `⏳ ${t.summary.pendingFinal}`, count: pendingFinal, unit: t.summary.kiriman, accent: C.red },
          ].map((c, i) => (
            <div key={i} style={S.statCard(c.accent)}>
              <div style={S.label}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.primary }}>
                {c.count != null ? c.count : f2(c.val)}
                <span style={{ fontSize: 12, fontWeight: 400, color: C.textSub }}> {c.unit}</span>
              </div>
              {c.sub && c.count == null && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{c.sub}</div>}
            </div>
          ))}
        </div>

        {/* Filter + Add */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["all", "LOG", "RST"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? C.primary : C.card, color: filter === f ? "#fff" : C.textSub, border: `1.5px solid ${filter === f ? C.primary : C.border}`, borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {f === "all" ? t.all : f}
              </button>
            ))}
            <select
              value={selectedSupplier}
              onChange={e => setSelectedSupplier(e.target.value)}
              style={{ ...S.input, width: "auto", fontWeight: 600, fontSize: 13, color: selectedSupplier === "all" ? C.textSub : C.primary, border: `1.5px solid ${selectedSupplier === "all" ? C.border : C.primary}`, cursor: "pointer" }}
            >
              <option value="all">{t.filter.allSuppliers}</option>
              {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button style={S.btn()} onClick={() => setShowAdd(true)}>{t.addBtn}</button>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: C.textLight }}>{t.common.loading}</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", padding: 64, color: C.textLight }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🪵</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.common.noData}</div>
          </div>
        ) : (
          <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: C.bg }}>
                  {[t.table.date, t.table.nomorKiriman, t.table.supplier, t.table.type, t.table.sj, t.table.tally, t.table.final, t.table.gesek, t.table.rendemen, t.table.status, t.table.action].map((h, i) => (
                    <th key={i} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const effFinal = getEffectiveFinal(r);
                  const tally = getTally(r);
                  const status = getStatus(r);
                  return (
                    <tr key={r.id} onMouseEnter={e => e.currentTarget.style.background = "#FAFAF8"} onMouseLeave={e => e.currentTarget.style.background = ""}>
                      <td style={S.td}>{r.date}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: C.primary }}>{r.nomorKiriman || <span style={{ color: C.textLight }}>—</span>}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{r.supplier}</td>
                      <td style={S.td}><span style={S.badge(r.type === "LOG" ? "amber" : "blue")}>{r.type}</span></td>
                      <td style={S.td}>{f2(r.sjVol)}</td>
                      <td style={S.td}>{tally != null ? f2(tally) : <span style={{ color: C.textLight }}>—</span>}</td>
                      <td style={{ ...S.td, fontWeight: 700 }}>{effFinal != null ? f2(effFinal) : <span style={{ color: C.textLight }}>—</span>}</td>
                      <td style={S.td}>{r.type === "LOG" ? (r.gesekVol != null ? <div><div>{f2(r.gesekVol)}</div>{r.gesekDate && <div style={{ fontSize: 11, color: C.textLight, marginTop: 2 }}>{r.gesekDate}</div>}</div> : <span style={{ color: C.textLight }}>—</span>) : <span style={{ color: C.textLight }}>N/A</span>}</td>
                      <td style={S.td}>{r.type === "LOG" && r.rendemen != null ? <span style={{ fontWeight: 700, color: r.rendemen >= 60 ? C.green : r.rendemen >= 50 ? C.amber : C.red }}>{Number(r.rendemen).toFixed(2)}%</span> : <span style={{ color: C.textLight }}>—</span>}</td>
                      <td style={S.td}><span style={S.badge(statusBadgeColor(r))}>{t.status[status]}</span></td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button style={S.btnSm(C.primary)} onClick={() => setEditing(r)}>{t.updateBtn}</button>
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
      </div>

      {showAdd && <AddModal t={t} filterType={filter} onClose={() => setShowAdd(false)} onSave={onAdd} saving={saving} />}
      {editing && <UpdateModal record={editing} t={t} onClose={() => setEditing(null)} onSave={onUpdate} saving={saving} />}
      {showExport && <ExportModal records={filtered} month={selectedMonth} t={t} onClose={() => setShowExport(false)} />}
    </div>
  );
}
