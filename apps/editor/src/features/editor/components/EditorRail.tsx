import { useRef } from "react";
import { Icon } from "../../icons/Icon";

type EditorRailProps = {
  canEdit: boolean;
  onInsertOpen: () => void;
  onAiOpen: () => void;
  onAssetSelect: (file: File) => void;
};

export function EditorRail({ canEdit, onInsertOpen, onAiOpen, onAssetSelect }: EditorRailProps) {
  const assetInput = useRef<HTMLInputElement>(null);

  return (
    <aside className="left-rail z-2 flex w-13.25 flex-none flex-col items-center gap-1.75 border-r border-(--editor-border) bg-(--panel-bg) py-3">
      <button className="grid size-8.5 place-items-center rounded-lg border-0 bg-(--selection-bg) text-(--brand-color) transition-colors" title="Builder">
        <Icon name="grid" />
      </button>
      <button className="grid size-8.5 place-items-center rounded-lg border-0 bg-transparent text-(--text-muted) transition-colors hover:bg-(--tool-hover) hover:text-(--brand-color)" title="Insert" onClick={onInsertOpen}>
        <Icon name="plus" />
      </button>
      <button className="grid size-8.5 place-items-center rounded-lg border-0 bg-(--selection-bg) text-(--brand-color) transition-colors hover:bg-(--tool-hover) disabled:cursor-not-allowed disabled:opacity-50" title="Generate a website with AI" disabled={!canEdit} onClick={onAiOpen}>
        <Icon name="sparkles" />
      </button>
      <button className="grid size-8.5 place-items-center rounded-lg border-0 bg-transparent text-(--text-muted) transition-colors hover:bg-(--tool-hover) hover:text-(--brand-color) disabled:cursor-not-allowed disabled:opacity-50" title="Add an image asset" disabled={!canEdit} onClick={() => assetInput.current?.click()}>
        <Icon name="image" />
      </button>
      <input
        ref={assetInput}
        hidden
        type="file"
        accept="image/*"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onAssetSelect(file);
          event.target.value = "";
        }}
      />
      <div className="rail-spacer flex-1" />
      <button className="grid size-8.5 place-items-center rounded-lg border-0 bg-transparent text-(--text-muted) opacity-50" title="Settings are not available yet" disabled>
        <Icon name="settings" />
      </button>
      <div className="rail-avatar">M</div>
    </aside>
  );
}
