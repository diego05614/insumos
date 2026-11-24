interface SearchBarProps {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
}

export function SearchBar({
  valor,
  onCambio,
  placeholder = 'Buscar insumos por nombre o descripción...',
}: SearchBarProps) {
  return (
    <div className="relative flex items-center w-full" role="search">
      <svg
        className="absolute left-3.5 text-slate-400 pointer-events-none w-5 h-5"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <line
          x1="16.5"
          y1="16.5"
          x2="21"
          y2="21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <input
        id="buscar-productos"
        name="buscar-productos"
        type="search"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
        className="w-full h-[44px] pl-11 pr-10 text-sm text-slate-900 bg-slate-50/90 focus:bg-white border border-slate-200 rounded-2xl shadow-2xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-all [&::-webkit-search-cancel-button]:hidden"
      />

      {valor && (
        <button
          type="button"
          onClick={() => onCambio('')}
          aria-label="Borrar búsqueda"
          className="absolute right-2.5 w-7 h-7 grid place-items-center text-lg leading-none text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-full transition cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  );
}