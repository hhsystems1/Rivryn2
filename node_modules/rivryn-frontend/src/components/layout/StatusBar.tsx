export function StatusBar() {
  return (
    <div className="h-6 bg-blue-600 text-white text-xs flex items-center px-3 justify-between">
      <div className="flex gap-4">
        <span>RivRyn Ready</span>
      </div>
      <div className="flex gap-4">
        <span>TypeScript</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
}
