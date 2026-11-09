import { EditorCanvasPanel, EditorHeader } from "./features/editor/EditorChrome";
import { EditorDialogs } from "./features/editor/EditorDialogs";
import { EditorSidebar, InspectorPanel } from "./features/editor/EditorPanels";
import { useEditorController } from "./features/editor/useEditorController";
import { Icon } from "./features/icons/Icon";
import { useThemeContext } from "./theme/ThemeProvider";
import "./App.css";

function App() {
  const editor = useEditorController();
  const { theme, toggleTheme } = useThemeContext();
  const {
    user,
    authEnabled,
    canEdit,
    canShare,
    canPublish,
    canManageMembers,
    switchWorkspace,
    signOut,
    items,
    pages,
    activePageId,
    activePageName,
    undoStack,
    redoStack,
    selectedId,
    active,
    tab,
    setTab,
    inspectorTab,
    setInspectorTab,
    device,
    setDevice,
    preview,
    setPreview,
    saved,
    publishOpen,
    setPublishOpen,
    aiOpen,
    setAiOpen,
    aiPrompt,
    setAiPrompt,
    generating,
    chatMessages,
    chatInput,
    setChatInput,
    chatSending,
    sendChatMessage,
    notice,
    setNotice,
    dismissNotice,
    exportOpen,
    setExportOpen,
    membersOpen,
    setMembersOpen,
    members,
    memberEmail,
    setMemberEmail,
    memberRole,
    setMemberRole,
    memberMessage,
    exportTarget,
    setExportTarget,
    zoom,
    setZoom,
    search,
    setSearch,
    filteredItems,
    toggleVisibility,
    loadDemoSite,
    generateFromPrompt,
    update,
    updateStyle,
    undo,
    redo,
    exportProject,
    exportCode,
    saveNow,
    switchPage,
    addPage,
    renamePage,
    duplicatePage,
    deletePage,
    openMembers,
    saveMember,
    addItem,
    addInsertPreset,
    addLayout,
    addAsset,
    removeItem,
    reorderItems,
    selectItem,
    iconFor,
  } = editor;

  return (
    <div className="builder-shell">
      <EditorHeader
        pageName={activePageName}
        theme={theme}
        user={user}
        authEnabled={authEnabled}
        canEdit={canEdit}
        canShare={canShare}
        canPublish={canPublish}
        saved={saved}
        undoCount={undoStack.length}
        redoCount={redoStack.length}
        onUndo={undo}
        onRedo={redo}
        onShare={() => setPublishOpen(true)}
        onPublish={() => setPublishOpen(true)}
        onToggleTheme={toggleTheme}
        onSignOut={() => {
          if (authEnabled) void signOut().catch((error: unknown) => {
            setNotice(error instanceof Error ? error.message : "Could not sign out.");
          });
        }}
      />

      <div className="workspace">
        <EditorSidebar
          Icon={Icon}
          user={user}
          authEnabled={authEnabled}
          canEdit={canEdit}
          canManageMembers={canManageMembers}
          filteredItems={filteredItems}
          pages={pages}
          activePageId={activePageId}
          activePageName={activePageName}
          selectedId={selectedId}
          tab={tab}
          search={search}
          iconFor={iconFor}
          onTabChange={setTab}
          onLoadDemo={loadDemoSite}
          onCreatePage={addPage}
          onSwitchPage={switchPage}
          onRenamePage={renamePage}
          onDuplicatePage={duplicatePage}
          onDeletePage={deletePage}
          onSearchChange={setSearch}
          onSelect={(id) => {
            selectItem(id);
            setInspectorTab("style");
          }}
          onAdd={addItem}
          onAddInsertPreset={addInsertPreset}
          onAddLayout={addLayout}
          onAssetSelect={(file) => void addAsset(file)}
          onAiOpen={() => setAiOpen(true)}
          onToggleVisibility={toggleVisibility}
          onReorder={reorderItems}
          onSwitchWorkspace={(id) => void switchWorkspace(id).catch((error: unknown) => {
            setNotice(error instanceof Error ? error.message : "Could not switch workspace.");
          })}
          onOpenMembers={() => void openMembers()}
        />

        <EditorCanvasPanel
          items={items}
          selectedId={selectedId}
          activeName={active?.name}
          pageName={activePageName}
          device={device}
          preview={preview}
          zoom={zoom}
          onDeviceChange={setDevice}
          onPreviewToggle={() => setPreview((value) => !value)}
          onZoom={() => setZoom((value) => value === 100 ? 75 : value === 75 ? 50 : 100)}
          onExportProject={exportProject}
          onExportCode={() => setExportOpen(true)}
          onSelect={(id) => !preview && selectItem(id)}
          onSaveNow={saveNow}
        />

        <InspectorPanel
          Icon={Icon}
          active={active}
          canEdit={canEdit}
          inspectorTab={inspectorTab}
          iconFor={iconFor}
          onTabChange={setInspectorTab}
          onUpdate={update}
          onUpdateStyle={updateStyle}
          onUploadImage={(file) => void addAsset(file)}
          onDelete={removeItem}
        />
      </div>

      <EditorDialogs
        aiOpen={aiOpen}
        aiPrompt={aiPrompt}
        generating={generating}
        chatMessages={chatMessages}
        chatInput={chatInput}
        chatSending={chatSending}
        notice={notice}
        exportOpen={exportOpen}
        exportTarget={exportTarget}
        membersOpen={membersOpen}
        members={members}
        memberEmail={memberEmail}
        memberRole={memberRole}
        memberMessage={memberMessage}
        publishOpen={publishOpen}
        onAiClose={() => setAiOpen(false)}
        onAiPromptChange={setAiPrompt}
        onGenerate={() => void generateFromPrompt()}
        onChatInputChange={setChatInput}
        onChatSend={() => void sendChatMessage()}
        onExportClose={() => setExportOpen(false)}
        onExportTargetChange={setExportTarget}
        onExport={exportCode}
        onMembersClose={() => setMembersOpen(false)}
        onMemberEmailChange={setMemberEmail}
        onMemberRoleChange={setMemberRole}
        onSaveMember={() => void saveMember()}
        onNoticeDismiss={dismissNotice}
        onPublishClose={() => setPublishOpen(false)}
      />
    </div>
  );
}

export default App;
