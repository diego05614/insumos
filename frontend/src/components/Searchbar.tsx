import './SearchBar.css';

interface SearchBarProps {
  valor: string;
  onCambio: (valor: string) => void;
  placeholder?: string;
}

export function SearchBar({
  valor,
  onCambio,
  placeholder = 'Buscar productos...',
}: SearchBarProps) {
  return (
    <div className="search-bar" role="search">
      <svg className="search-bar__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <input
        type="search"
        className="search-bar__input"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
      />

      {valor && (
        <button
          type="button"
          className="search-bar__clear"
          onClick={() => onCambio('')}
          aria-label="Borrar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  );
}
