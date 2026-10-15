import { useWorkspaceStore } from '../../store/workspace';

export default function EditorTabs() {
  const { files, openTabs, activeFileId, setActiveFile, closeTab } = useWorkspaceStore();

  if (openTabs.length === 0) return null;

  return (
    <div className='flex bg-gray-900 border-b border-gray-800 overflow-x-auto'>
      {openTabs.map((id) => {
        const file = files.find((f) => f._id === id);
        if (!file) return null;
        const active = id === activeFileId;
        return (
          <div
            key={id}
            className={'flex items-center gap-2 px-3 py-2 text-xs border-r border-gray-800 cursor-pointer ' + (active ? 'bg-gray-950 text-white' : 'text-gray-400 hover:bg-gray-800')}
            onClick={() => setActiveFile(id)}
          >
            <span className='truncate max-w-[120px]'>{file.name}</span>
            <button
              className='text-gray-500 hover:text-white'
              onClick={(e) => {
                e.stopPropagation();
                closeTab(id);
              }}
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}
