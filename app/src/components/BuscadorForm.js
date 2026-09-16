import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './BuscadorForm.css';

const PATOLOGIAS = [
  { campo: 'dm', etiqueta: 'Diabetes' },
  { campo: 'hta', etiqueta: 'Hipertensión' },
  { campo: 'dislipemia', etiqueta: 'Dislipemia' },
  { campo: 'epoc', etiqueta: 'EPOC' },
  { campo: 'asma', etiqueta: 'Asma' },
  { campo: 'icc', etiqueta: 'Insuf. cardíaca' },
  { campo: 'erc', etiqueta: 'ERC' },
  { campo: 'obesidad', etiqueta: 'Obesidad' },
  { campo: 'ecv', etiqueta: 'Enf. cardiovascular' }
];

const FILTROS_INICIALES = {
  texto: '',
  patologias: {},
  nivel_cronicidad: '',
  atencion_domiciliaria: '',
  consulta_desde: '',
  consulta_hasta: '',
  orden: 'asc'
};

const BuscadorForm = ({ onAbrirPaciente }) => {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [resultados, setResultados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const togglePatologia = (campo) => {
    setFiltros({
      ...filtros,
      patologias: { ...filtros.patologias, [campo]: !filtros.patologias[campo] }
    });
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setResultados([]);
    setBusquedaRealizada(false);
    setErrorMessage('');
  };

  const buscar = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      let query = supabase.from('pacientes').select('*');

      Object.entries(filtros.patologias).forEach(([campo, marcado]) => {
        if (marcado) query = query.eq(campo, true);
      });

      if (filtros.nivel_cronicidad) {
        query = query.eq('nivel_cronicidad', filtros.nivel_cronicidad);
      }

      if (filtros.atencion_domiciliaria) {
        query = query.eq('encamado', filtros.atencion_domiciliaria === 'si');
      }

      if (filtros.consulta_desde) {
        query = query.gte('fecha_consulta', filtros.consulta_desde);
      }

      if (filtros.consulta_hasta) {
        query = query.lte('fecha_consulta', filtros.consulta_hasta);
      }

      const texto = filtros.texto.trim().replace(/,/g, '');
      if (texto) {
        query = query.or(`nombre.ilike.%${texto}%,apellidos.ilike.%${texto}%,sip.ilike.%${texto}%`);
      }

      query = query
        .order('fecha_consulta', { ascending: filtros.orden === 'asc', nullsFirst: filtros.orden === 'asc' })
        .limit(200);

      const { data, error } = await query;
      if (error) throw error;
      setResultados(data || []);
      setBusquedaRealizada(true);
    } catch (error) {
      setErrorMessage('❌ Error al buscar: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '--';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const patologiasDe = (paciente) =>
    PATOLOGIAS.filter(p => paciente[p.campo]).map(p => p.etiqueta);

  const exportarCSV = () => {
    const cabecera = ['Nombre', 'Apellidos', 'SIP', 'Edad', 'Cronicidad', 'Atención domiciliaria', 'Patologías', 'Última consulta'];
    const escapar = (valor) => `"${String(valor ?? '').replace(/"/g, '""')}"`;
    const filas = resultados.map(p => [
      p.nombre,
      p.apellidos,
      p.sip,
      p.edad,
      p.nivel_cronicidad,
      p.encamado ? 'Sí' : 'No',
      patologiasDe(p).join('; '),
      formatFecha(p.fecha_consulta)
    ].map(escapar).join(','));

    const csv = '﻿' + [cabecera.map(escapar).join(','), ...filas].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `pacientes_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);
  };

  const imprimirResultados = () => {
    const filas = resultados.map(p => `
      <tr>
        <td>${p.nombre || ''} ${p.apellidos || ''}</td>
        <td>${p.sip || ''}</td>
        <td>${p.edad || '--'}</td>
        <td>${p.nivel_cronicidad || '--'}</td>
        <td>${p.encamado ? 'Sí' : 'No'}</td>
        <td>${patologiasDe(p).join(', ') || '--'}</td>
        <td>${formatFecha(p.fecha_consulta)}</td>
      </tr>
    `).join('');

    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
        <head>
          <title>Listado de pacientes - ${new Date().toLocaleDateString('es-ES')}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; color: #333; }
            h2 { color: #003049; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            th { background: #eef2f7; }
            button { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #0077b6; color: white; border: none; border-radius: 5px; cursor: pointer; }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Imprimir</button>
          <h2>Listado de pacientes (${resultados.length})</h2>
          <table>
            <thead>
              <tr><th>Paciente</th><th>SIP</th><th>Edad</th><th>Cronicidad</th><th>At. domiciliaria</th><th>Patologías</th><th>Última consulta</th></tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </body>
      </html>
    `);
  };

  return (
    <div className="section active">
      <div className="bloque">
        <div className="section-header">Buscador de pacientes</div>
        <div>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre, apellidos o SIP</label>
              <input
                type="text"
                value={filtros.texto}
                onChange={(e) => setFiltros({ ...filtros, texto: e.target.value })}
                placeholder="Buscar por texto..."
              />
            </div>
            <div className="form-group">
              <label>Nivel de cronicidad</label>
              <select
                value={filtros.nivel_cronicidad}
                onChange={(e) => setFiltros({ ...filtros, nivel_cronicidad: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="Nivel 1">Nivel 1</option>
                <option value="Nivel 2">Nivel 2</option>
                <option value="Nivel 3">Nivel 3</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Atención domiciliaria</label>
              <select
                value={filtros.atencion_domiciliaria}
                onChange={(e) => setFiltros({ ...filtros, atencion_domiciliaria: e.target.value })}
              >
                <option value="">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ordenar por última consulta</label>
              <select
                value={filtros.orden}
                onChange={(e) => setFiltros({ ...filtros, orden: e.target.value })}
              >
                <option value="asc">Más antigua primero (revisión pendiente)</option>
                <option value="desc">Más reciente primero</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Última consulta desde</label>
              <input
                type="date"
                value={filtros.consulta_desde}
                onChange={(e) => setFiltros({ ...filtros, consulta_desde: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Última consulta hasta</label>
              <input
                type="date"
                value={filtros.consulta_hasta}
                onChange={(e) => setFiltros({ ...filtros, consulta_hasta: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Patologías (cumple todas las marcadas)</label>
            <div className="buscador-patologias">
              {PATOLOGIAS.map(p => (
                <label key={p.campo} className="buscador-patologia-check">
                  <input
                    type="checkbox"
                    checked={!!filtros.patologias[p.campo]}
                    onChange={() => togglePatologia(p.campo)}
                  />
                  {p.etiqueta}
                </label>
              ))}
            </div>
          </div>

          <div className="form-row button-group" style={{ marginTop: '16px' }}>
            <button type="button" className="save-button" onClick={buscar} disabled={isLoading}>
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
            <button type="button" className="logout-button" onClick={limpiarFiltros} disabled={isLoading}>
              Limpiar filtros
            </button>
          </div>
        </div>
        {errorMessage && <div className="info-box red" style={{ marginTop: '10px' }}>{errorMessage}</div>}
      </div>

      {busquedaRealizada && (
        <div className="bloque">
          <div className="section-header">
            Resultados ({resultados.length}{resultados.length === 200 ? '+' : ''})
          </div>
          {resultados.length === 0 ? (
            <div className="info-box">No se encontraron pacientes con esos criterios.</div>
          ) : (
            <>
            <div className="form-row" style={{ gap: '10px', marginBottom: '12px' }}>
              <button type="button" className="calculate-button calculate-button-secondary" onClick={exportarCSV}>
                Exportar CSV
              </button>
              <button type="button" className="calculate-button calculate-button-secondary" onClick={imprimirResultados}>
                Imprimir
              </button>
            </div>
            <div className="buscador-tabla-wrap">
              <table className="buscador-tabla">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>SIP</th>
                    <th>Edad</th>
                    <th>Cronicidad</th>
                    <th>At. domiciliaria</th>
                    <th>Patologías</th>
                    <th>Última consulta</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map(p => (
                    <tr key={p.id}>
                      <td>{p.nombre} {p.apellidos}</td>
                      <td>{p.sip}</td>
                      <td>{p.edad || '--'}</td>
                      <td>{p.nivel_cronicidad || '--'}</td>
                      <td>{p.encamado ? 'Sí' : 'No'}</td>
                      <td className="buscador-patologias-celda">
                        {patologiasDe(p).length > 0
                          ? patologiasDe(p).map(nombre => (
                              <span key={nombre} className="buscador-chip">{nombre}</span>
                            ))
                          : '--'}
                      </td>
                      <td>{formatFecha(p.fecha_consulta)}</td>
                      <td>
                        <button
                          type="button"
                          className="buscador-btn-abrir"
                          onClick={() => onAbrirPaciente(p)}
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BuscadorForm;
