import React, { useState, useEffect } from 'react';
import { 
  Project, 
  ProjectType, 
  PrimaryStatus, 
  BlockerType, 
  BlockerOwner, 
  NextActionOwner, 
  ProjectHealth,
  PermitTrack,
  ProjectBlocker,
  ProjectOperation
} from '../types';
import { PlusIcon, CheckCircleIcon } from './Icons';

interface ProjectFormProps {
  project?: Project;
  onSave: (project: Partial<Project>) => void;
  onClose: () => void;
}

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const PERMIT_PRESETS = ['Planning Permit', 'Building Permit', 'Health Permit', 'Fire Permit', 'Public Works', 'Grading Permit', 'MEP Permit'];

const mapTypeToOwner = (type: BlockerType): BlockerOwner => {
  switch (type) {
    case BlockerType.Client: return BlockerOwner.Client;
    case BlockerType.CityAgency: return BlockerOwner.City;
    case BlockerType.Consultant: return BlockerOwner.Consultant;
    case BlockerType.Internal: return BlockerOwner.Internal;
    case BlockerType.External: return BlockerOwner.Consultant;
    default: return BlockerOwner.Internal;
  }
};

const mapOwnerToType = (owner: NextActionOwner): BlockerType => {
  switch (owner) {
    case NextActionOwner.Client: return BlockerType.Client;
    case NextActionOwner.City: return BlockerType.CityAgency;
    case NextActionOwner.Consultant: return BlockerType.Consultant;
    case NextActionOwner.Internal: return BlockerType.Internal;
    default: return BlockerType.Internal;
  }
};

