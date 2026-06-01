import React, { useState, useEffect } from "react";

import LOGO_B64 from "./logo";
import BG_B64 from "./bg";


const INITIAL_SLOTS: Slot[] = [
  { id:1,  start:"21:00", end:"22:00", genre:"DEEP TECH",            dj:"VOGEL", collective:"CLUB LONELY",      b2b:"LAURA VIZER" },
  { id:2,  start:"22:00", end:"22:45", genre:"UKG",                  dj:"VOGEL", collective:"TWO-STEP",         b2b:"TRANSLATE" },
  { id:3,  start:"22:45", end:"23:30", genre:"UKG",                  dj:"VOGEL", collective:"TWO-STEP",         b2b:"PHOENIX" },
  { id:4,  start:"23:30", end:"00:15", genre:"UKG",                  dj:"VOGEL", collective:"TASTE CLUB",       b2b:"FOM" },
  { id:5,  start:"00:15", end:"01:00", genre:"RAW TECHNO",           dj:"VOGEL", collective:"TASTE CLUB",       b2b:"JAI T" },
  { id:6,  start:"01:00", end:"02:00", genre:"HYPNOTIC TECHNO",      dj:"VOGEL", collective:"APPARATUS",        b2b:"APPARATUS" },
  { id:7,  start:"02:00", end:"03:00", genre:"HYPNOTIC TECHNO",      dj:"VOGEL", collective:"PHYGRIA",          b2b:"ETHAN" },
  { id:8,  start:"03:00", end:"04:00", genre:"HYPNOTIC TECHNO",      dj:"VOGEL", collective:"PHYGRIA",          b2b:"WAVMAN" },
  { id:9,  start:"04:00", end:"05:00", genre:"TBC",                  dj:"VOGEL", collective:"PHYGRIA",          b2b:"TALAT" },
  { id:10, start:"05:00", end:"06:00", genre:"TBC",                  dj:"VOGEL", collective:"PONY CLUB",        b2b:"GLENFIELD" },
  { id:11, start:"06:00", end:"07:00", genre:"TBC",                  dj:"VOGEL", collective:"FRONT LEFT",       b2b:"WOLF" },
  { id:12, start:"07:00", end:"08:00", genre:"AFRO HOUSE",           dj:"VOGEL", collective:"LIBRE",            b2b:"MADAN" },
  { id:13, start:"08:00", end:"09:00", genre:"AFRO HOUSE",           dj:"VOGEL", collective:"NA",               b2b:"GROOVIA" },
  { id:14, start:"09:00", end:"09:45", genre:"HOUSE",                dj:"VOGEL", collective:"FRONT LEFT",       b2b:"FAINTONE" },
  { id:15, start:"09:45", end:"10:30", genre:"HOUSE",                dj:"VOGEL", collective:"ELECTRIC GROOVE",  b2b:"AYANA" },
  { id:16, start:"10:30", end:"11:15", genre:"HOUSE",                dj:"VOGEL", collective:"ELECTRIC GROOVE",  b2b:"JHOUSE" },
  { id:17, start:"11:15", end:"12:00", genre:"HOUSE",                dj:"VOGEL", collective:"ELECTRIC GROOVE",  b2b:"MISHKAH" },
  { id:18, start:"12:00", end:"12:45", genre:"DISCO",                dj:"VOGEL", collective:"PONY CLUB",        b2b:"PK" },
  { id:19, start:"12:45", end:"13:30", genre:"HOUSE",                dj:"VOGEL", collective:"PONY CLUB",        b2b:"PTAG" },
  { id:20, start:"13:30", end:"14:15", genre:"HOUSE",                dj:"VOGEL", collective:"FRONT LEFT",       b2b:"KIN?" },
  { id:21, start:"14:15", end:"15:00", genre:"TECH HOUSE",           dj:"VOGEL", collective:"NA",               b2b:"ROBERTO" },
  { id:22, start:"15:00", end:"16:00", genre:"DEEP TECH",            dj:"VOGEL", collective:"FRONT LEFT",       b2b:"NOE" },
  { id:23, start:"16:00", end:"17:00", genre:"DEEP TECH/DEEP HOUSE", dj:"VOGEL", collective:"EL BOSQUE",        b2b:"NICO" },
  { id:24, start:"17:00", end:"18:00", genre:"ELECTRONICA/TECHNO",   dj:"VOGEL", collective:"CREDITS RECORDS",  b2b:"PADDY/JACOB" },
  { id:25, start:"18:00", end:"19:00", genre:"ELECTRONICA/TECHNO",   dj:"VOGEL", collective:"CREDITS RECORDS",  b2b:"HENRY KING" },
  { id:26, start:"19:00", end:"20:00", genre:"VOGEL SOLO",           dj:"VOGEL", collective:"KINDACOOL",        b2b:"BLADEXC" },
  { id:27, start:"20:00", end:"21:00", genre:"VOGEL SOLO",           dj:"VOGEL", collective:"FRONT LEFT",       b2b:null },
];

