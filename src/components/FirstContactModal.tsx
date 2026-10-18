import React, { useState, useEffect } from 'react';
import { Company, ApproachTemplate } from '../types';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  RotateCcw, 
  Check, 
  Copy,
  Edit3
} from 'lucide-react';

interface FirstContactModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  onSendWhatsApp: (company: Company, customMessage: string) => void;
  approaches: ApproachTemplate[];
  defaultMyName: string;
}

export const FirstContactModal: React.FC<FirstContactModalProps> = ({
  company,
  isOpen,
  onClose,
  onSendWhatsApp,
  approaches,
  defaultMyName,
}) => {
  if (!isOpen || !company) return null;

  const [selectedApproachId, setSelectedApproachId] = useState<string>(approaches[0]?.id || '1');
  const [greetingName, setGreetingName] = useState<string>(company.name);
  const [niche, setNiche] = useState<string>(company.niche.toLowerCase());
  const [city, setCity] = useState<string>(company.city);
  const [myName, setMyName] = useState<string>(defaultMyName);
  const [editableMessage, setEditableMessage] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Compute text based on template
  const generateTextFromTemplate = (templateStr: string) => {
    return templateStr
      .replace(/{meu nome}/gi, myName)
      .replace(/{empresa}/gi, greetingName)
      .replace(/{nicho}/gi, niche)
      .replace(/{cidade}/gi, city);
  };

  // When selected approach or variables change
  useEffect(() => {
    const currentTemplate = approaches.find((a) => a.id === selectedApproachId);
    if (currentTemplate) {
      setEditableMessage(generateTextFromTemplate(currentTemplate.template));
    }
  }, [selectedApproachId, greetingName, niche, city, myName, approaches]);

  // Restore original text
  const handleRestoreOriginal = () => {
    const currentTemplate = approaches.find((a) => a.id === selectedApproachId);
    if (currentTemplate) {
      setEditableMessage(generateTextFromTemplate(currentTemplate.template));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableMessage);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    onSendWhatsApp(company, editableMessage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl bg-[#1a1b1f] border border-[#2a2b32] rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#26272e] bg-[#1e1f24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#172554] border border-[#1e3a8a] flex items-center justify-center text-[#60a5fa]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                Primeiro Contato — {company.name}
              </h2>
              <p className="text-[11px] text-[#858b99]">
                Escolha uma abordagem validada, personalize as variáveis e envie direto pelo WhatsApp.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#18191d] hover:bg-[#25262c] text-[#858b99] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2-Column Split: Approaches on Left, Variables & Editor on Right */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Approaches List (5 cols) */}
          <div className="md:col-span-5 p-4 border-b md:border-b-0 md:border-r border-[#26272e] bg-[#16171a] space-y-2">
            <span className="text-[10px] font-bold text-[#858b99] uppercase tracking-wider block px-1 mb-2">
              Abordagens de Mensagem (5)
            </span>

            {approaches.map((appr) => {
              const isSelected = selectedApproachId === appr.id;

              return (
                <div
                  key={appr.id}
                  onClick={() => setSelectedApproachId(appr.id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border text-left ${
                    isSelected
                      ? 'bg-[#1e293b]/70 border-[#2563eb] text-white shadow-sm'
                      : 'bg-[#1e1f24] border-[#2a2b32] hover:bg-[#25262d] text-[#858b99]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-[#d1d5db]'}`}>
                      {appr.title}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#858b99] line-clamp-2 leading-relaxed">
                    {appr.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Dynamic Variables & Message Box (7 cols) */}
          <div className="md:col-span-7 p-5 space-y-4 flex flex-col justify-between bg-[#1a1b1f]">
            <div className="space-y-4">
              {/* Editable Variables Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-[#1e1f24] border border-[#2a2b32]">
                <div>
                  <label className="block text-[10px] font-semibold text-[#858b99] uppercase mb-1">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={greetingName}
                    onChange={(e) => setGreetingName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#16171a] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#858b99] uppercase mb-1">
                    Nicho
                  </label>
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#16171a] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#858b99] uppercase mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#16171a] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-[#858b99] uppercase mb-1">
                    Meu Nome
                  </label>
                  <input
                    type="text"
                    value={myName}
                    onChange={(e) => setMyName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#16171a] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              {/* Message Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-[#60a5fa]" />
                    <span>Mensagem Pronta (Editável)</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRestoreOriginal}
                      className="text-[11px] text-[#60a5fa] hover:underline flex items-center gap-1 font-medium"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar texto</span>
                    </button>
                    <button
                      onClick={handleCopy}
                      className="text-[11px] text-[#858b99] hover:text-white flex items-center gap-1 font-medium pl-2 border-l border-[#2a2b32]"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={editableMessage}
                  onChange={(e) => setEditableMessage(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#16171a] border border-[#2c2d36] text-xs text-white focus:outline-none focus:border-[#2563eb] leading-relaxed"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#1e1f24] border border-[#2a2b32] text-[11px] text-[#858b99] flex items-center gap-2">
                <span className="font-semibold text-white">Número:</span>
                <span className="font-mono text-[#60a5fa]">{company.phone}</span>
                <span className="text-[#525764]">·</span>
                <span>O WhatsApp abrirá com o texto pré-preenchido.</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-[#26272e] flex items-center justify-end gap-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#858b99] hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={handleOpenWhatsApp}
                className="px-5 py-2 rounded-full bg-[#2563eb] hover:bg-blue-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
