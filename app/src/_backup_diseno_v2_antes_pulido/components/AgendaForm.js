import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import './AgendaForm.css';

const AgendaForm = () => {
  const [recordatorios, setRecordatorios] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mostrarCompletados, setMostrarCompletados] = useState(false);
  const [nuevoManual, setNuevoManual] = useState({ sip: '', nombre_paciente: '', motivo: '', fecha_prevista: '' });
  const [mostrarFormManual, setMostrarFormManual] = useState(false);

  const cargarRecordatorios = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      let query = supabase
        .from('recordatorios_agenda')
        .select('*')
        .order('fecha_prevista', { ascending: true });

      if (!mostrarCompletados) {
        query = query.eq('estado', 'pendiente');
      }

      const { data, error } = await query;
      if (error) throw error;
      setRecordatorios(data || []);
    } catch (error) {
      setErrorMessage('❌ Error al cargar la agenda: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [mostrarCompletados]);

  useEffect(() => {
    cargarRecordatorios();
  }, [cargarRecordatorios]);

  const marcarEstado = async (id, estado) => {
    try {
      const { error } = await supabase
        .from('recordatorios_agenda')
        .update({
          estado,
          fecha_completado: estado === 'completado' ? new Date().toISOString() : null
        })
        .eq('id', id);
      if (error) throw error;
      cargarRecordatorios();
    } catch (error) {
      setErrorMessage('❌ Error al actualizar: ' + error.message);
    }
  };

  const cambiarFecha = async (id, nuevaFecha) => {
    try {
      const { error } = await supabase
        .from('recordatorios_agenda')
        .update({ fecha_prevista: nuevaFecha })
        .eq('id', id);
      if (error) throw error;
      cargarRecordatorios();
    } catch (error) {
      setErrorMessage('❌ Error al cambiar fecha: ' + error.message);
    }
  };

  const eliminarRecordatorio = async (id) => {
    if (!window.confirm('¿Eliminar este recordatorio de la agenda?')) return;
    try {
      const { error } = await supabase
        .from('recordatorios_agenda')
        .delete()
        .eq('id', id);
      if (error) throw error;
      cargarRecordatorios();
    } catch (error) {
      setErrorMessage('❌ Error al eliminar: ' + error.message);
    }
  };

  const crearManual = async (e) => {
    e.preventDefault();
    if (!nuevoManual.fecha_prevista || !nuevoManual.motivo) {
      setErrorMessage('⚠️ Completa al menos fecha y motivo');
      return;
    }
    try {
      const { error } = await supabase
        .from('recordatorios_agenda')
        .insert([{
          sip: nuevoManual.sip || null,
          nombre_paciente: nuevoManual.nombre_paciente || null,
          tipo: 'manual',
          motivo: nuevoManual.motivo,
          fecha_prevista: nuevoManual.fecha_prevista,
          origen: 'manual',
          estado: 'pendiente'
        }]);
      if (error) throw error;
      setNuevoManual({ sip: '', nombre_paciente: '', motivo: '', fecha_prevista: '' });
      setMostrarFormManual(false);
      cargarRecordatorios();
    } catch (error) {
      setErrorMessage('❌ Error al crear recordatorio: ' + error.message);
    }
  };

  const agruparRecordatorios = () => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const en7dias = new Date(hoy);
    en7dias.setDate(en7dias.getDate() + 7);
    const en30dias = new Date(hoy);
    en30dias.setDate(en30dias.getDate() + 30);

    const grupos = { vencidos: [], proximos7: [], proximos30: [], futuros: [], completados: [] };

    recordatorios.forEach(r => {
      if (r.estado === 'completado' || r.estado === 'descartado') {
        grupos.completados.push(r);
        return;
      }
      const fecha = new Date(r.fecha_prevista + 'T00:00:00');
      if (fecha < hoy) grupos.vencidos.push(r);
      else if (fecha <= en7dias) grupos.proximos7.push(r);
      else if (fecha <= en30dias) grupos.proximos30.push(r);
      else grupos.futuros.push(r);
    });

    return grupos;
  };

  const grupos = agruparRecordatorios();

  const renderGrupo = (titulo, icono, items, claseColor) => {
    if (items.length === 0) return null;
    return (
      <div className="bloque">
        <div className="section-header">{icono} {titulo} ({items.length})</div>
        <div className="agenda-lista">
          {items.map(r => (
            <div key={r.id} className={`agenda-item ${claseColor}`}>
              <div className="agenda-item-info">
                <div className="agenda-item-paciente">
                  {r.nombre_paciente || 'Paciente sin nombre'}
                  {r.sip && <span className="agenda-item-sip"> (SIP: {r.sip})</span>}
                </div>
                <div className="agenda-item-motivo">{r.motivo}</div>
              </div>
              <div className="agenda-item-acciones">
                <input
                  type="date"
                  value={r.fecha_prevista}
                  onChange={(e) => cambiarFecha(r.id, e.target.value)}
                  className="agenda-fecha-input"
                />
                {r.estado === 'pendiente' ? (
                  <>
                    <button type="button" onClick={() => marcarEstado(r.id, 'completado')} className="agenda-btn agenda-btn-ok" title="Marcar completado">✔️</button>
                    <button type="button" onClick={() => marcarEstado(r.id, 'descartado')} className="agenda-btn agenda-btn-descartar" title="Descartar">🗑️</button>
                  </>
                ) : (
                  <button type="button" onClick={() => eliminarRecordatorio(r.id)} className="agenda-btn agenda-btn-eliminar" title="Eliminar definitivamente">❌</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="section active">
      <div className="bloque">
        <div className="section-header">📅 Agenda de seguimientos</div>
        <div className="form-row" style={{ gap: '10px', alignItems: 'center' }}>
          <button type="button" onClick={() => setMostrarFormManual(!mostrarFormManual)} className="calculate-button">
            {mostrarFormManual ? '✖️ Cancelar' : '➕ Nuevo recordatorio manual'}
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={mostrarCompletados}
              onChange={(e) => setMostrarCompletados(e.target.checked)}
            />
            Mostrar completados/descartados
          </label>
        </div>

        {mostrarFormManual && (
          <div className="agenda-form-manual">
            <div className="form-row">
              <div className="form-group">
                <label>SIP (opcional)</label>
                <input type="text" value={nuevoManual.sip} onChange={(e) => setNuevoManual({ ...nuevoManual, sip: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nombre paciente (opcional)</label>
                <input type="text" value={nuevoManual.nombre_paciente} onChange={(e) => setNuevoManual({ ...nuevoManual, nombre_paciente: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Motivo *</label>
                <input
                  type="text"
                  value={nuevoManual.motivo}
                  onChange={(e) => setNuevoManual({ ...nuevoManual, motivo: e.target.value })}
                  placeholder="Ej: Llamar para resultado de analítica"
                  required
                />
              </div>
              <div className="form-group">
                <label>Fecha *</label>
                <input
                  type="date"
                  value={nuevoManual.fecha_prevista}
                  onChange={(e) => setNuevoManual({ ...nuevoManual, fecha_prevista: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="button" onClick={crearManual} className="calculate-button">💾 Guardar recordatorio</button>
          </div>
        )}

        {errorMessage && <div className="info-box red" style={{ marginTop: '10px' }}>{errorMessage}</div>}
      </div>

      {isLoading ? (
        <div className="bloque"><div className="info-box">🔄 Cargando agenda...</div></div>
      ) : recordatorios.length === 0 ? (
        <div className="bloque"><div className="info-box">📘 No hay recordatorios en la agenda todavía.</div></div>
      ) : (
        <>
          {renderGrupo('Vencidos', '🔴', grupos.vencidos, 'agenda-vencido')}
          {renderGrupo('Próximos 7 días', '🟡', grupos.proximos7, 'agenda-proximo7')}
          {renderGrupo('Próximos 30 días', '🔵', grupos.proximos30, 'agenda-proximo30')}
          {renderGrupo('Futuros', '⚪', grupos.futuros, 'agenda-futuro')}
          {mostrarCompletados && renderGrupo('Completados / Descartados', '✅', grupos.completados, 'agenda-completado')}
        </>
      )}
    </div>
  );
};

export default AgendaForm;