const BLOCKS = [
  { id:0, label:"NIGHT",     time:"9PM-3AM",  color:"#9b59f9", startHour:21, endHour:3  },
  { id:1, label:"LATE",      time:"3AM-9AM",  color:"#00d4ff", startHour:3,  endHour:9  },
  { id:2, label:"MORNING",   time:"9AM-3PM",  color:"#ff8c00", startHour:9,  endHour:15 },
  { id:3, label:"AFTERNOON", time:"3PM-9PM",  color:"#a8ff3e", startHour:15, endHour:21 },
];

// Convert "HH:MM" to minutes since midnight for comparison
function toMins(t:string):number {
  if (!t || !t.includes(":")) return 0;
  const [h,m] = t.split(":").map(Number);
  return (isNaN(h)?0:h)*60 + (isNaN(m)?0:m);
}

// Event starts at 21:00 (9PM). Convert all times to "minutes since event start"
// so the 24hr timeline is linear: 21:00=0, 00:00=180, 03:00=360, 09:00=720 etc.
function toEventMins(t:string):number {
  const raw = toMins(t);
  const eventStartMins = 21 * 60; // 9PM
  // If time is before 9PM (e.g. 09:00, 15:00) it's on day 2 — add 24hrs
  return raw >= eventStartMins ? raw - eventStartMins : raw + (24*60 - eventStartMins);
}

// Each block is exactly 6 hours (360 mins) from event start
// Block 0: 0-360 mins (21:00-03:00)
// Block 1: 360-720 mins (03:00-09:00)
// Block 2: 720-1080 mins (09:00-15:00)
// Block 3: 1080-1440 mins (15:00-21:00)
function slotInBlock(slotStart:string, blockId:number):boolean {
  const em = toEventMins(slotStart);
  const blockStart = blockId * 360;
  const blockEnd = blockStart + 360;
  return em >= blockStart && em < blockEnd;
}

const GENRE_COLORS: Record<string,string> = {
  "MINIMAL":"#9b59f9","DEEP TECH":"#818cf8","UKG":"#34d399",
  "RAW TECHNO":"#f87171","HYPNOTIC TECHNO":"#fb923c","TBC":"#6b7280",
  "AFRO HOUSE":"#fbbf24","HOUSE":"#60a5fa","DISCO":"#ff6b6b",
  "TECH HOUSE":"#a78bfa","DEEP TECH/DEEP HOUSE":"#818cf8",
  "ELECTRONICA/TECHNO":"#f87171","VOGEL SOLO":"#9b59f9",
};

const ROLE_COLORS: Record<string,string> = {
  DJ:"#9b59f9", Photographer:"#34d399", Volunteer:"#fb923c",
  "Stage Manager":"#60a5fa", Security:"#f87171",
};
const ROLES = [...Object.keys(ROLE_COLORS), "Custom..."];

