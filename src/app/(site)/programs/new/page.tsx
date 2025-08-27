"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { RecentWork } from "@/components/widgets/RecentWork";
import { TimeManagement } from "@/components/widgets/TimeManagement";
import { UpcomingDeadlines } from "@/components/widgets/UpcomingDeadlines";
import { motion } from "framer-motion";
import { Calendar, FileText, Upload, X, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";

interface Ward {
  id: string;
  code: string;
  name: string;
}

interface FiscalYear {
  id: string;
  year: string;
  isActive: boolean;
}

interface ProgramType {
  id: string;
  name: string;
  code: string;
}

interface FundingSource {
  id: string;
  name: string;
  code: string;
}

export default function CreateProgramPage() {
  const router = useRouter();
  const today = new Date();
  const year = today.getFullYear();
  const [programId, setProgramId] = useState<string>("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wards, setWards] = useState<Ward[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate program ID only on client side to prevent hydration mismatch
  useEffect(() => {
    const generatedId = `PRG-${year}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, "0")}`;
    setProgramId(generatedId);
  }, [year]);

  const [form, setForm] = useState({
    code: "",
    name: "",
    fiscalYearId: "",
    wardId: "",
    programTypeId: "",
    budget: "",
    fundingSourceId: "",
    description: "",
    startDate: "",
    endDate: "",
    officer: "",
    tags: "",
  });

  // Update form code when programId is generated
  useEffect(() => {
    if (programId) {
      setForm(prev => ({ ...prev, code: programId }));
    }
  }, [programId]);

  type FileItem = { id: string; file: File };
  const [redBookFiles, setRedBookFiles] = useState<FileItem[]>([]);
  const [execFiles, setExecFiles] = useState<FileItem[]>([]);

  // Fetch all dynamic configuration data on component mount
  useEffect(() => {
    const fetchConfigData = async () => {
      try {
        // Fetch wards
        const wardsResponse = await fetch('/api/wards');
        if (wardsResponse.ok) {
          const data = await wardsResponse.json();
          setWards(data.wards || []);
        }
        
        // Fetch fiscal years
        const fiscalYearsResponse = await fetch('/api/fiscyears');
        if (fiscalYearsResponse.ok) {
          const data = await fiscalYearsResponse.json();
          setFiscalYears(data.fiscalYears || []);
          
          // Set active fiscal year as default if available
          const activeFiscalYear = data.fiscalYears?.find((fy: FiscalYear) => fy.isActive);
          if (activeFiscalYear) {
            setForm(prev => ({ ...prev, fiscalYearId: activeFiscalYear.id }));
          } else if (data.fiscalYears?.length > 0) {
            setForm(prev => ({ ...prev, fiscalYearId: data.fiscalYears[0].id }));
          }
        }
        
        // Fetch program types
        const programTypesResponse = await fetch('/api/programtypes');
        if (programTypesResponse.ok) {
          const data = await programTypesResponse.json();
          setProgramTypes(data.programTypes || []);
          
          // Set first program type as default if available
          if (data.programTypes?.length > 0) {
            setForm(prev => ({ ...prev, programTypeId: data.programTypes[0].id }));
          }
        }
        
        // Fetch funding sources
        const fundingSourcesResponse = await fetch('/api/fundsources');
        if (fundingSourcesResponse.ok) {
          const data = await fundingSourcesResponse.json();
          setFundingSources(data.fundingSources || []);
          
          // Set first funding source as default if available
          if (data.fundingSources?.length > 0) {
            setForm(prev => ({ ...prev, fundingSourceId: data.fundingSources[0].id }));
          }
        }
      } catch (error) {
        console.error('Error fetching configuration data:', error);
        setErrors(prev => ({ ...prev, general: "Failed to load configuration data" }));
      }
    };
    
    fetchConfigData();
  }, []);

  function handleChange<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  }

  function handleAddFiles(target: "red" | "exec", files: FileList | null) {
    if (!files) return;
    const items: FileItem[] = Array.from(files).map((f) => ({ id: `${target}-${f.name}-${f.size}-${f.lastModified}`, file: f }));
    if (target === "red") setRedBookFiles((p) => [...p, ...items]);
    if (target === "exec") setExecFiles((p) => [...p, ...items]);
  }

  function removeFile(target: "red" | "exec", id: string) {
    if (target === "red") setRedBookFiles((p) => p.filter((x) => x.id !== id));
    if (target === "exec") setExecFiles((p) => p.filter((x) => x.id !== id));
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = "Program name is required";
    if (!form.wardId) newErrors.wardId = "Ward is required";
    if (!form.programTypeId) newErrors.programTypeId = "Program type is required";
    if (!form.fundingSourceId) newErrors.fundingSourceId = "Funding source is required";
    if (form.budget && isNaN(parseFloat(form.budget))) newErrors.budget = "Invalid budget amount";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Parse tags
      const tags = form.tags ? form.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      const programData = {
        code: form.code,
        name: form.name.trim(),
        fiscalYearId: form.fiscalYearId,
        wardId: form.wardId,
        budget: form.budget || undefined,
        fundingSourceId: form.fundingSourceId,
        programTypeId: form.programTypeId,
        description: form.description.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        tags,
        responsibleOfficer: form.officer.trim() || undefined,
      };

      const response = await fetch('/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Program created:', result);
        
        // Redirect to programs list
        router.push('/programs');
      } else {
        const errorData = await response.json();
        console.error('Error creating program:', errorData);
        
        if (errorData.error === "Program code already exists") {
          setErrors({ code: "Program code already exists" });
        } else if (errorData.error === "Ward not found") {
          setErrors({ wardId: "Selected ward not found" });
        } else {
          setErrors({ general: errorData.error || "Failed to create program" });
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell rightRail={<><RecentWork /><TimeManagement /><UpcomingDeadlines /></>}>
      <Card>
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <div className="text-lg font-semibold">Create New Program</div>
            <div className="text-xs text-gray-500">Fill in details from Red Book or Executive decisions.</div>
          </div>
          <div className="text-xs text-gray-500">Program Code</div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm">
            <span className="text-gray-500">Auto-generated:</span> 
            <span className="font-medium ml-1">
              {programId ? programId : "Generating..."}
            </span>
          </div>
          <Link href="/programs" className="text-sm text-gray-600 hover:underline">Cancel / Back to List</Link>
        </div>
      </Card>

      {errors.general && (
        <Card>
          <div className="p-4 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg">
            {errors.general}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        {/* Left: Program Info */}
        <Card>
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Program ID</label>
              <input 
                value={form.code} 
                onChange={(e) => handleChange("code", e.target.value)} 
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${errors.code ? 'border-rose-300' : ''}`} 
                placeholder={programId ? programId : "Generating program ID..."}
                disabled={!programId}
              />
              {errors.code && <div className="text-xs text-rose-600 mt-1">{errors.code}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Program Name *</label>
              <input 
                value={form.name} 
                onChange={(e) => handleChange("name", e.target.value)} 
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${errors.name ? 'border-rose-300' : ''}`} 
                placeholder="e.g., Road Maintenance - Ward 12" 
              />
              {errors.name && <div className="text-xs text-rose-600 mt-1">{errors.name}</div>}
            </div>
            <div>
              <label className="text-xs text-gray-600">Fiscal Year</label>
              <div className="relative mt-1">
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select 
                  value={form.fiscalYearId} 
                  onChange={(e) => handleChange("fiscalYearId", e.target.value)} 
                  className="w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  {fiscalYears.length === 0 ? (
                    <option value="">Loading fiscal years...</option>
                  ) : (
                    fiscalYears.map((fy) => (
                      <option key={fy.id} value={fy.id}>
                        {fy.year} {fy.isActive ? "(Active)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-600">Ward *</label>
              <div className="relative mt-1">
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select 
                  value={form.wardId} 
                  onChange={(e) => handleChange("wardId", e.target.value)} 
                  className={`w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm ${errors.wardId ? 'border-rose-300' : ''}`}
                >
                  <option value="">Select Ward</option>
                  {wards.length === 0 ? (
                    <option value="" disabled>Loading wards...</option>
                  ) : (
                    wards.map((ward) => (
                      <option key={ward.id} value={ward.id}>
                        Ward {ward.code} - {ward.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {errors.wardId && <div className="text-xs text-rose-600 mt-1">{errors.wardId}</div>}
            </div>
            <div>
              <label className="text-xs text-gray-600">Program Type *</label>
              <div className="relative mt-1">
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select 
                  value={form.programTypeId} 
                  onChange={(e) => handleChange("programTypeId", e.target.value)} 
                  className={`w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm ${errors.programTypeId ? 'border-rose-300' : ''}`}
                >
                  <option value="">Select Program Type</option>
                  {programTypes.length === 0 ? (
                    <option value="" disabled>Loading program types...</option>
                  ) : (
                    programTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {errors.programTypeId && <div className="text-xs text-rose-600 mt-1">{errors.programTypeId}</div>}
            </div>
            <div>
              <label className="text-xs text-gray-600">Budget Amount</label>
              <input 
                value={form.budget} 
                onChange={(e) => handleChange("budget", e.target.value)} 
                className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm ${errors.budget ? 'border-rose-300' : ''}`} 
                placeholder="e.g., 1000000" 
              />
              {errors.budget && <div className="text-xs text-rose-600 mt-1">{errors.budget}</div>}
            </div>
            <div>
              <label className="text-xs text-gray-600">Funding Source *</label>
              <div className="relative mt-1">
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select 
                  value={form.fundingSourceId} 
                  onChange={(e) => handleChange("fundingSourceId", e.target.value)} 
                  className={`w-full appearance-none rounded-xl border bg-white px-3 py-2 text-sm ${errors.fundingSourceId ? 'border-rose-300' : ''}`}
                >
                  <option value="">Select Funding Source</option>
                  {fundingSources.length === 0 ? (
                    <option value="" disabled>Loading funding sources...</option>
                  ) : (
                    fundingSources.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {errors.fundingSourceId && <div className="text-xs text-rose-600 mt-1">{errors.fundingSourceId}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-600">Description</label>
              <textarea 
                value={form.description} 
                onChange={(e) => handleChange("description", e.target.value)} 
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" 
                rows={4} 
                placeholder="Brief summary and objectives" 
              />
            </div>
          </div>
        </Card>

        {/* Right: Uploads + Controls */}
        <div className="space-y-4">
          <Card>
            <div className="border-b p-4 text-sm font-medium">File Uploads</div>
            <div className="space-y-4 p-4">
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Red Book Scan / Document (PDF)</div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" /> Upload files
                  <input multiple accept="application/pdf" type="file" className="hidden" onChange={(e) => handleAddFiles("red", e.target.files)} />
                </label>
                <div className="mt-2 space-y-2">
                  {redBookFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> {f.file.name}</div>
                      <button onClick={() => removeFile("red", f.id)} className="text-xs text-rose-600 hover:underline"><X className="mr-1 inline h-3 w-3" /> Remove</button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-gray-500">Executive Approval Document (PDF)</div>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-sm hover:bg-gray-50">
                  <Upload className="h-4 w-4" /> Upload files
                  <input multiple accept="application/pdf" type="file" className="hidden" onChange={(e) => handleAddFiles("exec", e.target.files)} />
                </label>
                <div className="mt-2 space-y-2">
                  {execFiles.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                      <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-500" /> {f.file.name}</div>
                      <button onClick={() => removeFile("exec", f.id)} className="text-xs text-rose-600 hover:underline"><X className="mr-1 inline h-3 w-3" /> Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="border-b p-4 text-sm font-medium">Metadata / Controls</div>
            <div className="grid grid-cols-1 gap-4 p-4">
              <div>
                <label className="text-xs text-gray-600">Category Tags</label>
                <input 
                  value={form.tags} 
                  onChange={(e) => handleChange("tags", e.target.value)} 
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" 
                  placeholder="e.g., road, maintenance" 
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs text-gray-600">Start Date</label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      value={form.startDate} 
                      onChange={(e) => handleChange("startDate", e.target.value)} 
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600">End Date</label>
                  <div className="relative mt-1">
                    <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="date" 
                      value={form.endDate} 
                      onChange={(e) => handleChange("endDate", e.target.value)} 
                      className="w-full rounded-xl border bg-white px-3 py-2 text-sm" 
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600">Responsible Officer</label>
                <select 
                  value={form.officer} 
                  onChange={(e) => handleChange("officer", e.target.value)} 
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="">Select officer...</option>
                  <option>Planning Officer</option>
                  <option>CAO</option>
                  <option>Executive Officer</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <motion.button 
                  whileHover={{ y: -2 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                  Save Draft
                </motion.button>
                <motion.button 
                  whileHover={{ y: -2 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting}
                  className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> : null}
                  Submit for Approval
                </motion.button>
                <Link href="/programs" className="text-sm text-gray-600 hover:underline">Cancel / Back to List</Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* History side panel */}
      <Card>
        <div className="p-4">
          <div className="mb-1 text-sm font-medium">History</div>
          <div className="rounded-xl border bg-gray-50 p-8 text-center text-xs text-gray-500">Empty until saved</div>
        </div>
      </Card>
    </Shell>
  );
}

