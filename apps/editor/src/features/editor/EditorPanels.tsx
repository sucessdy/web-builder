import clsx from "clsx";
import type { AuthUser } from "../auth/context/auth-context";
import type { LayerType } from "../../lib/page-model";
import { Icon, type IconName } from "../icons/Icon";
import { InsertPanel } from "./InsertPanel";
import { EditorRail } from "./components/EditorRail";
import { LayerTree, type LayerRow } from "./components/LayerTree";
import { PageList } from "./components/PageList";
import { WorkspaceAccess } from "./components/WorkspaceAccess";
import type { LayoutId } from "./layouts/layout-registry";
import type { InsertPresetId } from "./insert-presets";

type IconComponent = typeof Icon;

type SidebarProps = {
  Icon: IconComponent;
  user: AuthUser;
  authEnabled: boolean;
  canEdit: boolean;
  canManageMembers: boolean;
  filteredItems: LayerRow[];
  pages: Array<{ id: string; name: string }>;
  activePageId: string;
  activePageName: string;
  selectedId: string;
  tab: "layers" | "blocks";
  search: string;
  iconFor: (type: LayerType) => IconName;
  onTabChange: (tab: "layers" | "blocks") => void;
  onLoadDemo: () => void;
  onCreatePage: () => void;
  onSwitchPage: (id: string) => void;
  onRenamePage: (id: string, name: string) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
  onSearchChange: (search: string) => void;
  onSelect: (id: string) => void;
  onAdd: (type: LayerType) => void;
  onAddInsertPreset: (preset: InsertPresetId) => void;
  onAddLayout: (layout: LayoutId) => void;
  onAssetSelect: (file: File) => void;
  onAiOpen: () => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (draggedId: string, targetId: string) => void;
  onSwitchWorkspace: (id: string) => void;
  onOpenMembers: () => void;
};

export function EditorSidebar({
  Icon,
  user,
  authEnabled,
  canEdit,
  canManageMembers,
  filteredItems,
  pages,
  activePageId,
  activePageName,
  selectedId,
  tab,
  search,
  iconFor,
  onTabChange,
  onLoadDemo,
  onCreatePage,
  onSwitchPage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
  onSearchChange,
  onSelect,
  onAdd,
  onAddInsertPreset,
  onAddLayout,
  onAssetSelect,
  onAiOpen,
  onToggleVisibility,
  onReorder,
  onSwitchWorkspace,
  onOpenMembers,
}: SidebarProps) {
  return (
    <>
      <EditorRail
        canEdit={canEdit}
        onInsertOpen={() => onTabChange("blocks")}
        onAiOpen={onAiOpen}
        onAssetSelect={onAssetSelect}
      />

      <aside className="left-panel flex min-h-0 w-61.5 flex-none flex-col border-r border-(--editor-border) bg-(--panel-bg) max-[1120px]:w-55.5 max-[820px]:w-47.5">
        <div className="panel-title-row flex items-center justify-between px-4 pb-3.5 pt-5.5">
          <div>
            <div className="eyebrow-label">WEBSITE</div>
            <h1>{tab === "blocks" ? "Insert" : <>Pages <span className="page-count">{pages.length}</span></>}</h1>
          </div>
          {tab === "layers" && <button className="small-icon-button grid size-6.75 place-items-center rounded-md border border-(--input-border)" title="Add page" disabled={!canEdit} onClick={onCreatePage}><Icon name="plus" size={17} /></button>}
        </div>
        {tab === "layers" && <PageList
          pages={pages}
          activePageId={activePageId}
          canEdit={canEdit}
          onSwitchPage={onSwitchPage}
          onRenamePage={onRenamePage}
          onDuplicatePage={onDuplicatePage}
          onDeletePage={onDeletePage}
        />}
        <div className="panel-tabs flex h-10.25 flex-none gap-3.75 border-y border-(--editor-border) px-2.75">
          <button className={clsx("relative flex items-center gap-1.5 border-0 bg-transparent px-1 text-[10px] font-semibold", tab === "layers" && "selected")} onClick={() => onTabChange("layers")}>
            <Icon name="layers" size={15} /> Layers
          </button>
          <button className={clsx("relative flex items-center gap-1.5 border-0 bg-transparent px-1 text-[10px] font-semibold", tab === "blocks" && "selected")} onClick={() => onTabChange("blocks")}>
            <Icon name="grid" size={15} /> Blocks
          </button>
        </div>
        {tab === "layers" ? (
            <LayerTree
              rows={filteredItems}
              activePageName={activePageName}
              selectedId={selectedId}
              search={search}
              canEdit={canEdit}
              iconFor={iconFor}
              onSearchChange={onSearchChange}
              onAddSection={() => onAdd("section")}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onReorder={onReorder}
            />
        ) : (
          <InsertPanel
            canEdit={canEdit}
            search={search}
            onSearchChange={onSearchChange}
            onLoadDemo={onLoadDemo}
            onAdd={onAdd}
            onAddInsertPreset={onAddInsertPreset}
            onAddLayout={onAddLayout}
          />
        )}
        <WorkspaceAccess
          user={user}
          authEnabled={authEnabled}
          canManageMembers={canManageMembers}
          onSwitchWorkspace={onSwitchWorkspace}
          onOpenMembers={onOpenMembers}
        />
      </aside>
    </>
  );
}