const INITIAL_CREW: Record<number, any[]> = {
  0:[
    {id:1, name:"VOGEL",                role:"DJ", notes:"Host - plays all 24hrs",               confirmed:true},
    {id:2, name:"TALEENA",              role:"DJ", notes:"CLUB LONELY - B2B Vogel - 10PM-11PM",  confirmed:true},
    {id:3, name:"GLENFIELD",            role:"DJ", notes:"TWO-STEP - B2B Vogel - 11PM-12AM",     confirmed:true},
    {id:4, name:"PHOENIX and TRANSLATE",role:"DJ", notes:"TWO-STEP - B2B Vogel - 12AM-1AM",      confirmed:true},
    {id:5, name:"JOHNNY K",             role:"DJ", notes:"TASTE CLUB - B2B Vogel - 1AM-2AM",     confirmed:true},
    {id:6, name:"FOM and JAI",          role:"DJ", notes:"TASTE CLUB - B2B Vogel - 2AM-3AM",     confirmed:true},
  ],
  1:[
    {id:7,  name:"WAVMAN",    role:"DJ", notes:"PHYGRIA - B2B Vogel - 3AM-4AM",          confirmed:true},
    {id:8,  name:"ETHAN",     role:"DJ", notes:"PHYGRIA - B2B Vogel - 4AM-5AM",          confirmed:true},
    {id:9,  name:"TBC",       role:"DJ", notes:"PHYGRIA - 5AM-6AM",                      confirmed:false},
    {id:10, name:"JACK FORAN",role:"DJ", notes:"MICROMINIMAL - B2B Vogel - 7AM-8AM",     confirmed:true},
    {id:11, name:"MADAN",     role:"DJ", notes:"LIBRE - B2B Vogel - 8AM-9AM",            confirmed:true},
  ],
  2:[
    {id:12, name:"TBC",         role:"DJ", notes:"LIBRE - 9AM-10AM",                       confirmed:false},
    {id:13, name:"MISHKAH",     role:"DJ", notes:"ELECTRIC GROOVE - B2B Vogel - 10AM-11AM",confirmed:true},
    {id:14, name:"JHOUSE",      role:"DJ", notes:"ELECTRIC GROOVE - B2B Vogel - 11AM-12PM",confirmed:true},
    {id:15, name:"SPARTICUS/PK",role:"DJ", notes:"FRONT LEFT - B2B Vogel - 12PM-1PM",     confirmed:true},
    {id:16, name:"NOE",         role:"DJ", notes:"FRONT LEFT - B2B Vogel - 1PM-2PM",       confirmed:true},
    {id:17, name:"CRUZ",        role:"DJ", notes:"FRONT LEFT - B2B Vogel - 2PM-3PM",       confirmed:true},
  ],
  3:[
    {id:18, name:"PADDY",  role:"DJ", notes:"CREDITS RECORDS - B2B Vogel - 5PM-6PM",  confirmed:true},
    {id:19, name:"BLADEXC",role:"DJ", notes:"KINDACOOL - B2B Vogel - 6PM-7PM",        confirmed:true},
    {id:20, name:"TBC",    role:"DJ", notes:"KINDACOOL - 7PM-8PM",                    confirmed:false},
    {id:21, name:"VOGEL",  role:"DJ", notes:"FRONT LEFT - Closing solo - 8PM-9PM",    confirmed:true},
  ],
};

let nextSlotId = 2000;
let nextCrewId = 2000;

type Slot = { id:number; start:string; end:string; genre:string; dj:string; collective:string; b2b:string|null };
type Person = { id:number; name:string; role:string; notes:string; confirmed:boolean };

const inp: React.CSSProperties = {
  width:"100%", background:"#000", border:"2px solid #2a2a2a", color:"#fff",
  padding:"10px 14px", fontSize:"15px", fontFamily:"inherit", fontWeight:700,
  boxSizing:"border-box", outline:"none", borderRadius:"6px",
};

function StyledInput({ value, onChange, placeholder }: { value:string; onChange:(e:any)=>void; placeholder:string }) {
  return <input value={value} onChange={onChange} placeholder={placeholder} style={inp} />;
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:"16px" }}>
      <div style={{ fontSize:"11px", color:"#888", fontWeight:900, marginBottom:"6px" }}>{label}</div>
      {children}
    </div>
  );
}

