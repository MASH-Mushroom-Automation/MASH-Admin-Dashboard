import Image from "next/image";

export function Header() {
  return (
    <header className="border-b border-gray-300 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/pictures/logo.png" alt="M" width={40} height={36} />
          </div>
          <span className="text-lg font-bold text-green-600 mt-6">M.A.S.H.</span>
        </div>
      </div>
    </header>
  );
}
