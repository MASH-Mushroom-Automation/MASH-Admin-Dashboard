import React from "react";
import { Archive } from "lucide-react";

interface Props {
  selectedCount: number;
  onClear?: () => void;
  onArchive?: () => void;
}

export const SelectionBar: React.FC<Props> = ({ selectedCount, onClear, onArchive }) => {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-green-50 p-3 border-b border-green-100">
      <div className="flex items-center gap-3">
        <div className="text-sm font-semibold">{selectedCount} selected</div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="text-sm text-muted-foreground underline"
          onClick={onClear}
          title="Clear selection"
        >
          Clear
        </button>

        <button
          onClick={onArchive}
          title="Archive selected"
          className="h-8 w-8 inline-flex items-center justify-center rounded bg-transparent text-destructive transition-colors duration-150 ease-in-out hover:bg-destructive/10"
        >
          <Archive className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default SelectionBar;
