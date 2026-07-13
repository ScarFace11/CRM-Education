import { useState } from "react";
import { 
  useListTasks, 
  useCreateTask, 
  useUpdateTask, 
  useDeleteTask,
  Task,
  useListContacts,
  useListDeals
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListTasksQueryKey } from "@workspace/api-client-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle,
  Clock,
  AlertCircle,
  MoreVertical, 
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  User as UserIcon,
  Briefcase as DealIcon
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
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";

export default function Tasks() {
  const [filter, setFilter] = useState<"all" | "completed" | "upcoming" | "overdue">("all");
  
  // Use list tasks without filter locally first to simplify
  const { data: allTasks, isLoading } = useListTasks();
  const { data: contacts } = useListContacts();
  const { data: deals } = useListDeals();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [contactId, setContactId] = useState<string>("none");
  const [dealId, setDealId] = useState<string>("none");

  const queryClient = useQueryClient();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Client-side filtering
  const tasks = allTasks?.filter(task => {
    if (filter === "completed") return task.completed;
    if (filter === "upcoming") return !task.completed && (!task.dueDate || !isPast(parseISO(task.dueDate)));
    if (filter === "overdue") return !task.completed && task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
    return true; // all
  });

  const handleToggleCompleted = (task: Task) => {
    updateTask.mutate({ id: task.id, data: { completed: !task.completed } }, {
      onSuccess: () => {
        queryClient.setQueryData(getListTasksQueryKey(), (old: Task[] | undefined) => 
          old?.map(t => t.id === task.id ? { ...t, completed: !task.completed } : t)
        );
      }
    });
  };

  const openCreateDialog = () => {
    setEditingTask(null);
    setTitle("");
    setDueDate(undefined);
    setContactId("none");
    setDealId("none");
    setIsDialogOpen(true);
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDueDate(task.dueDate ? parseISO(task.dueDate) : undefined);
    setContactId(task.contactId ? task.contactId.toString() : "none");
    setDealId(task.dealId ? task.dealId.toString() : "none");
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const data = {
      title,
      dueDate: dueDate ? dueDate.toISOString() : null,
      contactId: contactId !== "none" ? Number(contactId) : null,
      dealId: dealId !== "none" ? Number(dealId) : null,
    };

    if (editingTask) {
      updateTask.mutate({ id: editingTask.id, data }, {
        onSuccess: () => {
          toast.success("Task updated.");
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast.error("Failed to update task.")
      });
    } else {
      createTask.mutate({ data }, {
        onSuccess: () => {
          toast.success("Task created.");
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
          setIsDialogOpen(false);
        },
        onError: () => toast.error("Failed to create task.")
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteTask.mutate({ id }, {
      onSuccess: () => {
        toast.success("Task deleted.");
        queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
      }
    });
  };

  const getStatusColor = (task: Task) => {
    if (task.completed) return "text-muted-foreground";
    if (!task.dueDate) return "text-foreground";
    const date = parseISO(task.dueDate);
    if (isPast(date) && !isToday(date)) return "text-destructive font-medium";
    if (isToday(date)) return "text-amber-600 font-medium";
    return "text-foreground";
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight mb-2">Tasks</h1>
          <p className="text-muted-foreground">Keep track of your to-dos and follow-ups.</p>
        </div>
        <Button onClick={openCreateDialog} className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border overflow-x-auto w-full sm:w-auto">
            <button 
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", filter === "all" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setFilter("all")}
            >
              All Tasks
            </button>
            <button 
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", filter === "upcoming" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setFilter("upcoming")}
            >
              Upcoming
            </button>
            <button 
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", filter === "overdue" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setFilter("overdue")}
            >
              Overdue
            </button>
            <button 
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap", filter === "completed" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setFilter("completed")}
            >
              Completed
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 border border-border rounded-lg p-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : tasks?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <EmptyState 
                title="No tasks found" 
                description="You're all caught up! Enjoy your free time or add a new task."
                icon={CheckCircle2}
                action={<Button onClick={openCreateDialog} variant="outline" className="mt-4">Add Task</Button>}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {tasks?.map((task) => (
                <div 
                  key={task.id} 
                  className={cn(
                    "flex items-start sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all group",
                    task.completed ? "bg-muted/10 border-border opacity-60" : "bg-white border-border shadow-sm hover-elevate"
                  )}
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <button 
                      onClick={() => handleToggleCompleted(task)}
                      className={cn(
                        "mt-0.5 sm:mt-0 shrink-0 rounded-full transition-colors",
                        task.completed ? "text-primary" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      {task.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-medium text-[15px] truncate", 
                        getStatusColor(task),
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h4>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        {task.dueDate && (
                          <div className={cn("flex items-center gap-1 text-xs", 
                            !task.completed && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate)) ? "text-destructive" : "text-muted-foreground"
                          )}>
                            <Clock className="w-3.5 h-3.5" />
                            {format(parseISO(task.dueDate), "MMM d, yyyy")}
                          </div>
                        )}
                        
                        {task.contactName && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-muted/50 border-border">
                            <UserIcon className="w-3 h-3 mr-1" />
                            {task.contactName}
                          </Badge>
                        )}
                        
                        {task.dealId && deals?.find(d => d.id === task.dealId) && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-muted/50 border-border">
                            <DealIcon className="w-3 h-3 mr-1" />
                            {deals.find(d => d.id === task.dealId)?.title}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(task)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task description</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Follow up on enrollment packet" 
                autoFocus
                required 
              />
            </div>
            
            <div className="space-y-2 flex flex-col">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal bg-white",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-border">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Related Family (Optional)</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a family" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {contacts?.map(contact => (
                    <SelectItem key={contact.id} value={contact.id.toString()}>{contact.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Related Deal (Optional)</Label>
              <Select value={dealId} onValueChange={setDealId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select a deal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {deals?.map(deal => (
                    <SelectItem key={deal.id} value={deal.id.toString()}>{deal.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!title.trim() || createTask.isPending || updateTask.isPending}>
                {editingTask ? "Save Changes" : "Create Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
