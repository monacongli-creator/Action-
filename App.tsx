import React, { useState, useMemo, useEffect } from 'react';
import { 
  Project, 
  ViewType, 
  PrimaryStatus, 
  BlockerType, 
  BlockerOwner,
  ProjectHealth,
  ProjectType,
  NextActionOwner,
  ProjectOperation,
  DisplayMode,
  TaskLayout
} from './types';
import { INITIAL_PROJECTS, STATUS_COLORS, HEALTH_COLORS } from './constants';
import { PlusIcon, SearchIcon, LayoutGridIcon, ListIcon, ActionLogo, FilterIcon, CheckCircleIcon } from './components/Icons';
import ProjectCard from './components/ProjectCard';
import ProjectForm from './components/ProjectForm';

type SortOrder = 'newest' | 'oldest';

// Custom Exclamation Icon for status - Compact, minimalist, no frame, lights up on hover
const StatusActionIcon = ({ active = false }) => (
  <div className="w-8 h-8 flex items-center justify-center transition-all duration-300 flex-shrink-0">
    <svg 
      className={`transition-all duration-500 transform 
        ${active 
          ? 'text-slate-200 group-hover:text-amber-500 group-hover:scale-110 group-hover:drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
          : 'text-slate-100 opacity-20'
        }`} 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 5V14" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      <path d="M12 19H12.01" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  </div>
);

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('action_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  
  const [activeView, setActiveView] = useState<ViewType>('EiDaily');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [taskLayout, setTaskLayout] = useState<TaskLayout>('expanded'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('oldest');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>(undefined);
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    localStorage.setItem('action_projects', JSON.stringify(projects));
  }, [projects]);

  const cities = useMemo(() => {
    const set = new Set(projects.map(p => p.city).filter(Boolean));
    return Array.from(set).sort();
  }, [projects]);

  const owners = useMemo(() => {
    const set = new Set(projects.map(p => p.clientName).filter(Boolean));
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let result = projects.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        p.name.toLowerCase().includes(q) || 
        p.clientName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.clientPhone && p.clientPhone.toLowerCase().includes(q)) ||
        (p.clientEmail && p.clientEmail.toLowerCase().includes(q)) ||
        (p.clientAddress && p.clientAddress.toLowerCase().includes(q));
      
      if (!matchesSearch) return false;

      if (cityFilter !== 'all' && p.city !== cityFilter) return false;
      if (ownerFilter !== 'all' && p.clientName !== ownerFilter) return false;
      if (healthFilter !== 'all' && p.health !== healthFilter) return false;

      const allBlockers = (p.permitTracks || []).flatMap(t => t.blockers || []);
      const hasAnyBlocker = allBlockers.some(b => b.type !== BlockerType.None);
      
      const isWaitingOnCity = allBlockers.some(b => b.owner === BlockerOwner.City) ||
                              p.status === PrimaryStatus.P3 ||
                              p.status === PrimaryStatus.P4 ||
                              p.status === PrimaryStatus.P5;

      switch (activeView) {
        case 'EiDaily':
          return !p.isArchived && p.status !== PrimaryStatus.P7;
        case 'Completed':
          return !p.isArchived && p.status === PrimaryStatus.P7;
        case 'Blocked':
          return !p.isArchived && hasAnyBlocker;
        case 'City':
          return !p.isArchived && isWaitingOnCity;
        case 'DesignActive':
          return !p.isArchived && p.status === PrimaryStatus.P2;
        case 'Construction':
          return !p.isArchived && p.status === PrimaryStatus.P6;
        case 'Archived':
          return p.isArchived;
        case 'All':
        default:
          return true;
      }
    });

    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [projects, activeView, searchQuery, cityFilter, ownerFilter, healthFilter, sortOrder]);

  const allOperations = useMemo(() => {
    const ops: Array<{ project: Project, op: ProjectOperation }> = [];
    filteredProjects.forEach(p => {
      (p.operations || []).forEach(op => {
        ops.push({ project: p, op });
      });
    });
    return ops.sort((a, b) => new Date(b.op.date).getTime() - new Date(a.op.date).getTime());
  }, [filteredProjects]);

  const handleSaveProject = (data: Partial<Project>) => {
    if (editingProject) {
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...data } as Project : p));
    } else {
      const newProject: Project = {
        ...data,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        isArchived: false
      } as Project;
      setProjects(prev => [newProject, ...prev]);
    }
    setIsFormOpen(false);
    setEditingProject(undefined);
  };

  const handleBulkUpload = () => {
    const names = bulkInput.split('\n').map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return;

    const newProjects: Project[] = names.map(name => {
      const defaultOp: ProjectOperation = {
        id: Math.random().toString(36).substr(2, 9),
        description: 'New workspace initialization and onboarding',
        owner: NextActionOwner.Internal,
        isCompleted: false,
        date: new Date().toISOString().split('T')[0]
      };

      return {
        id: Math.random().toString(36).substr(2, 9),
        name,
        city: '---',
        type: ProjectType.SingleFamily,
        clientName: 'Bulk Lead',
        clientPhone: '',
        clientEmail: '',
        clientAddress: '',
        projectManager: 'Internal',
        status: PrimaryStatus.P0,
        health: ProjectHealth.Green,
        operations: [defaultOp],
        permitTracks: [{ id: Math.random().toString(36).substr(2, 9), name: 'Planning Permit', blockers: [] }],
        designChecklist: { conceptApproved: false, zoningConfirmed: false, plans60Complete: false, plans90Complete: false, internalQA: false, clientSignOff: false },
        permittingChecklist: { initialSubmittal: false, firstPlanCheck: false, correctionsResubmitted: false, planCheck2Received: false, corrections2Submitted: false, permitIssued: false },
        constructionChecklist: { permitSetReleased: false, submittalsReviewed: false, rfisResponded: false, designChangesEvaluated: false, inspectionSupportCompleted: false },
        createdAt: new Date().toISOString(),
        isArchived: false
      };
    });

    setProjects(prev => [...newProjects, ...prev]);
    setBulkInput('');
    setIsUploadOpen(false);
  };

  const handleArchiveToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isArchived: !p.isArchived } : p));
  };

  const stats = useMemo(() => {
    const nonArchived = projects.filter(p => !p.isArchived);
    return {
      total: projects.length,
      active: nonArchived.filter(p => p.status !== PrimaryStatus.P7).length,
      blocked: nonArchived.filter(p => (p.permitTracks || []).flatMap(t => t.blockers || []).some(b => b.type !== BlockerType.None)).length,
      waitingCity: nonArchived.filter(p => 
        (p.permitTracks || []).flatMap(t => t.blockers || []).some(b => b.owner === BlockerOwner.City) ||
        p.status === PrimaryStatus.P3 ||
        p.status === PrimaryStatus.P4 ||
        p.status === PrimaryStatus.P5
      ).length,
      construction: nonArchived.filter(p => p.status === PrimaryStatus.P6).length,
      archived: projects.filter(p => p.isArchived).length,
    };
  }, [projects]);

  const bulkProjectCount = useMemo(() => {
    return bulkInput.split('\n').map(n => n.trim()).filter(Boolean).length;
  }, [bulkInput]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Inter']">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <ActionLogo className="w-10 h-10" />
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Action!</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Studio Intelligence</p>
            </div>
          </div>

          <div className="flex flex-1 flex-col sm:flex-row items-center gap-3 lg:mx-8">
            <div className="w-full sm:max-w-xs relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <SearchIcon />
              </div>
              <input 
                type="text" 
                placeholder="Search projects or tasks..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <select 
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="bg-slate-100 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer hover:bg-slate-200 transition-all min-w-[140px]"
              >
                <option value="all">Cities: All</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setDisplayMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${displayMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGridIcon />
                </button>
                <button 
                  onClick={() => setDisplayMode('tasks')}
                  className={`p-1.5 rounded-lg transition-all ${displayMode === 'tasks' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Task List"
                >
                  <ListIcon />
                </button>
              </div>

              {displayMode === 'tasks' && (
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setTaskLayout('expanded')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${taskLayout === 'expanded' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Expanded
                  </button>
                  <button 
                    onClick={() => setTaskLayout('compact')}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${taskLayout === 'compact' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    List
                  </button>
                </div>
              )}

              <button 
                onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                className="flex items-center gap-2 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-200 transition-all whitespace-nowrap"
              >
                {sortOrder === 'newest' ? '↓ Newest' : '↑ Oldest'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsUploadOpen(true)}
              className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-slate-200 active:scale-95 whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Upload</span>
            </button>
            <button 
              onClick={() => { setEditingProject(undefined); setIsFormOpen(true); }}
              className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-100 active:scale-95 whitespace-nowrap"
            >
              <PlusIcon />
              <span>Launch Action</span>
            </button>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 overflow-x-auto">
          <nav className="flex items-center gap-8 border-t border-slate-100/50">
            {[
              { id: 'EiDaily', label: 'Action Daily', count: stats.active },
              { id: 'Blocked', label: 'Blocked', count: stats.blocked },
              { id: 'DesignActive', label: 'Design Phase', count: projects.filter(p => !p.isArchived && p.status === PrimaryStatus.P2).length },
              { id: 'City', label: 'Agency Review', count: stats.waitingCity },
              { id: 'Construction', label: 'Field Support', count: stats.construction },
              { id: 'Completed', label: 'Completed', count: projects.filter(p => !p.isArchived && p.status === PrimaryStatus.P7).length },
              { id: 'Archived', label: 'Archive', count: stats.archived },
              { id: 'All', label: 'All Projects', count: stats.total }
            ].map(view => (
              <button 
                key={view.id}
                onClick={() => setActiveView(view.id as any)}
                className={`py-4 px-1 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap relative ${activeView === view.id ? 'text-slate-900 border-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                {view.label}
                {view.count > 0 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] ${activeView === view.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {view.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] mx-auto w-full p-6 pb-20">
        {displayMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => { setEditingProject(project); setIsFormOpen(true); }}
                onArchiveToggle={(e) => handleArchiveToggle(project.id, e)}
              />
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1550px] mx-auto space-y-4">
            {allOperations.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-slate-300 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <ListIcon />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">No strategic operations found in this filter.</p>
              </div>
            ) : (
              <div className={`${taskLayout === 'expanded' ? 'space-y-4' : 'space-y-2'}`}>
                {allOperations.map(({ project, op }) => {
                  const linkedBlocker = op.linkedBlockerId ? project.permitTracks
                    .flatMap(t => t.blockers)
                    .find(b => b.id === op.linkedBlockerId) : null;
                  
                  const blockerType = linkedBlocker?.type;

                  // Progress Calculations
                  const designKeys = Object.values(project.designChecklist);
                  const designCompleted = designKeys.filter(Boolean).length;
                  const designTotal = designKeys.length;

                  const permitKeys = Object.values(project.permittingChecklist);
                  const permitCompleted = permitKeys.filter(Boolean).length;
                  const permitTotal = permitKeys.length;

                  const constKeys = Object.values(project.constructionChecklist || {});
                  const constCompleted = constKeys.filter(Boolean).length;
                  const constTotal = constKeys.length;

                  if (taskLayout === 'compact') {
                    return (
                      <div 
                        key={`${project.id}-${op.id}`}
                        onClick={() => { setEditingProject(project); setIsFormOpen(true); }}
                        className={`flex items-center gap-5 p-3 px-6 rounded-2xl border cursor-pointer transition-all duration-300 group ${op.isCompleted ? 'bg-slate-50/50 opacity-50 grayscale border-slate-100' : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-100/30'}`}
                      >
                        {/* Custom Status Exclamation Icon */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <StatusActionIcon active={!op.isCompleted} />
                          <span className={`w-2.5 h-2.5 rounded-full ${HEALTH_COLORS[project.health]}`} />
                        </div>

                        {/* Project Identity Column */}
                        <div className="w-[280px] flex-shrink-0 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-black text-slate-900 text-sm group-hover:text-amber-600 truncate transition-colors leading-none tracking-tight">
                              {project.name}
                            </h3>
                            <span className={`px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border whitespace-nowrap ${STATUS_COLORS[project.status]}`}>
                              {project.status.split(' – ')[0]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                            <span>{project.city}</span>
                            <span className="opacity-30">•</span>
                            <span className="truncate">{project.clientName}</span>
                          </div>
                        </div>

                        {/* Micro Progress Section */}
                        <div className="hidden lg:flex items-center gap-6 flex-shrink-0 w-[300px]">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400" style={{ width: `${(designCompleted / designTotal) * 100}%` }} />
                              </div>
                              <span className="text-[8px] font-black text-slate-400 tabular-nums">{designCompleted}/{designTotal}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(permitCompleted / permitTotal) * 100}%` }} />
                              </div>
                              <span className="text-[8px] font-black text-slate-400 tabular-nums">{permitCompleted}/{permitTotal}</span>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <div className="flex-1 h-1 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: constTotal > 0 ? `${(constCompleted / constTotal) * 100}%` : '0%' }} />
                              </div>
                              <span className="text-[8px] font-black text-slate-400 tabular-nums">{constCompleted}/{constTotal}</span>
                            </div>
                          </div>
                        </div>

                        {/* Task Column */}
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                           <span className="bg-slate-50 text-slate-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest flex-shrink-0">Operation</span>
                           <p className={`text-sm font-bold text-slate-900 truncate tracking-tight leading-none ${op.isCompleted ? 'line-through text-slate-300' : 'group-hover:text-amber-600'}`}>
                             {op.description}
                           </p>
                        </div>

                        {/* Target & Lead */}
                        <div className="flex items-center gap-8 flex-shrink-0">
                           <div className="text-right">
                             <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Target</p>
                             <p className="text-[10px] font-black text-slate-600 uppercase tabular-nums">{op.date}</p>
                           </div>
                           <div className="text-right min-w-[70px]">
                              <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Lead</p>
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 ${
                                op.owner === NextActionOwner.City ? 'bg-amber-50 text-amber-700' : 
                                op.owner === NextActionOwner.Client ? 'bg-indigo-50 text-indigo-700' : 
                                'bg-slate-50 text-slate-700'
                              }`}>
                                {op.owner}
                              </span>
                           </div>
                           <div className="w-4 flex justify-end opacity-0 group-hover:opacity-100 transition-all">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                           </div>
                        </div>
                      </div>
                    );
                  }

                  // Compact Expanded View (Updated with new StatusIcon behavior)
                  return (
                    <div 
                      key={`${project.id}-${op.id}`}
                      onClick={() => { setEditingProject(project); setIsFormOpen(true); }}
                      className={`flex flex-col p-5 rounded-2xl border cursor-pointer transition-all duration-300 group relative ${op.isCompleted ? 'bg-slate-50 border-slate-100 opacity-60 grayscale' : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-100/20'}`}
                    >
                      {/* Top Branding Section (Smaller) */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          {/* Exclamation Status Icon */}
                          <StatusActionIcon active={!op.isCompleted} />
                          
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${HEALTH_COLORS[project.health]}`} />
                              <h3 className="font-black text-slate-900 text-lg group-hover:text-amber-600 transition-colors truncate tracking-tight leading-none">{project.name}</h3>
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border whitespace-nowrap ml-1 ${STATUS_COLORS[project.status]}`}>
                                {project.status.split(' – ')[0]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                              <span className="text-slate-500">{project.city}</span>
                              <span className="opacity-30">•</span>
                              <span className="truncate">{project.clientName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-200 group-hover:text-amber-300 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                          </div>
                        </div>
                      </div>

                      {/* Detail Section (Compact) */}
                      <div className="bg-slate-50/50 rounded-xl p-4 mb-4 border border-slate-50 group-hover:bg-white group-hover:border-amber-100/50 transition-all">
                        <div className="flex items-start gap-3">
                          {blockerType && (
                            <span className={`px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest flex-shrink-0 ${
                              blockerType.includes('City') ? 'bg-amber-100 text-amber-700' : 
                              blockerType.includes('Client') ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-900 text-white'
                            }`}>
                              {blockerType.split(' ')[0]} Required
                            </span>
                          )}
                          <p className={`text-base font-black tracking-tight leading-tight ${op.isCompleted ? 'text-slate-300 line-through' : 'text-slate-900 group-hover:text-slate-950'}`}>
                            {op.description}
                          </p>
                        </div>
                      </div>

                      {/* Footer Row (Optimized) */}
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        {/* Meta Data */}
                        <div className="flex items-center gap-8 flex-shrink-0 w-full md:w-auto">
                          <div className="space-y-0.5">
                             <p className="text-slate-400 font-black uppercase text-[8px] tracking-widest">Target</p>
                             <p className="text-sm font-black text-slate-700 tabular-nums tracking-tight">{op.date}</p>
                          </div>
                          <div className="space-y-0.5">
                             <p className="text-slate-400 font-black uppercase text-[8px] tracking-widest">Lead</p>
                             <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 ${
                               op.owner === NextActionOwner.City ? 'bg-amber-50 text-amber-700' : 
                               op.owner === NextActionOwner.Client ? 'bg-indigo-50 text-indigo-700' : 
                               'bg-slate-50 text-slate-700'
                             }`}>
                               {op.owner}
                             </span>
                          </div>
                        </div>

                        {/* Progress Bars (Miniature Grid) */}
                        <div className="grid grid-cols-3 gap-6 flex-1 w-full md:w-auto border-l border-slate-50 pl-6">
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Design</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-400" style={{ width: `${(designCompleted / designTotal) * 100}%` }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-500 tabular-nums">{designCompleted}/{designTotal}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Permit</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${(permitCompleted / permitTotal) * 100}%` }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-500 tabular-nums">{permitCompleted}/{permitTotal}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Support</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: constTotal > 0 ? `${(constCompleted / constTotal) * 100}%` : '0%' }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-500 tabular-nums">{constCompleted}/{constTotal}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Icon */}
                        <div className="hidden md:flex w-8 h-8 items-center justify-end opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {isFormOpen && (
        <ProjectForm 
          project={editingProject} 
          onSave={handleSaveProject} 
          onClose={() => { setIsFormOpen(false); setEditingProject(undefined); }} 
        />
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Project Deployment</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">Paste a list of project names (one per line) to generate multiple lead workspaces.</p>
              </div>
              {bulkProjectCount > 0 && (
                <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                  {bulkProjectCount} {bulkProjectCount === 1 ? 'Project' : 'Projects'} detected
                </div>
              )}
            </div>
            
            <textarea 
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder="e.g.&#10;01-11141 Limetree Dr&#10;02-1354 MorningSide Dr&#10;03-1048 Van Dyke"
              className="w-full h-64 bg-slate-50 border-none rounded-3xl p-6 text-sm font-bold focus:ring-2 focus:ring-amber-500 transition-all outline-none resize-none placeholder:text-slate-300 shadow-inner"
            />

            <div className="flex justify-end gap-4 pt-4">
              <button onClick={() => setIsUploadOpen(false)} className="px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Discard</button>
              <button 
                onClick={handleBulkUpload}
                disabled={!bulkInput.trim()}
                className="px-12 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed shadow-xl shadow-amber-900/10 active:scale-95 transition-all"
              >
                Batch Launch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;