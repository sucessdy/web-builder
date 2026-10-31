import type { WorkspaceMember } from "../auth/context/auth-context";
import type { ExportTarget } from "../../lib/code-export";
import { Icon } from "../icons/Icon";

type EditorDialogsProps = {
  aiOpen: boolean;
  aiPrompt: string;
  generating: boolean;
  notice: string;
  exportOpen: boolean;
  exportTarget: ExportTarget;
  membersOpen: boolean;
  members: WorkspaceMember[];
  memberEmail: string;
  memberRole: "editor" | "viewer";
  memberMessage: string;
  publishOpen: boolean;
  onAiClose: () => void;
  onAiPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onExportClose: () => void;
  onExportTargetChange: (target: ExportTarget) => void;
  onExport: () => void;
  onMembersClose: () => void;
  onMemberEmailChange: (email: string) => void;
  onMemberRoleChange: (role: "editor" | "viewer") => void;
  onSaveMember: () => void;
  onNoticeDismiss: () => void;
  onPublishClose: () => void;
};

export function EditorDialogs({
  aiOpen,
  aiPrompt,
  generating,
  notice,
  exportOpen,
  exportTarget,
  membersOpen,
  members,
  memberEmail,
  memberRole,
  memberMessage,
  publishOpen,
  onAiClose,
  onAiPromptChange,
  onGenerate,
  onExportClose,
  onExportTargetChange,
  onExport,
  onMembersClose,
  onMemberEmailChange,
  onMemberRoleChange,
  onSaveMember,
  onNoticeDismiss,
  onPublishClose,
}: EditorDialogsProps) {
  return (
    <>
      {aiOpen && (
        <div className="modal-backdrop" onClick={() => !generating && onAiClose()}>
          <section className="builder-modal ai-builder-modal" role="dialog" aria-modal="true" aria-labelledby="ai-builder-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close AI builder" disabled={generating} onClick={onAiClose}>
              <Icon name="close" size={17} />
            </button>
            <div className="modal-mark ai-modal-mark"><Icon name="sparkles" size={20} /></div>
            <h2 id="ai-builder-title">What should we build?</h2>
            <p>Describe the business, audience, and style. You can edit every layer after the first draft.</p>
            <label className="field-label ai-prompt-label">
              Website brief
              <textarea
                autoFocus
                rows={5}
                placeholder="A warm, modern website for a neighborhood coffee shop…"
                value={aiPrompt}
                onChange={(event) => onAiPromptChange(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") onGenerate();
                }}
              />
            </label>
            <div className="ai-connection-note">No AI provider is connected yet. This version creates an editable local draft; connect a server endpoint to use a language model.</div>
            {notice && <p className="ai-error" role="status">{notice}</p>}
            <button className="modal-primary ai-generate-button" disabled={!aiPrompt.trim() || generating} onClick={onGenerate}>
              <Icon name="sparkles" size={15} />
              {generating ? "Building your first draft…" : "Generate website"}
            </button>
          </section>
        </div>
      )}

      {exportOpen && (
        <div className="modal-backdrop" onClick={onExportClose}>
          <section className="builder-modal export-modal" role="dialog" aria-modal="true" aria-labelledby="export-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close export options" onClick={onExportClose}><Icon name="close" size={17} /></button>
            <div className="eyebrow-label">CODE EXPORT</div>
            <h2 id="export-title">Choose your React setup</h2>
            <p>Download a self-contained, typed page component with responsive base styles.</p>
            <div className="export-options">
              <button className={exportTarget === "react" ? "export-option selected" : "export-option"} onClick={() => onExportTargetChange("react")}>
                <b>React</b><span>src/Page.tsx</span>
              </button>
              <button className={exportTarget === "next" ? "export-option selected" : "export-option"} onClick={() => onExportTargetChange("next")}>
                <b>Next.js</b><span>app/page.tsx</span>
              </button>
            </div>
            <button className="modal-primary" onClick={onExport}><Icon name="download" size={15} /> Download page source</button>
          </section>
        </div>
      )}

      {membersOpen && (
        <div className="modal-backdrop" onClick={onMembersClose}>
          <section className="builder-modal members-modal" role="dialog" aria-modal="true" aria-labelledby="members-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close workspace access" onClick={onMembersClose}><Icon name="close" size={17} /></button>
            <div className="eyebrow-label">WORKSPACE</div>
            <h2 id="members-title">Manage access</h2>
            <p>People need an account before you can add them to this workspace.</p>
            <div className="member-list">
              {members.map((member) => (
                <div className="member-row" key={member.id}>
                  <span className="member-avatar">{(member.name?.[0] ?? member.email[0]).toUpperCase()}</span>
                  <span className="member-identity"><b>{member.name}</b><small>{member.email}</small></span>
                  <span className="member-role">{member.role}{member.pending ? " · invited" : ""}</span>
                </div>
              ))}
            </div>
            <div className="member-invite">
              <label className="field-label">Account email<input type="email" value={memberEmail} onChange={(event) => onMemberEmailChange(event.target.value)} placeholder="teammate@example.com" /></label>
              <label className="field-label">Permission<select value={memberRole} onChange={(event) => onMemberRoleChange(event.target.value as "editor" | "viewer")}><option value="editor">Editor · can change the page</option><option value="viewer">Viewer · read only</option></select></label>
              <button className="modal-primary" disabled={!memberEmail.trim()} onClick={onSaveMember}>Add or update access</button>
            </div>
            {memberMessage && <p className="member-message" role="status">{memberMessage}</p>}
          </section>
        </div>
      )}

      {notice && !aiOpen && (
        <div className="builder-toast" role="status">
          <span>{notice}</span><button aria-label="Dismiss message" onClick={onNoticeDismiss}><Icon name="close" size={14} /></button>
        </div>
      )}

      {publishOpen && (
        <div className="modal-backdrop" onClick={onPublishClose}>
          <div className="publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close publish dialog" onClick={onPublishClose}><Icon name="close" size={17} /></button>
            <div className="modal-mark"><Icon name="check" size={20} /></div>
            <h2 id="publish-title">Publishing is not configured</h2>
            <p>Connect a hosting provider to publish this page. You can export the page JSON or React source from the canvas toolbar.</p>
            <button className="modal-primary" onClick={onPublishClose}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
