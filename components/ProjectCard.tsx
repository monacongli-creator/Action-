
import React from 'react';
import { Project, BlockerType } from '../types';
import { STATUS_COLORS, HEALTH_COLORS } from '../constants';
import { AlertCircleIcon, ArchiveIcon } from './Icons';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onArchiveToggle?: (e: React.MouseEvent) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onArchiveToggle }) => {
  // Aggregate all blockers from all tracks
  const tracks = project.permitTracks || [];
  const activeBlockers = tracks.flatMap(t => t.blockers || []).filter(b => b.type !== BlockerType.None);
  const isBlocked = activeBlockers.length > 0;
  
  const designKeys = Object.values(project.designChecklist);
  const designCompleted = designKeys.filter(Boolean).length;
  const designTotal = designKeys.length;

  const permitKeys = Object.values(project.permittingChecklist);
  const permitCompleted = permitKeys.filter(Boolean).length;
  const permitTotal = permitKeys.length;

  const constKeys = Object.values(project.constructionChecklist || {});
  const constCompleted = constKeys.filter(Boolean).length;
  const constTotal = constKeys.length;

  const activeOp = (project.operations || []).find(op => !op.isCompleted) || project.operations?.[0];

  return (
    <div 
      onClick={onClick}
      className={`relative group bg-white border rounded-2xl p-6 transition-all duration-300 cursor-pointer overflow-hidden
        ${isBlocked 
          ? 'border-rose-300 shadow-lg shadow-rose-50' 
          : 'border-slate-200 hover:border-amber-400 hover:shadow-2xl hover:shadow-amber-100/40'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${HEALTH_COLORS[project.health]}`} />
            <h3 className="font-black text-slate-900 text-lg group-hover:text-amber-600 transition-colors truncate tracking-tight">{project.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <span>{project.city}</span>
            <span className="opacity-30">•</span>
            <span className="truncate">{project.clientName}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border whitespace-nowrap ${STATUS_COLORS[project.status]}`}>
            {project.status.split(' – ')[0]}
          </span>
          {onArchiveToggle && (
            <button 
              onClick={onArchiveToggle}
              title={project.isArchived ? "Unarchive" : "Archive"}
              className={`p-1.5 rounded-lg transition-all ${project.isArchived ? 'bg-amber-100 text-amber-600' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'}`}
            >
              <ArchiveIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="space-y-1.5">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Design</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-400" 
                style={{ width: `${(designCompleted / designTotal) * 100}%` }} 
              />
            </div>
            <span className="text-[8px] font-black text-slate-500">{designCompleted}/{designTotal}</span>
          </div>
        </div>
        <div className="space-y-1.5 relative">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
            Permit
            {isBlocked && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />}
          </p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${(permitCompleted / permitTotal) * 100}%` }} 
              />
            </div>
            <span className="text-[8px] font-black text-slate-500">{permitCompleted}/{permitTotal}</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Support</p>
          <div className="flex items-center gap-1">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: constTotal > 0 ? `${(constCompleted / constTotal) * 100}%` : '0%' }} 
              />
            </div>
            <span className="text-[8px] font-black text-slate-500">{constCompleted}/{constTotal}</span>
          </div>
        </div>
      </div>

      {isBlocked && (
        <div className="mb-5 p-3 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
          {activeBlockers.slice(0, 2).map((b, i) => (
            <div key={b.id || i} className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 flex-shrink-0 animate-pulse" />
              <div className="text-[9px] leading-tight">
                <span className="text-rose-700 font-medium truncate line-clamp-1">{b.description || 'Pending action'}</span>
              </div>
            </div>
          ))}
          {activeBlockers.length > 2 && <p className="text-[8px] font-black text-rose-400 uppercase">+{activeBlockers.length - 2} more blockers</p>}
        </div>
      )}

      <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
        <div className="flex-1 min-w-0">
          <p className="text-slate-400 font-black uppercase text-[8px] tracking-widest mb-0.5">Next Operation</p>
          <p className={`font-bold truncate ${activeOp?.isCompleted ? 'text-slate-300 line-through' : (isBlocked ? 'text-rose-700' : 'text-slate-700')}`}>
            {activeOp?.description || 'No active operations'}
          </p>
        </div>
        <div className="text-right ml-4 flex-shrink-0">
          <p className="text-slate-400 font-black uppercase text-[8px] tracking-widest mb-0.5">Owner</p>
          <p className={`font-black uppercase text-[10px] tracking-tighter ${activeOp?.isCompleted ? 'text-slate-300' : (isBlocked ? 'text-rose-600' : 'text-amber-600')}`}>
            {activeOp?.owner || '---'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