const ActionCheckbox = ({ checked, onChange, label }: { checked: boolean, onChange: (val: boolean) => void, label: string }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 group cursor-pointer transition-all w-full text-left"
  >
    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${checked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}>
      {checked && (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      )}
    </div>
    <span className={`text-xs font-bold transition-colors ${checked ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{label}</span>
  </button>
);

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    city: '',
    type: ProjectType.SingleFamily,
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    clientAddress: '',
    projectManager: '',
    status: PrimaryStatus.P0,
    health: ProjectHealth.Green,
    operations: [],
    isArchived: false,
    permitTracks: [
      { id: Math.random().toString(36).substr(2, 9), name: 'Planning Permit', blockers: [] }
    ],
    designChecklist: {
      conceptApproved: false,
      zoningConfirmed: false,
      plans60Complete: false,
      plans90Complete: false,
      internalQA: false,
      clientSignOff: false,
    },
    permittingChecklist: {
      initialSubmittal: false,
      firstPlanCheck: false,
      correctionsResubmitted: false,
      planCheck2Received: false,
      corrections2Submitted: false,
      permitIssued: false,
    },
    constructionChecklist: {
      permitSetReleased: false,
      submittalsReviewed: false,
      rfisResponded: false,
      designChangesEvaluated: false,
      inspectionSupportCompleted: false,
    },
    ...project
  });

  useEffect(() => {
    if (project) {
      setFormData({ ...project });
    }
  }, [project]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPermitTrack = () => {
    const newTrack: PermitTrack = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      blockers: []
    };
    setFormData(prev => ({
      ...prev,
      permitTracks: [...(prev.permitTracks || []), newTrack]
    }));
  };

  const handleRemovePermitTrack = (id: string) => {
    setFormData(prev => ({
      ...prev,
      permitTracks: (prev.permitTracks || []).filter(t => t.id !== id),
      operations: (prev.operations || []).filter(op => op.linkedTrackId !== id)
    }));
  };

  const handleUpdatePermitTrackName = (id: string, name: string) => {
    setFormData(prev => {
      const updatedPermitTracks = (prev.permitTracks || []).map(t => t.id === id ? { ...t, name } : t);
      
      const updatedOperations = (prev.operations || []).map(op => {
        if (op.linkedTrackId === id && op.linkedBlockerId) {
          const track = updatedPermitTracks.find(t => t.id === id);
          const blocker = track?.blockers.find(b => b.id === op.linkedBlockerId);
          return {
            ...op,
            description: `Resolve Block in ${name || 'Permit Track'}: ${blocker?.description || 'New Issue'}`
          };
        }
        return op;
      });

      return {
        ...prev,
        permitTracks: updatedPermitTracks,
        operations: updatedOperations
      };
    });
  };

  const handleAddBlocker = (trackId: string) => {
    const blockerId = Math.random().toString(36).substr(2, 9);
    const track = (formData.permitTracks || []).find(t => t.id === trackId);
    const initialType = BlockerType.Client;
    const initialOwner = mapTypeToOwner(initialType);
    
    const newBlocker: ProjectBlocker = {
      id: blockerId,
      type: initialType,
      owner: initialOwner,
      description: ''
    };

    const newOp: ProjectOperation = {
      id: Math.random().toString(36).substr(2, 9),
      description: `Resolve Block in ${track?.name || 'Permit Track'}: New Issue`,
      owner: initialOwner as unknown as NextActionOwner,
      isCompleted: false,
      date: new Date().toISOString().split('T')[0],
      linkedBlockerId: blockerId,
      linkedTrackId: trackId
    };

    setFormData(prev => ({
      ...prev,
      permitTracks: (prev.permitTracks || []).map(t => t.id === trackId ? {
        ...t,
        blockers: [...(t.blockers || []), newBlocker]
      } : t),
      operations: [...(prev.operations || []), newOp],
      health: ProjectHealth.Red
    }));
  };

  const handleUpdateBlocker = (trackId: string, blockerId: string, field: keyof ProjectBlocker, value: any) => {
    setFormData(prev => {
      const updatedPermitTracks = (prev.permitTracks || []).map(t => t.id === trackId ? {
        ...t,
        blockers: (t.blockers || []).map(b => {
          if (b.id === blockerId) {
            const updatedBlocker = { ...b, [field]: value };
            if (field === 'type') {
              updatedBlocker.owner = mapTypeToOwner(value as BlockerType);
            }
            return updatedBlocker;
          }
          return b;
        })
      } : t);

      const targetTrack = updatedPermitTracks.find(t => t.id === trackId);
      const targetBlocker = targetTrack?.blockers.find(b => b.id === blockerId);

      const updatedOperations = (prev.operations || []).map(op => {
        if (op.linkedBlockerId === blockerId && targetBlocker) {
          return {
            ...op,
            owner: targetBlocker.owner as unknown as NextActionOwner,
            description: `Resolve Block in ${targetTrack?.name || 'Permit Track'}: ${targetBlocker.description || 'New Issue'}`
          };
        }
        return op;
      });

      return {
        ...prev,
        permitTracks: updatedPermitTracks,
        operations: updatedOperations
      };
    });
  };

  const handleRemoveBlocker = (trackId: string, blockerId: string) => {
    setFormData(prev => ({
      ...prev,
      permitTracks: (prev.permitTracks || []).map(t => {
        if (t.id === trackId) {
          return {
            ...t,
            blockers: (t.blockers || []).filter(b => b.id !== blockerId)
          };
        }
        return t;
      }),
      operations: (prev.operations || []).filter(op => op.linkedBlockerId !== blockerId)
    }));
  };

  const handleClearAllBlockers = () => {
    setFormData(prev => ({
      ...prev,
      permitTracks: (prev.permitTracks || []).map(t => ({ ...t, blockers: [] })),
      operations: (prev.operations || []).filter(op => !op.linkedBlockerId),
      health: ProjectHealth.Green
    }));
  };

  const handleAddManualOperation = () => {
    const newOp: ProjectOperation = {
      id: Math.random().toString(36).substr(2, 9),
      description: '',
      owner: NextActionOwner.Internal,
      isCompleted: false,
      date: new Date().toISOString().split('T')[0]
    };
    setFormData(prev => ({
      ...prev,
      operations: [...(prev.operations || []), newOp]
    }));
  };

  const handleUpdateOperation = (id: string, field: keyof ProjectOperation, value: any) => {
    setFormData(prev => ({
      ...prev,
      operations: (prev.operations || []).map(op => op.id === id ? { ...op, [field]: value } : op)
    }));
  };

  const handleOperationToggle = (id: string, checked: boolean) => {
    setFormData(prev => {
      const op = prev.operations?.find(o => o.id === id);
      if (!op) return prev;

      let nextTracks = [...(prev.permitTracks || [])];
      
      if (checked && op.linkedBlockerId) {
        // Completion: Remove the linked blocker from Section 3.0
        nextTracks = nextTracks.map(t => t.id === op.linkedTrackId ? {
          ...t,
          blockers: t.blockers.filter(b => b.id !== op.linkedBlockerId)
        } : t);
      } else if (!checked && op.linkedBlockerId) {
        // Re-opening: Restore the linked blocker back to Section 3.0
        const trackIdx = nextTracks.findIndex(t => t.id === op.linkedTrackId);
        if (trackIdx !== -1) {
          const track = nextTracks[trackIdx];
          const alreadyExists = track.blockers.some(b => b.id === op.linkedBlockerId);
          
          if (!alreadyExists) {
            const reconstructedType = mapOwnerToType(op.owner);
            const parts = op.description.split(': ');
            const reconstructedDesc = parts.length > 1 ? parts.slice(1).join(': ') : op.description;

            const restoredBlocker: ProjectBlocker = {
              id: op.linkedBlockerId,
              type: reconstructedType,
              owner: op.owner as unknown as BlockerOwner,
              description: reconstructedDesc === 'New Issue' ? '' : reconstructedDesc
            };

            nextTracks[trackIdx] = {
              ...track,
              blockers: [...track.blockers, restoredBlocker]
            };
          }
        }
      }

      const remainingBlockers = nextTracks.flatMap(t => t.blockers).length;
      const nextHealth = remainingBlockers === 0 ? ProjectHealth.Green : ProjectHealth.Red;

      return {
        ...prev,
        permitTracks: nextTracks,
        health: nextHealth,
        operations: (prev.operations || []).map(o => o.id === id ? { ...o, isCompleted: checked } : o)
      };
    });
  };

  const handleCheckboxChange = (phase: 'designChecklist' | 'permittingChecklist' | 'constructionChecklist', key: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [phase]: {
        ...(prev[phase] as any),
        [key]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputBase = "w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all duration-200 placeholder:text-slate-400 font-medium";
  const labelBase = "text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block";
  const sectionTitle = "text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2";

  const getHealthStyles = (health: ProjectHealth = ProjectHealth.Green) => {
    if (health === ProjectHealth.Green) return { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500' };
    if (health === ProjectHealth.Yellow) return { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', dot: 'bg-amber-500' };
    return { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', dot: 'bg-rose-500' };
  };

  const healthStyle = getHealthStyles(formData.health);

  const renderPermitTrack = (track: PermitTrack, index: number) => {
    const hasBlockers = (track.blockers || []).length > 0;
    const roman = ROMAN_NUMERALS[index] || (index + 1).toString();

    return (
      <div key={track.id} className={`p-6 rounded-[2rem] border transition-all ${hasBlockers ? 'bg-rose-50/20 border-rose-100' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-1 rounded-lg uppercase tracking-widest">TRK {roman}</span>
            <input 
              value={track.name} 
              onChange={(e) => handleUpdatePermitTrackName(track.id, e.target.value)}
              placeholder="Track Name..."
              className="bg-transparent border-none text-sm font-black text-slate-900 uppercase tracking-tight focus:ring-0 w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => handleAddBlocker(track.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 transition-all active:scale-95"
            >
              <PlusIcon /> Add blocker
            </button>
            <button 
              type="button"
              onClick={() => handleRemovePermitTrack(track.id)}
              className="text-slate-300 hover:text-rose-500 transition-colors p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PERMIT_PRESETS.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handleUpdatePermitTrackName(track.id, preset)}
                className="text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded bg-slate-50 text-slate-400 hover:bg-amber-100 hover:text-amber-700 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {(track.blockers || []).length === 0 ? (
            <div className="py-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300">
              <span className="text-[10px] font-black uppercase tracking-widest">No Blockers</span>
            </div>
          ) : (
            <div className="space-y-4">
              {track.blockers.map((blocker) => (
                <div key={blocker.id} className="p-4 bg-white rounded-2xl border border-rose-100 shadow-sm relative group">
                  <button 
                    type="button"
                    onClick={() => handleRemoveBlocker(track.id, blocker.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="relative group/select">
                      <label className={labelBase}>Blocker Category</label>
                      <div className="relative">
                        <select 
                          value={blocker.type} 
                          onChange={(e) => handleUpdateBlocker(track.id, blocker.id, 'type', e.target.value)}
                          className={`w-full px-3 py-2 pr-8 rounded-lg border text-[11px] font-bold outline-none cursor-pointer appearance-none transition-colors group-hover/select:border-slate-300 ${blocker.type === BlockerType.CityAgency ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        >
                          {Object.values(BlockerType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="relative group/select">
                      <label className={labelBase}>Task Assigned to</label>
                      <div className="relative">
                        <select 
                          value={blocker.owner || ""} 
                          onChange={(e) => handleUpdateBlocker(track.id, blocker.id, 'owner', e.target.value || undefined)}
                          className={`w-full px-3 py-2 pr-8 rounded-lg border text-[11px] font-bold focus:bg-white outline-none cursor-pointer appearance-none transition-colors group-hover/select:border-slate-300 ${blocker.owner === BlockerOwner.Internal ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : (blocker.owner === BlockerOwner.City ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-900')}`}
                        >
                          <option value="">None</option>
                          {Object.values(BlockerOwner).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  <input 
                    value={blocker.description} 
                    onChange={(e) => handleUpdateBlocker(track.id, blocker.id, 'description', e.target.value)}
                    placeholder="Describe specific blocker issue..."
                    className="w-full px-3 py-2 rounded-lg bg-rose-50/30 border border-rose-100 text-xs font-medium placeholder:text-rose-200 outline-none focus:bg-white focus:border-rose-300 transition-all text-slate-900"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-hidden">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[1300px] max-h-[96vh] flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white z-10 rounded-t-[2.5rem]">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <span className="w-2.5 h-10 bg-amber-500 rounded-full" />
              {project ? 'Strategic Command' : 'New Project Deployment'}
            </h2>
            <p className="text-sm text-slate-400 mt-1 font-medium">Project Execution Roadmap for <span className="text-slate-900 font-bold">{formData.name || 'Undefined Area'}</span></p>
          </div>
          <button onClick={onClose} className="p-4 rounded-[1.5rem] hover:bg-slate-100 text-slate-300 hover:text-slate-900 transition-all active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-10 space-y-12 bg-slate-50/40">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`${sectionTitle} text-indigo-600`}>1.0 Project Profile</h3>
              <div className="flex gap-4">
                <div className="flex flex-col min-w-[220px]">
                  <label className={labelBase}>Operational Phase</label>
                  <div className="relative">
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-5 py-3 rounded-2xl border-2 border-amber-500 bg-amber-50 font-black text-[11px] uppercase tracking-wider text-amber-700 focus:ring-4 focus:ring-amber-500/10 outline-none cursor-pointer appearance-none text-center">
                      {Object.values(PrimaryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-amber-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col min-w-[220px]">
                  <label className={labelBase}>Pulse Health</label>
                  <div className={`relative flex items-center px-4 rounded-2xl border-2 transition-all duration-300 ${healthStyle.bg} ${healthStyle.border}`}>
                    <div className={`w-3 h-3 rounded-full mr-3 animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.1)] ${healthStyle.dot}`} />
                    <select 
                      name="health" 
                      value={formData.health} 
                      onChange={handleChange} 
                      className={`flex-1 py-3 bg-transparent font-black text-[11px] uppercase tracking-wider text-center appearance-none outline-none cursor-pointer ${healthStyle.text}`}
                    >
                      {Object.values(ProjectHealth).map(h => <option key={h} value={h} className="text-slate-900 bg-white">{h}</option>)}
                    </select>
                    <div className={`absolute inset-y-0 right-4 flex items-center pointer-events-none ${healthStyle.text}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="md:col-span-8">
                <label className={labelBase}>Legal Title / Workspace Name</label>
                <input required name="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g. 01-11141 Limetree Dr" className={inputBase} />
              </div>
              <div className="md:col-span-4">
                <label className={labelBase}>Jurisdiction</label>
                <input required name="city" value={formData.city || ''} onChange={handleChange} placeholder="e.g. Santa Ana" className={inputBase} />
              </div>
              <div className="md:col-span-4">
                <label className={labelBase}>Asset Type</label>
                <div className="relative">
                  <select name="type" value={formData.type} onChange={handleChange} className={inputBase + " appearance-none"}>
                    {Object.values(ProjectType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
              <div className="md:col-span-4">
                <label className={labelBase}>Operational Lead</label>
                <input name="projectManager" value={formData.projectManager || ''} onChange={handleChange} className={inputBase} />
              </div>
            </div>
          </section>

          <section>
            <h3 className={`${sectionTitle} text-indigo-600`}>2.0 Client Stakeholders</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="md:col-span-6">
                <label className={labelBase}>Primary Entity</label>
                <input required name="clientName" value={formData.clientName || ''} onChange={handleChange} placeholder="Full name or trust" className={inputBase} />
              </div>
              <div className="md:col-span-3">
                <label className={labelBase}>Phone</label>
                <input name="clientPhone" value={formData.clientPhone || ''} onChange={handleChange} placeholder="(555) 000-0000" className={inputBase} />
              </div>
              <div className="md:col-span-3">
                <label className={labelBase}>Email</label>
                <input type="email" name="clientEmail" value={formData.clientEmail || ''} onChange={handleChange} placeholder="client@example.com" className={inputBase} />
              </div>
              <div className="md:col-span-12">
                <label className={labelBase}>Client Mailing Address</label>
                <input name="clientAddress" value={formData.clientAddress || ''} onChange={handleChange} placeholder="Full address for formal communication..." className={inputBase} />
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`${sectionTitle} text-indigo-600`}>3.0 Blockers & Permitting</h3>
              <div className="flex gap-2">
                {(formData.permitTracks || []).some(t => (t.blockers || []).length > 0) && (
                  <button 
                    type="button"
                    onClick={handleClearAllBlockers}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 font-black text-[9px] uppercase tracking-widest border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                  >
                    Flush All Blockers
                  </button>
                )}
                <button 
                  type="button"
                  onClick={handleAddPermitTrack}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-100"
                >
                  <PlusIcon /> New Track
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {(formData.permitTracks || []).map((track, idx) => renderPermitTrack(track, idx))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`${sectionTitle} text-indigo-600`}>4.0 Strategic Operations</h3>
              <button 
                type="button"
                onClick={handleAddManualOperation}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-amber-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-100"
              >
                <PlusIcon /> New Strategic Move
              </button>
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              {(!formData.operations || formData.operations.length === 0) ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No operations queued.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(formData.operations || []).map((op) => {
                    const linkedBlocker = op.linkedBlockerId ? (formData.permitTracks || [])
                      .flatMap(t => t.blockers)
                      .find(b => b.id === op.linkedBlockerId) : null;
                    
                    const blockerType = linkedBlocker?.type;

                    return (
                      <div 
                        key={op.id} 
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${op.isCompleted ? 'bg-slate-50/30 border-slate-100 opacity-60' : 'bg-slate-50/50 border-slate-100 hover:border-amber-500/30'}`}
                      >
                        <button 
                          type="button"
                          onClick={() => handleOperationToggle(op.id, !op.isCompleted)}
                          className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${op.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'}`}
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>

                        <div className="flex-1 flex flex-col lg:flex-row items-center gap-4">
                          <div className="flex-1 min-w-0 flex items-center gap-3">
                            {blockerType && (
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                                blockerType.includes('City') ? 'bg-amber-100 text-amber-700' : 
                                blockerType.includes('Client') ? 'bg-indigo-100 text-indigo-700' :
                                blockerType.includes('Consultant') ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {blockerType.split(' ')[0]}
                              </span>
                            )}
                            <input 
                              value={op.description}
                              onChange={(e) => handleUpdateOperation(op.id, 'description', e.target.value)}
                              placeholder="Operation description..."
                              className={`flex-1 bg-transparent border-none text-slate-900 font-bold text-sm focus:ring-0 placeholder:text-slate-300 transition-all ${op.isCompleted ? 'line-through decoration-slate-400 text-slate-400' : ''}`}
                              readOnly={!!op.linkedBlockerId}
                            />
                          </div>
                          
                          <div className="flex items-center gap-3 w-full lg:w-auto">
                              <div className="relative group/select">
                                <select 
                                    value={op.owner}
                                    onChange={(e) => handleUpdateOperation(op.id, 'owner', e.target.value)}
                                    className={`px-3 py-1.5 pr-8 rounded-lg border text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer appearance-none transition-colors ${
                                      op.owner === NextActionOwner.Internal ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 
                                      op.owner === NextActionOwner.City ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      'bg-white border-slate-100 text-slate-500'
                                    }`}
                                >
                                    {Object.values(NextActionOwner).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none opacity-40">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                              </div>

                              <input 
                                  type="date"
                                  value={op.date}
                                  onChange={(e) => handleUpdateOperation(op.id, 'date', e.target.value)}
                                  className="bg-white border border-slate-100 text-slate-500 text-[10px] font-black uppercase py-1.5 px-3 rounded-lg cursor-pointer hover:border-slate-300 transition-colors"
                              />

                              {!op.linkedBlockerId && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setFormData(prev => ({
                                            ...prev,
                                            operations: (prev.operations || []).filter(o => o.id !== op.id)
                                        }));
                                  }}
                                  className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                  title="Delete manual operation"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <h3 className={`${sectionTitle} text-indigo-600`}>5.0 Quality Checkpoints</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  <span>Design Phase</span>
                  <span className="w-8 h-1 bg-amber-400 rounded-full" />
                </h4>
                <div className="space-y-2">
                  {[
                    ['conceptApproved', 'Concept approved'],
                    ['zoningConfirmed', 'Zoning confirmed'],
                    ['plans60Complete', '60% development'],
                    ['plans90Complete', '90% final design'],
                    ['internalQA', 'Internal Studio QA'],
                    ['clientSignOff', 'Final Client sign-off'],
                  ].map(([key, label]) => (
                    <ActionCheckbox 
                      key={key}
                      label={label}
                      checked={!!(formData.designChecklist as any)?.[key]}
                      onChange={(val) => handleCheckboxChange('designChecklist', key, val)}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  <span>Submittal Pipeline</span>
                  <span className="w-8 h-1 bg-emerald-500 rounded-full" />
                </h4>
                <div className="space-y-2">
                  {[
                    ['initialSubmittal', 'In-take complete'],
                    ['firstPlanCheck', '1st Review received'],
                    ['correctionsResubmitted', 'Resubmittal active'],
                    ['planCheck2Received', '2nd Review received'],
                    ['corrections2Submitted', 'Final submittal'],
                    ['permitIssued', 'Permit secured'],
                  ].map(([key, label]) => (
                    <ActionCheckbox 
                      key={key}
                      label={label}
                      checked={!!(formData.permittingChecklist as any)?.[key]}
                      onChange={(val) => handleCheckboxChange('permittingChecklist', key, val)}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  <span>Field Deployment</span>
                  <span className="w-8 h-1 bg-blue-500 rounded-full" />
                </h4>
                <div className="space-y-2">
                  {[
                    ['permitSetReleased', 'Construction set issued'],
                    ['submittalsReviewed', 'Submittals tracked'],
                    ['rfisResponded', 'Field RFI support'],
                    ['designChangesEvaluated', 'Field revisions'],
                    ['inspectionSupportCompleted', 'Final close-out'],
                  ].map(([key, label]) => (
                    <ActionCheckbox 
                      key={key}
                      label={label}
                      checked={!!(formData.constructionChecklist as any)?.[key]}
                      onChange={(val) => handleCheckboxChange('constructionChecklist', key, val)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </form>

        <div className="px-10 py-8 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-8 rounded-b-[2.5rem]">
          <div className="flex items-center gap-4 cursor-pointer group">
            <div 
              onClick={() => setFormData(prev => ({...prev, isArchived: !prev.isArchived}))}
              className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${formData.isArchived ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200 group-hover:border-slate-300'}`}
            >
              {formData.isArchived && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Archive Project</span>
          </div>
          
          <div className="flex gap-4 w-full sm:w-auto">
            <button onClick={onClose} className="px-10 py-4 rounded-2xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition-all active:scale-95">
              Discard
            </button>
            <button 
              onClick={handleSubmit} 
              className="px-16 py-4 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-amber-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl shadow-slate-100"
            >
              {project ? 'Confirm Change' : 'Launch Workspace'}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectForm;