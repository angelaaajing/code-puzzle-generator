interface ControlPanelProps {
  onUndo: () => void;
  onRedo: () => void;
  onHint: () => void;
  onCheck: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const ControlPanel = ({
  onUndo,
  onRedo,
  onHint,
  onCheck,
  canUndo,
  canRedo,
}: ControlPanelProps) => {
  return (
    <div className="p-4 flex justify-between border-t bg-gray-100">
      <div className="flex space-x-4">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-6 py-2 rounded font-medium ${
            canUndo ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          undo
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-6 py-2 rounded font-medium ${
            canRedo ? 'bg-blue-400 text-white hover:bg-blue-500' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          redo
        </button>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onHint}
          className="px-6 py-2 rounded font-medium bg-green-500 text-white hover:bg-green-600"
        >
          hint
        </button>

        <button
          onClick={onCheck}
          className="px-6 py-2 rounded font-medium bg-fuchsia-600 text-white hover:bg-fuchsia-700"
        >
          check
        </button>
      </div>
    </div>
  );
};