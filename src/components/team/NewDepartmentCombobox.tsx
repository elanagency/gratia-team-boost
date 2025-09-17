import React, { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDepartmentManagement } from "@/hooks/useDepartmentManagement";

interface NewDepartmentComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const NewDepartmentCombobox = ({
  value,
  onChange,
  placeholder = "Select department..."
}: NewDepartmentComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const { departments, isLoading, createDepartment } = useDepartmentManagement();

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? "" : selectedValue);
    setOpen(false);
    setInputValue("");
  };

  const handleCreateDepartment = async () => {
    if (!inputValue.trim()) return;
    
    try {
      const newDepartment = await createDepartment.mutateAsync(inputValue.trim());
      onChange(newDepartment.name);
      setOpen(false);
      setInputValue("");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(inputValue.toLowerCase())
  );

  const exactMatch = filteredDepartments.find(
    dept => dept.name.toLowerCase() === inputValue.toLowerCase()
  );

  const showCreateOption = inputValue.trim() && !exactMatch;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or create department..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? "Loading departments..." : "No departments found."}
            </CommandEmpty>
            
            {filteredDepartments.length > 0 && (
              <CommandGroup heading="Existing Departments">
                {filteredDepartments.map((dept) => (
                  <CommandItem
                    key={dept.id}
                    value={dept.name}
                    onSelect={() => handleSelect(dept.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === dept.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {dept.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showCreateOption && (
              <CommandGroup heading="Create New">
                <CommandItem
                  onSelect={handleCreateDepartment}
                  className="text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create "{inputValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default NewDepartmentCombobox;