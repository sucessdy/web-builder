
import { useState } from "react";
import clsx from "clsx";
import { Icon } from "../../icons/Icon";

export type EditorPageSummary = { id: string; name: string };

type PageListProps = {
  pages: EditorPageSummary[];
  activePageId: string;
  canEdit: boolean;
  onSwitchPage: (id: string) => void;
  onRenamePage: (id: string, name: string) => void;
  onDuplicatePage: (id: string) => void;
  onDeletePage: (id: string) => void;
};

export function PageList({
  pages,
  activePageId,
  canEdit,
  onSwitchPage,
  onRenamePage,
  onDuplicatePage,
  onDeletePage,
}: PageListProps) {
  const [openPageMenu, setOpenPageMenu] = useState<string | null>(null);

  return (
    <div className="page-list">
      {pages.map((page) => (
        <div className="page-entry" key={page.id}>
          <button
            className={clsx("page-row transition-colors duration-150", page.id === activePageId && "active")}
            onClick={() => { setOpenPageMenu(null); onSwitchPage(page.id); }}
            title={page.name}
          >
            <span className="page-glyph">{page.id === "home-page" ? "⌂" : "▤"}</span>
            <span className="page-row-name">{page.name}</span>
          </button>
          <button
            className="page-menu-trigger"
            disabled={!canEdit}
            aria-label={`Actions for ${page.name}`}
            aria-haspopup="menu"
            aria-expanded={openPageMenu === page.id}
            onClick={() => setOpenPageMenu((current) => current === page.id ? null : page.id)}
          >
            <Icon name="more" size={16} />
          </button>
          {openPageMenu === page.id && (
              <div className="page-actions-menu origin-top-right animate-fade-in" role="menu">
              <button role="menuitem" onClick={() => {
                const name = window.prompt("Rename page", page.name);
                if (name) onRenamePage(page.id, name);
                setOpenPageMenu(null);
              }}>Rename</button>
              <button role="menuitem" onClick={() => {
                onDuplicatePage(page.id);
                setOpenPageMenu(null);
              }}>Duplicate</button>
              <button
                role="menuitem"
                className="page-delete-action"
                disabled={pages.length <= 1}
                title={pages.length <= 1 ? "Keep at least one page" : "Delete page"}
                onClick={() => {
                  if (window.confirm(`Delete “${page.name}”? This cannot be undone.`)) {
                    onDeletePage(page.id);
                  }
                  setOpenPageMenu(null);
                }}
              >Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
