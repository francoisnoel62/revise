// ABOUTME: Contextual button that appears when text is selected to trigger rewriting
// ABOUTME: Positioned near selection with 2-click maximum UX requirement

'use client';

interface RewriteButtonProps {
  visible: boolean;
  position: { top: number; left: number };
  onRewrite: () => void;
  loading?: boolean;
}

export function RewriteButton({
  visible,
  position,
  onRewrite,
  loading = false,
}: RewriteButtonProps) {
  if (!visible) return null;

  return (
    <button
      onClick={onRewrite}
      disabled={loading}
      className="absolute z-10 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      {loading ? 'Génération...' : 'Réécrire'}
    </button>
  );
}
