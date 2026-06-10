import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./search-input";

type DataTableToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  selectedCount?: number;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
};

export function DataTableToolbar({ searchValue, onSearchChange, placeholder = "Rechercher", selectedCount = 0, filters, actions }: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput className="w-full sm:max-w-xs" aria-label={placeholder} placeholder={placeholder} value={searchValue} onChange={(event) => onSearchChange(event.target.value)} />
        {filters ? (
          <Button type="button" variant="outline" className="justify-start">
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
          </Button>
        ) : null}
        {filters}
        {selectedCount > 0 ? <span className="text-sm text-muted-foreground">{selectedCount} selection</span> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
