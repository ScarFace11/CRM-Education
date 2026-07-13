import { useState } from "react";
import { 
  useListContacts, 
  useCreateContact, 
  useUpdateContact, 
  useDeleteContact,
  Contact
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getListContactsQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Mail, 
  Phone, 
  MoreVertical, 
  Trash2,
  Edit2,
  Users
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { EmptyState } from "@/components/ui/empty";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: contacts, isLoading } = useListContacts({ search: searchQuery });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const queryClient = useQueryClient();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      source: formData.get("source") as string,
      notes: formData.get("notes") as string,
    };

    createContact.mutate({ data }, {
      onSuccess: () => {
        toast.success("Family added successfully.");
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        setIsSheetOpen(false);
        setIsCreating(false);
      },
      onError: () => toast.error("Failed to add family.")
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedContact) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      source: formData.get("source") as string,
      notes: formData.get("notes") as string,
    };

    updateContact.mutate({ id: selectedContact.id, data }, {
      onSuccess: (updated) => {
        toast.success("Family updated successfully.");
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        setSelectedContact(updated);
        setIsEditing(false);
      },
      onError: () => toast.error("Failed to update family.")
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this family? This cannot be undone.")) return;
    
    deleteContact.mutate({ id }, {
      onSuccess: () => {
        toast.success("Family deleted.");
        queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        if (selectedContact?.id === id) {
          setIsSheetOpen(false);
        }
      },
      onError: () => toast.error("Failed to delete family.")
    });
  };

  const openCreateSheet = () => {
    setSelectedContact(null);
    setIsCreating(true);
    setIsEditing(false);
    setIsSheetOpen(true);
  };

  const openDetailSheet = (contact: Contact) => {
    setSelectedContact(contact);
    setIsCreating(false);
    setIsEditing(false);
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground tracking-tight mb-2">Families</h1>
          <p className="text-muted-foreground">Manage prospective and enrolled families.</p>
        </div>
        <Button onClick={openCreateSheet} className="rounded-full shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Family
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search families..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white border-border"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : contacts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <EmptyState 
                title="No families found" 
                description={searchQuery ? "Try adjusting your search query." : "Add your first family to get started."} 
                icon={Users}
                action={!searchQuery ? <Button onClick={openCreateSheet} variant="outline" className="mt-4">Add Family</Button> : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {contacts?.map((contact) => (
                <div 
                  key={contact.id} 
                  className="p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer transition-colors group"
                  onClick={() => openDetailSheet(contact)}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-serif font-semibold text-lg shrink-0 border border-primary/20">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{contact.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {contact.phone}
                          </span>
                        )}
                        {!contact.email && !contact.phone && (
                          <span>No contact info</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {contact.source && (
                      <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border">
                        {contact.source}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); setIsEditing(true); setIsSheetOpen(true); }}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6 border-b border-border pb-4">
            <SheetTitle className="font-serif text-2xl">
              {isCreating ? "New Family" : isEditing ? "Edit Family" : selectedContact?.name}
            </SheetTitle>
            {(isCreating || isEditing) && (
              <SheetDescription>
                {isCreating ? "Add a new family to your rolodex." : "Update the details for this family."}
              </SheetDescription>
            )}
          </SheetHeader>

          {isCreating || isEditing ? (
            <form id="contact-form" onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Family Name *</Label>
                <Input id="name" name="name" required defaultValue={selectedContact?.name} placeholder="e.g. Smith Family" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={selectedContact?.email || ""} placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" defaultValue={selectedContact?.phone || ""} placeholder="(555) 123-4567" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input id="source" name="source" defaultValue={selectedContact?.source || ""} placeholder="e.g. Referral, Website, Walk-in" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={5} defaultValue={selectedContact?.notes || ""} placeholder="Add any helpful context..." className="resize-none" />
              </div>

              <SheetFooter className="mt-8 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => isEditing ? setIsEditing(false) : setIsSheetOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createContact.isPending || updateContact.isPending}>
                  {isCreating ? "Add Family" : "Save Changes"}
                </Button>
              </SheetFooter>
            </form>
          ) : selectedContact ? (
            <div className="space-y-6">
              <div className="flex gap-2 mb-6">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(selectedContact.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact Info</h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-3 border border-border">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-sm">{selectedContact.email || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-sm">{selectedContact.phone || "—"}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Source</h4>
                  <div className="bg-muted/30 rounded-lg p-3 border border-border text-sm">
                    {selectedContact.source || "—"}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Notes</h4>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border text-sm min-h-[100px] whitespace-pre-wrap">
                    {selectedContact.notes || <span className="text-muted-foreground italic">No notes added yet.</span>}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground pt-4 border-t border-border flex justify-between">
                  <span>Added {format(new Date(selectedContact.createdAt), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