export default function App() {
  const [slots, setSlots] = useState<Slot[]>(() => {
    try {
      const saved = localStorage.getItem("ns_slots");
      if (saved) {
        const parsed: Slot[] = JSON.parse(saved);
        // Deduplicate by ID — keep last occurrence
        const seen = new Map<number, Slot>();
        parsed.forEach(s => seen.set(s.id, s));
        return Array.from(seen.values());
      }
      return INITIAL_SLOTS;
    } catch { return INITIAL_SLOTS; }
  });
  const [crew, setCrew] = useState<Record<number,Person[]>>(() => {
    try {
      const saved = localStorage.getItem("ns_crew");
      return saved ? JSON.parse(saved) : INITIAL_CREW;
    } catch { return INITIAL_CREW; }
  });
  const [tab, setTab] = useState("schedule");
  const [activeBlock, setActiveBlock] = useState(0);
  const [editingSlot, setEditingSlot] = useState<number|null>(null);
  const [slotForm, setSlotForm] = useState<Slot|null>(null);
  const [showCrewModal, setShowCrewModal] = useState(false);
  const [editCrewTarget, setEditCrewTarget] = useState<number|null>(null);
  const [crewForm, setCrewForm] = useState<Omit<Person,"id"> & { customRole?:string }>({ name:"", role:"DJ", notes:"", confirmed:false, customRole:"" });
  const [filterRole, setFilterRole] = useState("All");
  const [blockTimes, setBlockTimes] = useState<Record<number,{label:string,time:string}>>(() => {
    try {
      const saved = localStorage.getItem("ns_blocktimes");
      return saved ? JSON.parse(saved) : {
        0:{label:"NIGHT",     time:"9PM-3AM"},
        1:{label:"LATE",      time:"3AM-9AM"},
        2:{label:"MORNING",   time:"9AM-3PM"},
        3:{label:"AFTERNOON", time:"3PM-9PM"},
      };
    } catch {
      return {
        0:{label:"NIGHT",     time:"9PM-3AM"},
        1:{label:"LATE",      time:"3AM-9AM"},
        2:{label:"MORNING",   time:"9AM-3PM"},
        3:{label:"AFTERNOON", time:"3PM-9PM"},
      };
    }
  });
  const [editingBlockTime, setEditingBlockTime] = useState<number|null>(null);
  const [blockTimeForm, setBlockTimeForm] = useState({label:"", time:""});

  // Save to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem("ns_slots", JSON.stringify(slots)); } catch {}
  }, [slots]);

  useEffect(() => {
    try { localStorage.setItem("ns_crew", JSON.stringify(crew)); } catch {}
  }, [crew]);

  useEffect(() => {
    try { localStorage.setItem("ns_blocktimes", JSON.stringify(blockTimes)); } catch {}
  }, [blockTimes]);

  const BC = BLOCKS[activeBlock].color;
  const blockSlots = (bId: number) => slots.filter(s => slotInBlock(s.start, bId)).sort((a,b) => toEventMins(a.start)-toEventMins(b.start));

  const openSlotEdit = (slot: Slot) => {
    setEditingSlot(slot.id);
    setSlotForm({...slot});
  };
  const closeSlotEdit = () => { setEditingSlot(null); setSlotForm(null); };
  const saveSlot = () => {
    if (!slotForm) return;
    setSlots(prev => prev.map(s => s.id === editingSlot ? {...slotForm} : s));
    closeSlotEdit();
  };
  const addSlot = () => {
    const s: Slot = { id:nextSlotId++, start:"01:00", end:"02:00", genre:"TBC", dj:"VOGEL", collective:"", b2b:null };
    setSlots(prev => [...prev, s]);
    openSlotEdit(s);
  };
  const deleteSlot = (id:number) => {
    if (!window.confirm("Delete this slot?")) return;
    setEditingSlot(null);
    setSlotForm(null);
    // Small delay so edit mode closes before slot is removed from list
    setTimeout(() => setSlots(prev => prev.filter(s => s.id !== id)), 50);
  };

  const openAddCrew = () => { setEditCrewTarget(null); setCrewForm({name:"",role:"DJ",notes:"",confirmed:false,customRole:""}); setShowCrewModal(true); };
  const openEditCrew = (p:Person) => {
    const isCustom = !Object.keys(ROLE_COLORS).includes(p.role);
    setEditCrewTarget(p.id);
    setCrewForm({name:p.name, role:isCustom?"Custom...":p.role, notes:p.notes, confirmed:p.confirmed, customRole:isCustom?p.role:""});
    setShowCrewModal(true);
  };
  const saveCrew = () => {
    if (!crewForm.name.trim()) return;
    const finalRole = crewForm.role === "Custom..." ? (crewForm.customRole?.trim() || "Custom") : crewForm.role;
    const personData = { name:crewForm.name, role:finalRole, notes:crewForm.notes, confirmed:crewForm.confirmed };
    setCrew(prev => {
      const list = [...(prev[activeBlock]||[])];
      if (editCrewTarget !== null) {
        const i = list.findIndex(p => p.id === editCrewTarget);
        if (i !== -1) list[i] = {...list[i], ...personData};
      } else {
        list.push({id:nextCrewId++, ...personData});
      }
      return {...prev, [activeBlock]:list};
    });
    setShowCrewModal(false);
  };
  const deleteCrew = (bId:number, id:number) => setCrew(prev => ({...prev, [bId]:prev[bId].filter(p=>p.id!==id)}));
  const toggleConfirm = (bId:number, id:number) => setCrew(prev => ({...prev, [bId]:prev[bId].map(p=>p.id===id?{...p,confirmed:!p.confirmed}:p)}));

  const totalCrew = Object.values(crew).flat().length;
  const confirmedCrew = Object.values(crew).flat().filter(p=>p.confirmed).length;
  const crewList = (crew[activeBlock]||[]).filter(p => filterRole==="All" || p.role===filterRole);

  const btnPrimary: React.CSSProperties = { background:BC, border:"none", color:"#000", padding:"11px 22px", borderRadius:"8px", fontSize:"14px", fontWeight:900, cursor:"pointer", fontFamily:"inherit" };
  const btnSecondary: React.CSSProperties = { background:"#1a1a1a", border:"2px solid #333", color:"#aaa", padding:"11px 18px", borderRadius:"8px", fontSize:"14px", fontWeight:900, cursor:"pointer", fontFamily:"inherit" };
  const btnDanger: React.CSSProperties = { background:"#1a0a0a", border:"2px solid #441111", color:"#cc4444", padding:"9px 14px", borderRadius:"6px", fontSize:"14px", cursor:"pointer", fontFamily:"inherit", fontWeight:900 };

  return (
    <div style={{ minHeight:"100vh", backgroundImage:`url('data:image/jpeg;base64,${BG_B64}')`, backgroundSize:"cover", backgroundPosition:"center top", backgroundAttachment:"fixed", color:"#fff", fontFamily:"'Bebas Neue', Impact, 'Arial Narrow', sans-serif" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" />
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* HEADER */}
      <div style={{ background:"rgba(0,0,0,0.82)", backdropFilter:"blur(8px)", borderBottom:`3px solid ${BC}` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px", flexWrap:"wrap", gap:"12px" }}>
          <img src={`data:image/jpeg;base64,${LOGO_B64}`} alt="NIGHT SERVICE" style={{ display:"block", maxWidth:"320px", width:"100%" }} />
          <div style={{ display:"flex", gap:"24px" }}>
            {[["SLOTS", String(slots.length)], ["CREW", `${confirmedCrew}/${totalCrew}`]].map(([l,v]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"36px", fontWeight:900, color:BC, lineHeight:1 }}>{v}</div>
                <div style={{ fontSize:"11px", color:"#666" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          {[["schedule","SET TIMES"],["crew","CREW"],["overview","OVERVIEW"]].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex:1, background:tab===id?BC:"transparent", border:"none", color:tab===id?"#000":"#555", padding:"16px 8px", fontSize:"15px", fontWeight:900, cursor:"pointer", fontFamily:"inherit" }}>{label}</button>
          ))}
        </div>
      </div>

      {/* BLOCK TABS */}
      {(tab==="schedule"||tab==="crew") && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderBottom:"1px solid rgba(255,255,255,0.08)", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)" }}>
          {BLOCKS.map(b => {
            const isActive = activeBlock===b.id;
            return (
              <button key={b.id} onClick={() => setActiveBlock(b.id)} style={{ background:isActive?b.color+"25":"transparent", borderBottom:isActive?`4px solid ${b.color}`:"4px solid transparent", border:"none", color:isActive?"#fff":"#444", padding:"18px 8px", cursor:"pointer", textAlign:"center", fontFamily:"inherit", position:"relative" }}>
                {editingBlockTime===b.id ? (
                  <div onClick={e=>e.stopPropagation()} style={{ display:"flex", flexDirection:"column", gap:"4px", padding:"2px" }}>
                    <input value={blockTimeForm.label} onChange={e=>setBlockTimeForm(f=>({...f,label:e.target.value}))}
                      style={{ background:"#000", border:`1px solid ${b.color}`, color:"#fff", padding:"4px 8px", fontSize:"13px", fontFamily:"inherit", fontWeight:900, borderRadius:"4px", width:"100%", textAlign:"center" }} />
                    <input value={blockTimeForm.time} onChange={e=>setBlockTimeForm(f=>({...f,time:e.target.value}))}
                      style={{ background:"#000", border:"1px solid #444", color:"#aaa", padding:"4px 8px", fontSize:"11px", fontFamily:"inherit", borderRadius:"4px", width:"100%", textAlign:"center" }} />
                    <div style={{ display:"flex", gap:"4px", marginTop:"2px" }}>
                      <button onClick={e=>{e.stopPropagation();setBlockTimes(prev=>({...prev,[b.id]:{label:blockTimeForm.label,time:blockTimeForm.time}}));setEditingBlockTime(null);}} style={{ flex:1, background:b.color, border:"none", color:"#000", padding:"4px", fontSize:"11px", fontWeight:900, cursor:"pointer", fontFamily:"inherit", borderRadius:"4px" }}>OK</button>
                      <button onClick={e=>{e.stopPropagation();setEditingBlockTime(null);}} style={{ flex:1, background:"#222", border:"none", color:"#aaa", padding:"4px", fontSize:"11px", cursor:"pointer", fontFamily:"inherit", borderRadius:"4px" }}>✕</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:"22px", fontWeight:900, color:isActive?b.color:"#444" }}>{blockTimes[b.id]?.label||b.label}</div>
                    <div style={{ fontSize:"12px", marginTop:"3px", color:isActive?"#bbb":"#333" }}>{blockTimes[b.id]?.time||b.time}</div>
                    {tab==="schedule" && <div style={{ fontSize:"11px", color:isActive?b.color+"aa":"#333", marginTop:"4px" }}>{blockSlots(b.id).length} SLOTS</div>}
                    {isActive && <div onClick={e=>{e.stopPropagation();setEditingBlockTime(b.id);setBlockTimeForm({label:blockTimes[b.id]?.label||b.label,time:blockTimes[b.id]?.time||b.time});}} style={{ fontSize:"9px", color:b.color+"88", marginTop:"4px", cursor:"pointer" }}>EDIT LABEL</div>}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* SET TIMES */}
      {tab==="schedule" && (
        <div style={{ paddingBottom:"100px" }}>
          {blockSlots(activeBlock).map(slot => {
            const color = GENRE_COLORS[slot.genre] || BC;
            const isEditing = editingSlot===slot.id;
            return (
              <div key={slot.id} style={{ borderBottom:"1px solid rgba(255,255,255,0.07)", background:isEditing?"rgba(0,0,0,0.92)":"rgba(0,0,0,0.55)" }}>
                {isEditing && slotForm && slotForm.id === slot.id ? (
                  <div style={{ padding:"20px 24px" }}>
                    <div style={{ fontSize:"13px", color:BC, marginBottom:"20px", fontWeight:900 }}>EDITING SLOT</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                      <Field label="START TIME"><StyledInput value={slotForm.start} onChange={e => setSlotForm(f => f?{...f,start:e.target.value}:f)} placeholder="21:00" /></Field>
                      <Field label="END TIME"><StyledInput value={slotForm.end} onChange={e => setSlotForm(f => f?{...f,end:e.target.value}:f)} placeholder="22:00" /></Field>
                      <Field label="DJ"><StyledInput value={slotForm.dj} onChange={e => setSlotForm(f => f?{...f,dj:e.target.value}:f)} placeholder="DJ name" /></Field>
                      <Field label="B2B GUEST"><StyledInput value={slotForm.b2b||""} onChange={e => setSlotForm(f => f?{...f,b2b:e.target.value||null}:f)} placeholder="B2B (optional)" /></Field>
                      <Field label="COLLECTIVE"><StyledInput value={slotForm.collective} onChange={e => setSlotForm(f => f?{...f,collective:e.target.value}:f)} placeholder="Collective" /></Field>
                      <Field label="GENRE"><StyledInput value={slotForm.genre} onChange={e => setSlotForm(f => f?{...f,genre:e.target.value}:f)} placeholder="Genre" /></Field>
                    </div>
                    <div style={{ display:"flex", gap:"10px", marginTop:"20px" }}>
                      <button onClick={saveSlot} style={btnPrimary}>SAVE SLOT</button>
                      <button onClick={() => closeSlotEdit()} style={btnSecondary}>CANCEL</button>
                      <button onClick={() => deleteSlot(slot.id)} style={btnDanger}>DELETE</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display:"grid", gridTemplateColumns:"90px 4px 1fr auto", minHeight:"64px" }}>
                    <div style={{ background:"rgba(0,0,0,0.6)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"12px 8px", borderRight:"1px solid rgba(255,255,255,0.07)" }}>
                      <div style={{ fontSize:"20px", fontWeight:900 }}>{slot.start}</div>
                      <div style={{ fontSize:"11px", color:"#555" }}>{slot.end}</div>
                    </div>
                    <div style={{ background:color, opacity:0.85 }} />
                    <div style={{ padding:"14px 18px", background:"rgba(0,0,0,0.45)", display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"baseline", gap:"10px", flexWrap:"wrap" }}>
                          <span style={{ fontSize:"26px", fontWeight:900 }}>{slot.dj}</span>
                          {slot.b2b && slot.b2b!==slot.dj && (
                            <>
                              <span style={{ fontSize:"14px", color:"#555" }}>B2B</span>
                              <span style={{ fontSize:"26px", fontWeight:900, color:BC }}>{slot.b2b}</span>
                            </>
                          )}
                        </div>
                        {slot.collective && <div style={{ fontSize:"13px", color:"#777", marginTop:"3px" }}>{slot.collective}</div>}
                      </div>
                      <div style={{ background:color+"22", border:`1px solid ${color}55`, color, padding:"5px 14px", borderRadius:"2px", fontSize:"13px", whiteSpace:"nowrap" }}>{slot.genre}</div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", padding:"0 16px", background:"rgba(0,0,0,0.45)" }}>
                      <button onClick={() => editingSlot===slot.id ? closeSlotEdit() : openSlotEdit(slot)} style={{ background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"#aaa", padding:"8px 16px", borderRadius:"6px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", fontWeight:900 }}>{editingSlot===slot.id ? "CLOSE" : "EDIT"}</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ padding:"20px 24px" }}>
            <button onClick={addSlot} style={btnPrimary}>+ ADD SLOT</button>
          </div>
        </div>
      )}

      {/* CREW */}
      {tab==="crew" && (
        <div style={{ padding:"20px 20px 100px", background:"rgba(0,0,0,0.5)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {["All",...Object.keys(ROLE_COLORS)].map(r => (
                <button key={r} onClick={() => setFilterRole(r)} style={{ background:filterRole===r?(ROLE_COLORS[r]||BC):"#111", border:`2px solid ${filterRole===r?(ROLE_COLORS[r]||BC):"#2a2a2a"}`, color:filterRole===r?"#000":"#888", padding:"8px 16px", borderRadius:"6px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", fontWeight:900 }}>{r}</button>
              ))}
            </div>
            <button onClick={openAddCrew} style={btnPrimary}>+ ADD CREW</button>
          </div>
          {crewList.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px", color:"#777", border:"2px dashed #333", borderRadius:"10px", background:"rgba(0,0,0,0.6)" }}>
              <div style={{ fontSize:"40px", marginBottom:"12px" }}>+</div>
              <div style={{ fontSize:"16px", fontWeight:900, marginBottom:"8px" }}>NO CREW ADDED YET</div>
              <div style={{ fontSize:"13px", color:"#555" }}>Hit ADD CREW to add DJs, photographers, volunteers and more</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              {crewList.map(person => {
                const rc = ROLE_COLORS[person.role]||BC;
                return (
                  <div key={person.id} style={{ background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", borderLeft:`5px solid ${person.confirmed?rc:"#333"}`, padding:"16px 20px", borderRadius:"6px", display:"flex", justifyContent:"space-between", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"16px", flex:1, minWidth:"180px" }}>
                      <div style={{ background:rc+"33", border:`2px solid ${rc}`, color:rc, fontSize:"13px", padding:"6px 14px", borderRadius:"6px", minWidth:"110px", textAlign:"center", fontWeight:900 }}>{person.role}</div>
                      <div>
                        <div style={{ fontSize:"22px", fontWeight:900, color:"#fff" }}>{person.name}</div>
                        {person.notes && <div style={{ fontSize:"13px", color:"#888", marginTop:"4px" }}>{person.notes}</div>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                      <button onClick={() => toggleConfirm(activeBlock,person.id)} style={{ background:person.confirmed?BC:"#1a1a1a", border:`2px solid ${person.confirmed?BC:"#333"}`, color:person.confirmed?"#000":"#555", padding:"8px 16px", borderRadius:"6px", fontSize:"13px", cursor:"pointer", fontFamily:"inherit", fontWeight:900 }}>{person.confirmed?"CONFIRMED":"UNCONFIRMED"}</button>
                      <button onClick={() => openEditCrew(person)} style={btnSecondary}>EDIT</button>
                      <button onClick={() => deleteCrew(activeBlock,person.id)} style={btnDanger}>X</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW */}
      {tab==="overview" && (
        <div style={{ paddingBottom:"80px" }}>
          <div style={{ padding:"20px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize:"13px", color:"#aaa", marginBottom:"16px", fontWeight:900 }}>FULL SET TIMELINE</div>
            {[...slots].sort((a,b)=>toEventMins(a.start)-toEventMins(b.start)).map((slot,i) => {
              const color = GENRE_COLORS[slot.genre]||BC;
              return (
                <div key={i} style={{ display:"flex", alignItems:"center", background:"rgba(0,0,0,0.82)", marginBottom:"2px", borderRadius:"4px" }}>
                  <div style={{ width:"70px", padding:"10px", fontSize:"15px", fontWeight:900, color:"#666", flexShrink:0 }}>{slot.start}</div>
                  <div style={{ width:"3px", background:color, alignSelf:"stretch", flexShrink:0 }} />
                  <div style={{ padding:"10px 14px", flex:1 }}>
                    <span style={{ fontSize:"17px", fontWeight:900 }}>{slot.dj}</span>
                    {slot.b2b && <span style={{ fontSize:"16px", color:BC, marginLeft:"12px" }}>B2B {slot.b2b}</span>}
                    {slot.collective && <span style={{ fontSize:"13px", color:"#555", marginLeft:"14px" }}>{slot.collective}</span>}
                  </div>
                  <div style={{ padding:"4px 12px", color, fontSize:"12px", flexShrink:0 }}>{slot.genre}</div>
                </div>
              );
            })}
          </div>
          <div style={{ padding:"20px" }}>
            <div style={{ fontSize:"13px", color:"#aaa", marginBottom:"16px", fontWeight:900 }}>CREW OVERVIEW</div>
            {BLOCKS.map(b => (
              <div key={b.id} style={{ marginBottom:"28px", background:"rgba(0,0,0,0.7)", borderRadius:"10px", padding:"16px", backdropFilter:"blur(6px)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", borderBottom:`2px solid ${b.color}`, paddingBottom:"10px", marginBottom:"14px" }}>
                  <span style={{ fontSize:"22px", fontWeight:900, color:b.color }}>{b.label}</span>
                  <span style={{ fontSize:"13px", color:"#777" }}>{b.time}</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {(crew[b.id]||[]).map(p => {
                    const rc = ROLE_COLORS[p.role]||b.color;
                    return (
                      <div key={p.id} style={{ background:"rgba(0,0,0,0.85)", border:`2px solid ${p.confirmed?rc:"#333"}`, color:"#fff", padding:"8px 14px", fontSize:"14px", borderRadius:"6px", display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ color:rc, fontSize:"11px", fontWeight:900, background:rc+"22", padding:"2px 8px", borderRadius:"4px" }}>{p.role}</span>
                        <span style={{ fontWeight:900 }}>{p.name}</span>
                        {!p.confirmed && <span style={{ color:"#555", fontSize:"11px" }}>UNCONFIRMED</span>}
                      </div>
                    );
                  })}
                  {!(crew[b.id]||[]).length && <div style={{ color:"#333", fontSize:"12px" }}>NO CREW ADDED</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", borderTop:"1px solid rgba(255,255,255,0.08)", padding:"10px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px" }}>
        <div style={{ fontSize:"11px", color:BC }}>NIGHT SERVICE - JULY 10 9PM - JULY 11 9PM - PAWN and CO BRISBANE</div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ fontSize:"10px", color:"#444" }}>DYLAN ALCOTT FOUNDATION - LEUKAEMIA FOUNDATION</div>
          <button onClick={() => {
            if (window.confirm("Reset all data back to defaults? This cannot be undone.")) {
              localStorage.clear();
              window.location.reload();
            }
          }} style={{ background:"transparent", border:"1px solid #553333", color:"#cc4444", padding:"4px 10px", borderRadius:"4px", fontSize:"10px", cursor:"pointer", fontFamily:"inherit", fontWeight:900 }}>↺ RESET DATA</button>
        </div>
      </div>

      {/* CREW MODAL */}
      {showCrewModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:"20px" }}>
          <div style={{ background:"rgba(10,10,10,0.95)", border:`2px solid ${BC}`, padding:"36px", width:"100%", maxWidth:"440px", borderRadius:"12px" }}>
            <div style={{ fontSize:"22px", color:BC, marginBottom:"8px", fontWeight:900 }}>{editCrewTarget?"EDIT CREW MEMBER":`ADD TO ${blockTimes[activeBlock]?.label||BLOCKS[activeBlock].label}`}</div>
            <div style={{ fontSize:"13px", color:"#666", marginBottom:"24px" }}>Select a role below — DJ, Photographer, Volunteer, Security or Stage Manager</div>
            <Field label="NAME"><StyledInput value={crewForm.name} onChange={e => setCrewForm(f => ({...f,name:e.target.value}))} placeholder="Full name" /></Field>
            <Field label="NOTES"><StyledInput value={crewForm.notes} onChange={e => setCrewForm(f => ({...f,notes:e.target.value}))} placeholder="Requirements, contact..." /></Field>
            <Field label="ROLE">
              <select value={crewForm.role} onChange={e => setCrewForm(f => ({...f, role:e.target.value, customRole:""}))} style={{ width:"100%", background:"#000", border:"2px solid #2a2a2a", color:"#fff", padding:"10px 14px", fontSize:"15px", fontFamily:"inherit", fontWeight:700, borderRadius:"6px" }}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
              {crewForm.role === "Custom..." && (
                <div style={{ marginTop:"10px" }}>
                  <StyledInput
                    value={crewForm.customRole||""}
                    onChange={(e:any) => setCrewForm(f => ({...f, customRole:e.target.value}))}
                    placeholder="e.g. Merch + Bar, Livestream Operator, Sound Tech..."
                  />
                </div>
              )}
            </Field>
            <div style={{ marginBottom:"28px" }}>
              <button onClick={() => setCrewForm(f => ({...f,confirmed:!f.confirmed}))} style={{ background:crewForm.confirmed?BC:"#1a1a1a", border:`2px solid ${crewForm.confirmed?BC:"#333"}`, color:crewForm.confirmed?"#000":"#666", padding:"10px 20px", fontSize:"14px", borderRadius:"6px", cursor:"pointer", fontFamily:"inherit", fontWeight:900 }}>{crewForm.confirmed?"CONFIRMED":"MARK AS CONFIRMED"}</button>
            </div>
            <div style={{ display:"flex", gap:"10px" }}>
              <button onClick={saveCrew} style={{ ...btnPrimary, flex:1 }}>{editCrewTarget?"SAVE":"ADD"}</button>
              <button onClick={() => setShowCrewModal(false)} style={btnSecondary}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
