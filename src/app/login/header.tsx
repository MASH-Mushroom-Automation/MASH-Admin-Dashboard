export function Header() {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-600">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <span className="text-lg font-bold text-green-600">MASH</span>
        </div>
      </div>
    </header>
  );
}
