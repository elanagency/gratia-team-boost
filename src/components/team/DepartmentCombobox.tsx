import React from "react";
import { Check, ChevronsUpDown, Building2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useDepartments } from "@/hooks/useDepartments";

interface DepartmentComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DepartmentCombobox: React.FC<DepartmentComboboxProps> = ({ value, onChange, placeholder = "Select department (optional)" }) => {
  const { departments, isLoading } = useDepartments();
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const normalized = (s: string) => s.trim().toLowerCase();
  const hasExact = value ? departments.some((d) => normalized(d) === normalized(value)) : false;
  const showCreate = inputValue.length > 0 && !departments.some((d) => normalized(d) === normalized(inputValue));

  const displayLabel = value || placeholder;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setInputValue(""); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
       >
          <span className={cn(!value && "text-muted-foreground", "flex items-center gap-2")}
          >
            <Building2 className="h-4 w-4" />
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create department..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No department found.</CommandEmpty>
                <CommandGroup heading="Departments">
                  {departments
                    .filter((d) => normalized(d).includes(normalized(inputValue)))
                    .map((dep) => (
                      <CommandItem
                        key={dep}
                        value={dep}
                        onSelect={(currentValue) => {
                          onChange(currentValue);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            normalized(value) === normalized(dep) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span>{dep}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
                {showCreate && (
                  <CommandGroup>
                    <CommandItem
                      value={`__create__:${inputValue}`}
                      onSelect={() => {
                        onChange(inputValue);
                        setOpen(false);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create new "{inputValue}"
                    </CommandItem>
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default DepartmentCombobox;
