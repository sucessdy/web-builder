import clsx from "clsx";
import type { EditorLayer, LayerType } from "../../../lib/page-model";
import { Icon, type IconName } from "../../icons/Icon";

export type LayerRow = { item: EditorLayer; depth: number };

type LayerTreeProps = {
  rows: LayerRow[];
  activePageName: string;
  selectedId: string;
  search: string;
  canEdit: boolean;
  iconFor: (type: LayerType) => IconName;
  onSearchChange: (search: string) => void;
  onAddSection: () => void;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
};

export function LayerTree({
  rows,
  activePageName,
  selectedId,
  search,
  canEdit,
  iconFor,
  onSearchChange,
  onAddSection,
  onSelect,
  onToggleVisibility,
  onReorder,
}: LayerTreeProps) {
  return (
    <>
      <div className="searchbox">
        <Icon name="search" size={15} />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Find a layer"
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="tree-heading">
        <span>{activePageName.toUpperCase()}</span>
        <button
          className="plain-icon"
          disabled={!canEdit}
          onClick={onAddSection}
        >
          <Icon name="plus" size={15} />
        </button>
      </div>
      <div className="layer-list">
        {rows.map(({ item, depth }) => (
          <button
            key={item.id}
            className={clsx("layer-row transition-colors", selectedId === item.id && "selected")}
            draggable={canEdit && depth === 0}
            onClick={() => onSelect(item.id)}
            style={{ paddingLeft: 8 + depth * 12 }}
            onDragStart={(event) =>
              event.dataTransfer.setData("text/layer-id", item.id)
            }
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (depth === 0)
                onReorder(event.dataTransfer.getData("text/layer-id"), item.id);
            }}
          >
            <span className="layer-caret">
              {item.type === "section" ? "⌄" : ""}
            </span>
            <Icon name={iconFor(item.type)} size={15} />
            <span className="layer-name">{item.name}</span>
            <span
              className={`layer-more ${!canEdit ? "is-disabled" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                if (canEdit) onToggleVisibility(item.id);
              }}
            >
              <Icon name={item.visible ? "eye" : "close"} size={14} />
            </span>
          </button>
        ))}
      </div>
      <div className="layer-tip">
        <span className="tip-icon">✦</span>
        <span>
          <b>Tip</b> · Drag layers to reorder your page.
        </span>
      </div>
    </>
  );
}
