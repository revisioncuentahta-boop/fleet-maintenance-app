import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Car, 
  Wrench, 
  Search, 
  Upload, 
  Download, 
  ChevronRight, 
  FileSpreadsheet, 
  Filter, 
  Clock, 
  AlertTriangle, 
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  Trash2
} from 'lucide-react';

const INITIAL_CATEGORIES = [
  { id: 'ligeros', name: 'Vehículos Ligeros', icon: 'Car', description: 'Autos, SUVs, Pick-ups y Vans' },
  { id: 'camiones', name: 'Camiones & Comercial', icon: 'Truck', description: 'Camiones de carga liviana, mediana, pesada y chasis' },
  { id: 'maquinarias', name: 'Maquinarias & Pesados', icon: 'Wrench', description: 'Tractores, excavadoras, montacargas y maquinaria vial' },
];

export default function App() {
  const [categories] = useState(INITIAL_CATEGORIES);
  const [models, setModels] = useState([]);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedModelId, setSelectedModelId] = useState(null);
  const [viewMode, setViewMode] = useState('interval');
  const [selectedInterval, setSelectedInterval] = useState(null);

  const [copiedCode, setCopiedCode] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const selectedModel = useMemo(() => {
    return models.find(m => m.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  React.useEffect(() => {
    if (selectedModel && selectedModel.intervals.length > 0) {
      setSelectedInterval(selectedModel.intervals[0]);
    }
  }, [selectedModelId, selectedModel]);

  const availableBrands = useMemo(() => {
    const brandSet = new Set(models.map(m => m.brand));
    return Array.from(brandSet).sort();
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchCat = activeCategory === 'all' || model.categoryId === activeCategory;
      const matchBrand = selectedBrand === 'all' || model.brand === selectedBrand;
      const search = searchTerm.toLowerCase().trim();
      const matchSearch = !search || 
        model.name.toLowerCase().includes(search) || 
        model.brand.toLowerCase().includes(search) ||
        (model.engine && model.engine.toLowerCase().includes(search)) ||
        Object.values(model.codes).some(code => code && code.toLowerCase().includes(search));

      return matchCat && matchBrand && matchSearch;
    });
  }, [models, activeCategory, selectedBrand, searchTerm]);

  const handleAdminAuthToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setCopiedCode('Sesión de administración cerrada');
      setTimeout(() => setCopiedCode(''), 2500);
    } else {
      setAdminId('');
      setAdminPassword('');
      setLoginError('');
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (adminId.trim() === 'admin' && adminPassword === '1234') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginError('');
      setCopiedCode('¡Sesión de Administrador iniciada!');
      setTimeout(() => setCopiedCode(''), 2500);
    } else {
      setLoginError('ID de usuario o contraseña incorrectos.');
    }
  };

  const handleCopyCode = (code, label) => {
    if (!code || code === 'N/A' || code === 'N/D') return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(code).catch(() => fallbackCopyText(code));
      } else {
        fallbackCopyText(code);
      }
    } catch (e) {
      fallbackCopyText(code);
    }
    setCopiedCode(`¡Código ${label} (${code}) copiado!`);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); } catch (err) {}
    document.body.removeChild(textArea);
  };

  const handleDeleteModel = (modelId, e) => {
    if (e) e.stopPropagation();
    setModels(prev => prev.filter(m => m.id !== modelId));
    if (selectedModelId === modelId) {
      setSelectedModelId(null);
    }
    setCopiedCode('Modelo eliminado correctamente');
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r\n|\n/);
        if (lines.length < 2) return;

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const modelsMap = {};

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
          
          if (cols.length < 5) continue;

          const brand = cols[1] || cols[0] || 'GENERAL';
          const modelName = cols[4] || cols[3] || 'MODELO DESCONOCIDO';
          const km = parseInt(cols[5]) || 0;
          const hours = parseInt(cols[6]) || 0;
          const intervalVal = km > 0 ? km : hours;
          const intervalUnit = km > 0 ? 'km' : 'hs';

          const artCode = cols[7] || 'S/C';
          const artName = cols[8] || 'ARTICULO';
          const qty = parseFloat(cols[9]) || 1;
          const unitPrice = parseFloat(cols[10]) || 0;

          const modelKey = `${brand}_${modelName}`.toUpperCase();

          if (!modelsMap[modelKey]) {
            let cat = 'ligeros';
            const upperName = modelName.toUpperCase();
            if (upperName.includes('CAMION') || upperName.includes('TRUCK') || upperName.includes('SHACMAN') || upperName.includes('ISUZU') || upperName.includes('FARIZON')) {
              cat = 'camiones';
            } else if (upperName.includes('MAQUINARIA') || upperName.includes('EXCAVADORA') || upperName.includes('TRACTOR') || upperName.includes('AGRALE')) {
              cat = 'maquinarias';
            }

            modelsMap[modelKey] = {
              id: 'm_' + Math.random().toString(36).substr(2, 9),
              categoryId: cat,
              brand: brand,
              name: modelName,
              engine: 'Especificación de Fábrica',
              codes: {
                aceiteMotor: 'N/D',
                filtroAceite: 'N/D',
                filtroAire: 'N/D',
                filtroCombustible: 'N/D',
                aceiteCaja: 'N/D',
                manoObraRef: 'MO001'
              },
              intervalsSet: new Set(),
              unit: intervalUnit,
              planItemsMap: {}
            };
          }

          const modelObj = modelsMap[modelKey];
          if (intervalVal > 0) {
            modelObj.intervalsSet.add(intervalVal);
          }

          const lowerArt = artName.toLowerCase();
          if (lowerArt.includes('aceite motor') || lowerArt.includes('aceite de motor')) modelObj.codes.aceiteMotor = artCode;
          else if (lowerArt.includes('filtro de aceite') || lowerArt.includes('filtro aceite')) modelObj.codes.filtroAceite = artCode;
          else if (lowerArt.includes('filtro de aire') || lowerArt.includes('filtro aire')) modelObj.codes.filtroAire = artCode;
          else if (lowerArt.includes('filtro de combustible') || lowerArt.includes('filtro combustible')) modelObj.codes.filtroCombustible = artCode;
          else if (lowerArt.includes('aceite caja') || lowerArt.includes('aceite de caja')) modelObj.codes.aceiteCaja = artCode;
          else if (lowerArt.includes('mano de obra')) modelObj.codes.manoObraRef = artCode;

          if (!modelObj.planItemsMap[artCode]) {
            let itemCategory = 'Repuestos';
            if (lowerArt.includes('aceite') || lowerArt.includes('lubricante')) itemCategory = 'Lubricantes';
            else if (lowerArt.includes('filtro')) itemCategory = 'Filtros';
            else if (lowerArt.includes('mano de obra') || lowerArt.includes('servicio')) itemCategory = 'Servicios';

            modelObj.planItemsMap[artCode] = {
              code: artCode,
              name: artName,
              unitPrice: unitPrice,
              category: itemCategory,
              applyAt: {}
            };
          }

          modelObj.planItemsMap[artCode].applyAt[intervalVal] = qty;
        }

        const importedModelsList = Object.values(modelsMap).map(m => ({
          ...m,
          intervals: Array.from(m.intervalsSet).sort((a, b) => a - b),
          plan: Object.values(m.planItemsMap)
        }));

        if (importedModelsList.length === 0) {
          alert('No se encontraron registros válidos en el archivo.');
          return;
        }

        setModels(prev => {
          const existingIds = new Set(importedModelsList.map(item => item.name));
          const filteredOld = prev.filter(p => !existingIds.has(p.name));
          return [...importedModelsList, ...filteredOld];
        });

        setShowImportModal(false);
        setCopiedCode(`¡Se cargaron ${importedModelsList.length} modelos correctamente!`);
        setTimeout(() => setCopiedCode(''), 3000);
      } catch (err) {
        alert('Ocurrió un error al procesar el archivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const csvHeader = "Codigo Marca;Nombre Marca;Codigo Fabrica;Nombre Modelo;Kilometraje;Horas;Codigo Articulo;Nombre Articulo;Cantidad;Precio Unitario\n";
    const csvRows = [
      "AL;AGRALE;AL10001;AGRALE A8700;10000;0;RPP1080QBA;ACEITE MOTOR;12;72100",
      "AL;AGRALE;AL10001;AGRALE A8700;10000;0;6012001078004;FILTRO DE ACEITE;1;667800",
      "AL;AGRALE;AL10001;AGRALE A8700;10000;0;MO001;MANO DE OBRA;1;110000"
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_planes_mantenimiento_oficial.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryIcon = (iconName, className = "w-5 h-5") => {
    switch (iconName) {
      case 'Truck': return <Truck className={className} />;
      case 'Wrench': return <Wrench className={className} />;
      default: return <Car className={className} />;
    }
  };

  const getIntervalSummary = (model, interval) => {
    if (!model || !interval) return { items: [], total: 0 };
    
    const items = model.plan.filter(item => item.applyAt && item.applyAt[interval] > 0).map(item => {
      const qty = item.applyAt[interval];
      const subtotal = qty * item.unitPrice;
      return { ...item, qty, subtotal };
    });

    const total = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    return { items, total };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      <style>{`
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.4); } 50% { box-shadow: 0 0 18px rgba(59, 130, 246, 0.9); } }
        @keyframes pulseGlowGreen { 0%, 100% { box-shadow: 0 0 5px rgba(16, 185, 129, 0.4); } 50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.95); } }
        @keyframes pulseGlowAmber { 0%, 100% { box-shadow: 0 0 5px rgba(245, 158, 11, 0.4); } 50% { box-shadow: 0 0 18px rgba(245, 158, 11, 0.9); } }
        .btn-glow-blue { animation: pulseGlow 3s infinite ease-in-out; }
        .btn-glow-green { animation: pulseGlowGreen 3.5s infinite ease-in-out; }
        .btn-glow-amber { animation: pulseGlowAmber 2.8s infinite ease-in-out; }
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedModelId(null)}>
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2.5 rounded-xl shadow-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              FleetManager <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">PRO</span>
            </h1>
            <p className="text-xs text-slate-400">Planes de Mantenimiento Preventivo & Códigos</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleAdminAuthToggle}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isAdmin 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 btn-glow-amber' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            {isAdmin ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-slate-400" />}
            <span>{isAdmin ? 'Zona Admin Activa' : 'Ingresar como Admin'}</span>
            {isAdmin && <LogOut className="w-3.5 h-3.5 text-slate-400 ml-1" />}
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md btn-glow-green"
            >
              <Upload className="w-4 h-4" />
              <span>Cargar Excel</span>
            </button>
          )}
        </div>
      </header>

      {/* NOTIFICACIÓN */}
      {copiedCode && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-300">
          <Check className="w-5 h-5" />
          <span className="text-sm">{copiedCode}</span>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {!selectedModel ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 shadow-xl">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar modelo, marca o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900 text-slate-100 text-sm pl-11 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setActiveCategory('all'); setSelectedBrand('all'); }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${
                    activeCategory === 'all' 
                      ? 'bg-blue-600 text-white border-blue-400 btn-glow-blue' 
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  Todas
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSelectedBrand('all'); }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border ${
                      activeCategory === cat.id 
                        ? 'bg-blue-600 text-white border-blue-400 btn-glow-blue' 
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    {getCategoryIcon(cat.icon, "w-4 h-4")}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* MARCAS */}
            {availableBrands.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 w-full py-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5" /> Marca:
                </span>
                <button
                  onClick={() => setSelectedBrand('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${selectedBrand === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-900/60 text-slate-400'}`}
                >
                  Todas
                </button>
                {availableBrands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${selectedBrand === brand ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900/60 text-slate-400 border-slate-800'}`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}

            {/* LISTA DE MODELOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-5 hover:shadow-2xl transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-blue-400 uppercase">{model.brand}</span>
                        <h3 className="text-lg font-bold text-white group-hover:text-blue-300">{model.name}</h3>
                      </div>
                      <div className="flex items-center space-x-1">
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteModel(model.id, e)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white mr-1"
                            title="Eliminar Modelo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white">
                          <ChevronRight className="w-5 h-5" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {model.intervals.length} Intervalos ({model.unit})
                    </span>
                    <span className="text-blue-400 font-semibold">Ver Plan &rarr;</span>
                  </div>
                </div>
              ))}

              {filteredModels.length === 0 && (
                <div className="col-span-full py-16 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-4">
                  <FileSpreadsheet className="w-12 h-12 text-slate-600 mx-auto" />
                  <div>
                    <h3 className="text-base font-bold text-slate-300">No hay modelos cargados</h3>
                    <p className="text-xs text-slate-500 mt-1">Activa el Modo Administrador para cargar el archivo Excel de mantenimientos.</p>
                  </div>
                  {!isAdmin ? (
                    <button
                      onClick={handleAdminAuthToggle}
                      className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold btn-glow-amber"
                    >
                      Ingresar como Admin para Cargar Excel
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold btn-glow-green"
                    >
                      Subir Archivo Excel Ahora
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* VISTA DETALLADA DEL MODELO */
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <button
                onClick={() => setSelectedModelId(null)}
                className="inline-flex items-center space-x-1 text-xs font-bold text-blue-400 hover:text-blue-300 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Catálogo</span>
              </button>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">{selectedModel.brand}</span>
                  <h2 className="text-2xl font-black text-white mt-1">{selectedModel.name}</h2>
                </div>

                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setViewMode('interval')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'interval' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    Por Intervalo
                  </button>
                  <button
                    onClick={() => setViewMode('full')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'full' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                  >
                    Matriz Completa
                  </button>
                </div>
              </div>

              {/* CÓDIGOS DE REPUESTOS */}
              <div className="pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-400" /> Códigos de Repuestos Clave (Clic para copiar)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Aceite Motor', code: selectedModel.codes.aceiteMotor },
                    { label: 'Filtro Aceite', code: selectedModel.codes.filtroAceite },
                    { label: 'Filtro Aire', code: selectedModel.codes.filtroAire },
                    { label: 'F. Combustible', code: selectedModel.codes.filtroCombustible },
                    { label: 'Aceite Caja', code: selectedModel.codes.aceiteCaja },
                    { label: 'Mano de Obra', code: selectedModel.codes.manoObraRef },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyCode(item.code, item.label)}
                      className="bg-slate-900 hover:bg-slate-800 p-2.5 rounded-xl border border-slate-800 text-left"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono font-bold text-xs text-white truncate">{item.code || 'N/D'}</span>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* TABLA POR INTERVALO */}
            {viewMode === 'interval' && (
              <div className="space-y-5">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-3">Selecciona Intervalo ({selectedModel.unit.toUpperCase()}):</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedModel.intervals.map((intVal) => (
                      <button
                        key={intVal}
                        onClick={() => setSelectedInterval(intVal)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border ${selectedInterval === intVal ? 'bg-blue-600 text-white border-blue-400 btn-glow-blue' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                      >
                        {intVal.toLocaleString('es-PY')} {selectedModel.unit}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedInterval && (() => {
                  const summary = getIntervalSummary(selectedModel, selectedInterval);
                  return (
                    <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                      <div className="bg-slate-900/80 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-white">Mantenimiento de {selectedInterval.toLocaleString('es-PY')} {selectedModel.unit}</h3>
                        </div>
                        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Costo Total</span>
                          <span className="text-lg font-black text-emerald-400">Gs. {summary.total.toLocaleString('es-PY')}</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-900/40 text-slate-400 border-b border-slate-800 font-bold uppercase">
                              <th className="p-3.5">Código</th>
                              <th className="p-3.5">Descripción</th>
                              <th className="p-3.5 text-center">Cantidad</th>
                              <th className="p-3.5 text-right">Precio Unit. (Gs.)</th>
                              <th className="p-3.5 text-right">Subtotal (Gs.)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-medium">
                            {summary.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/30">
                                <td className="p-3.5 font-mono text-slate-300">{item.code}</td>
                                <td className="p-3.5 font-semibold text-white">{item.name}</td>
                                <td className="p-3.5 text-center font-bold text-blue-400">{item.qty}</td>
                                <td className="p-3.5 text-right text-slate-300">Gs. {item.unitPrice.toLocaleString('es-PY')}</td>
                                <td className="p-3.5 text-right font-bold text-emerald-400">Gs. {item.subtotal.toLocaleString('es-PY')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL LOGIN ADMIN */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Ingreso a Zona de Administración</h3>
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && <p className="text-red-400 text-xs font-semibold">{loginError}</p>}
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="ID de Usuario (admin)"
                className="w-full bg-slate-950 text-white text-sm p-3 rounded-xl border border-slate-800"
                required
              />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Contraseña (1234)"
                className="w-full bg-slate-950 text-white text-sm p-3 rounded-xl border border-slate-800"
                required
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">Ingresar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUBIR EXCEL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <h3 className="text-base font-bold text-white">Subir Planilla Excel / CSV</h3>
            <div className="border border-dashed border-slate-700 bg-slate-950 p-6 rounded-xl text-center space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mx-auto" />
              <label className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer">
                <span>Seleccionar Archivo Excel/CSV</span>
                <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="flex justify-between items-center">
              <button onClick={handleDownloadTemplate} className="text-xs text-blue-400 font-semibold">Descargar Plantilla CSV</button>
              <button onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
