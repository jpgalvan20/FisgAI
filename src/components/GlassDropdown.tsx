import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface GlassDropdownProps {
  label?: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  headerTitle?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
}

export const GlassDropdown: React.FC<GlassDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  headerTitle,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-medium text-[#d1d5db] mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger Button - Estilo idêntico ao seletor de workspaces */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full p-2.5 px-3.5 rounded-xl bg-[#202126] hover:bg-[#26282e] border border-[#2c2d36] flex items-center justify-between cursor-pointer transition-colors text-left group ${
          isOpen ? 'border-[#3b82f6] shadow-lg shadow-blue-500/10' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {selectedOption?.icon && (
            <span className="shrink-0 text-white">{selectedOption.icon}</span>
          )}
          <div className="min-w-0">
            <span
              className={`text-xs block truncate ${
                selectedOption
                  ? 'font-semibold text-white group-hover:text-blue-400 transition-colors'
                  : 'text-[#858b99]'
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.subtitle && (
              <span className="text-[10px] text-[#858b99] block truncate mt-0.5">
                {selectedOption.subtitle}
              </span>
            )}
          </div>
        </div>

        <div
          className={`w-6 h-6 rounded-lg bg-[#272830] flex items-center justify-center text-[#858b99] group-hover:text-white transition-all shrink-0 ${
            isOpen ? 'rotate-180 text-white bg-blue-600/30' : ''
          }`}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Floating Menu - Sólido e de alto contraste (Sem transparência para ver as opções claramente) */}
      {isOpen && (
        <div
          data-dropdown-menu="true"
          className={`glass-dropdown-menu absolute left-0 right-0 top-full mt-1.5 p-2 rounded-2xl bg-[#0e111a] border border-slate-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.98)] z-50 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto scrollbar-thin ${menuClassName}`}
          style={{ backgroundColor: '#0e111a', opacity: 1 }}
        >
          {headerTitle && (
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-white/10 mb-1.5 flex items-center justify-between">
              <span>{headerTitle}</span>
              <span className="text-[9px] text-slate-400 font-mono font-normal">ESC para fechar</span>
            </div>
          )}

          <div className="space-y-1">
            {options.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-600/35 text-white font-bold border border-blue-400/60 shadow-sm'
                        : 'text-white hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-white">{opt.label}</span>
                        {opt.subtitle && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {opt.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 stroke-[2.5]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
