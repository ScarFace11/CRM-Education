import { useState } from "react";
import { 
  useListDeals, 
  useCreateDeal, 
  useUpdateDeal, 
  useDeleteDeal,
  useListPipelineStages,
  useCreatePipelineStage,
  useUpdatePipelineStage,
  useDeletePipelineStage,
  useListContacts,
  Deal,
  DealStatus,
  PipelineStage
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListDealsQueryKey, getListPipelineStagesQueryKey } from "@workspace/api-client-react";
import { 
  Plus, 
  MoreVertical, 
  Trash2,
  Edit2,
  DollarSign,
  GripHorizontal,
  Archive,
  CheckCircle2,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// A minimal drag-and-drop implementation without big libraries
export default function Deals() {
  const { data: deals, isLoading: loadingDeals } = useListDeals();
  const { data: stages, isLoading: loadingStages } = useListPipelineStages();
  const { data: contacts } = useListContacts();
  
  const queryClient = useQueryClient();
  const createDeal = useCreateDeal();
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState<string>("");
  const [contactId, setContactId] = useState<string>("");
  const [status, setStatus] = useState<DealStatus>("open");

  // Drag State
  const [draggedDealId, setDraggedDealId] = useState<number | null>(null);

  // Stages Settings State
  const [isStagesDialogOpen, setIsStagesDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageName, setStageName] = useState("");
  const [stageColor, setStageColor] = useState("#2D4A39");

  const createStage = useCreatePipelineStage();
  const updateStage = useUpdatePipelineStage();
  const deleteStage = useDeletePipelineStage();

  const handleStageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageName) return;

    if (editingStage) {
      updateStage.mutate({ 
        id: editingStage.id, 
        data: { name: stageName, color: stageColor } 
      }, {
        onSuccess: () => {
          toast.success("Stage updated.");
          queryClient.invalidateQueries({ queryKey: getListPipelineStagesQueryKey() });
          setEditingStage(null);
          setStageName("");
        }
      });
    } else {
      createStage.mutate({ 
        data: { name: stageName, color: stageColor, order: (stages?.length || 0) + 1 } 
      }, {
        onSuccess: () => {
          toast.success("Stage created.");
          queryClient.invalidateQueries({ queryKey: getListPipelineStagesQueryKey() });
          setStageName("");
        }
      });
    }
  };

  const openStagesDialog = () => {
    setIsStagesDialogOpen(true);
    setEditingStage(null);
    setStageName("");
    setStageColor("#2D4A39");
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedDealId(id);
    // Needed for Firefox
    e.dataTransfer.setData("text/plain", id.toString());
    e.dataTransfer.effectAllowed = "move";
    
    // Add visual feedback class to dragged element
    setTimeout(() => {
      const el = document.getElementById(`deal-${id}`);
      if (el) el.classList.add('opacity-50', 'scale-95');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent, id: number) => {
    const el = document.getElementById(`deal-${id}`);
    if (el) el.classList.remove('opacity-50', 'scale-95');
    setDraggedDealId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetStageId: number) => {
    e.preventDefault();
    if (!draggedDealId) return;

    const deal = deals?.find(d => d.id === draggedDealId);
    if (!deal || deal.stageId === targetStageId) return;

    // Optimistically update
    queryClient.setQueryData(getListDealsQueryKey(), (old: Deal[] | undefined) => 
      old?.map(d => d.id === draggedDealId ? { ...d, stageId: targetStageId } : d)
    );

    // Persist
    updateDeal.mutate({ id: draggedDealId, data: { stageId: targetStageId } }, {
      onError: () => {
        toast.error("Failed to move deal.");
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
      }
    });
  };

  const openCreateDialog = (initialStageId?: number) => {
    setEditingDeal(null);
    setTitle("");
    setValue("");
    setStageId(initialStageId ? initialStageId.toString() : (stages?.[0]?.id.toString() || ""));
    setContactId("");
    setStatus("open");
    setIsDialogOpen(true);
  };

  const openEditDialog = (deal: Deal) => {
    setEditingDeal(deal);
    setTitle(deal.title);
    setValue(deal.value.toString());
    setStageId(deal.stageId.toString());
    setContactId(deal.contactId.toString());
    setStatus(deal.status);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !value || !stageId || !contactId) return;

    const data = {
      title,
      value: Number(value),
      stageId: Number(stageId),
      contactId: Number(contactId),
      status,
    };

    if (editingDeal) {
      updateDeal.mutate({ id: editingDeal.id, data }, {
        onSuccess: () => {
          toast.success("Enrollment updated.");
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast.error("Failed to update.")
      });
    } else {
      createDeal.mutate({ data }, {
        onSuccess: () => {
          toast.success("Enrollment added to pipeline.");
          queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast.error("Failed to create.")
      });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this enrollment?")) return;
    deleteDeal.mutate({ id }, {
      onSuccess: () => {
        toast.success("Enrollment deleted.");
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
      }
    });
  };

  const markStatus = (id: number, newStatus: DealStatus) => {
    updateDeal.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast.success(`Enrollment marked as ${newStatus}.`);
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey() });
      }
    });
  };

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const getStageColor = (colorHex: string) => {
    return {
      backgroundColor: `${colorHex}15`,
      borderColor: `${colorHex}40`,
      color: colorHex
    };
  };

  if (loadingDeals || loadingStages) {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[300px] w-[300px] bg-card border border-border rounded-xl p-4 flex flex-col gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Group deals by stage
  const openDeals = deals?.filter(d => d.status === "open") || [];
  const dealsByStage = stages?.map(stage => {
    return {
      ...stage,
      deals: openDeals.filter(d => d.stageId === stage.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  }) || [];

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight mb-2">Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop enrollments through your process.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="shadow-sm" onClick={openStagesDialog}>
            <Settings2 className="w-4 h-4 mr-2" />
            Stages
          </Button>
          <Button onClick={() => openCreateDialog()} className="rounded-full shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Enrollment
          </Button>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 pt-2 flex-1 items-start hide-scrollbar">
        {dealsByStage.map((stage) => {
          const stageTotal = stage.deals.reduce((sum, d) => sum + d.value, 0);
          
          return (
            <div 
              key={stage.id} 
              className="min-w-[320px] w-[320px] shrink-0 flex flex-col max-h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div 
                className="mb-4 pb-2 border-b-2 flex items-center justify-between sticky top-0"
                style={{ borderBottomColor: stage.color }}
              >
                <div>
                  <h3 className="font-serif font-semibold text-lg flex items-center gap-2">
                    {stage.name}
                    <span className="bg-muted text-muted-foreground text-xs font-sans px-2 py-0.5 rounded-full font-medium border border-border">
                      {stage.deals.length}
                    </span>
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground mt-0.5">
                    {formatter.format(stageTotal)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openCreateDialog(stage.id)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Deals List */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1 min-h-[150px]">
                {stage.deals.length === 0 ? (
                  <div className="h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-sm text-muted-foreground bg-muted/10">
                    Drop here
                  </div>
                ) : (
                  stage.deals.map((deal) => (
                    <div 
                      key={deal.id}
                      id={`deal-${deal.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      onDragEnd={(e) => handleDragEnd(e, deal.id)}
                      className={cn(
                        "bg-white border border-border rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing hover-elevate transition-all group",
                        draggedDealId === deal.id ? "opacity-50" : ""
                      )}
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-medium text-[15px] leading-tight flex-1">{deal.title}</h4>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openEditDialog(deal)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markStatus(deal.id, "won")} className="text-emerald-600 focus:text-emerald-600">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Won
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markStatus(deal.id, "lost")} className="text-muted-foreground">
                              <Archive className="w-4 h-4 mr-2" /> Mark as Lost
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(deal.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">{formatter.format(deal.value)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-3 border-t border-border">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif text-[10px] font-bold border border-primary/20 shrink-0">
                          {deal.contactName?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <span className="text-xs text-muted-foreground truncate font-medium">
                          {deal.contactName || "No contact"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingDeal ? "Edit Enrollment" : "New Enrollment"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Opportunity Name</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Fall Enrollment - 2 Kids" 
                autoFocus
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value">Value ($)</Label>
              <Input 
                id="value" 
                type="number"
                min="0"
                step="1"
                value={value} 
                onChange={(e) => setValue(e.target.value)} 
                placeholder="e.g. 1500" 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label>Family / Contact</Label>
              <Select value={contactId} onValueChange={setContactId} required>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a family" />
                </SelectTrigger>
                <SelectContent>
                  {contacts?.map(contact => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>{contact.name}</SelectItem>
                  ))}
                  {contacts?.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">No families found. Add one first.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pipeline Stage</Label>
              <Select value={stageId} onValueChange={setStageId} required>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages?.map(stage => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingDeal && (
              <div className="space-y-2 pt-2 border-t border-border mt-4">
                <Label>Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as DealStatus)} required>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!title || !value || !stageId || !contactId || createDeal.isPending || updateDeal.isPending}>
                {editingDeal ? "Save Changes" : "Create Enrollment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStagesDialogOpen} onOpenChange={setIsStagesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Pipeline Stages</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {stages?.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: stage.color }} />
                    <span className="font-medium text-sm">{stage.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => {
                      setEditingStage(stage);
                      setStageName(stage.name);
                      setStageColor(stage.color);
                    }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => {
                      if(confirm("Delete this stage? All deals must be moved first.")) {
                        deleteStage.mutate({ id: stage.id }, {
                          onSuccess: () => {
                            toast.success("Stage deleted.");
                            queryClient.invalidateQueries({ queryKey: getListPipelineStagesQueryKey() });
                          },
                          onError: () => toast.error("Could not delete stage. Ensure it has no deals.")
                        });
                      }
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleStageSubmit} className="pt-4 border-t border-border flex items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label>{editingStage ? "Edit Stage" : "New Stage Name"}</Label>
                <Input 
                  value={stageName} 
                  onChange={(e) => setStageName(e.target.value)} 
                  placeholder="e.g. Trial Scheduled" 
                  required 
                />
              </div>
              <div className="space-y-2 w-[80px]">
                <Label>Color</Label>
                <Input 
                  type="color" 
                  value={stageColor} 
                  onChange={(e) => setStageColor(e.target.value)} 
                  className="p-1 h-9 cursor-pointer"
                />
              </div>
              <Button type="submit" disabled={!stageName || createStage.isPending || updateStage.isPending}>
                {editingStage ? "Save" : "Add"}
              </Button>
            </form>
            {editingStage && (
               <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => {
                 setEditingStage(null);
                 setStageName("");
               }}>
                 Cancel Edit
               </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
