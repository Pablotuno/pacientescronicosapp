import React, { useState, useRef } from 'react';
import './DiabetesForm.css';

const DiabetesForm = ({ formData, setFormData, handleInputChange, calcularRecordatorios }) => {
  const [piesExpanded, setPiesExpanded] = useState(false);
  const [neuropatiaExpanded, setNeuropatiaExpanded] = useState(false);
  const [showNeuropatiaTooltip, setShowNeuropatiaTooltip] = useState(false);
  const neuropatiaTooltipTimeoutRef = useRef(null);
  const [diabetesExpanded, setDiabetesExpanded] = useState(false); // Estado para el bloque de Diabetes

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const formatFechaInput = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    let formatted = cleaned;
    if (cleaned.length >= 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length >= 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    return formatted.slice(0, 10);
  };

  const handleDateFormat = (e) => {
    const { name, value } = e.target;
    const formattedValue = formatFechaInput(value);
    setFormData({ ...formData, [name]: formattedValue });
  };

  const scrollToITB = () => {
    const itbSection = document.querySelector('.secondary-tab:last-child');
    if (itbSection) {
      itbSection.click();
      setTimeout(() => {
        const itbContent = document.querySelector('.tab-content.active');
        if (itbContent) {
          itbContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const scrollToECG = () => {
    const ecgSection = document.querySelector('.secondary-tab:first-child');
    if (ecgSection) {
      ecgSection.click();
      setTimeout(() => {
        const ecgContent = document.querySelector('.tab-content.active');
        if (ecgContent) {
          ecgContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  const handleNeuropatiaMouseEnter = () => {
    if (neuropatiaTooltipTimeoutRef.current) {
      clearTimeout(neuropatiaTooltipTimeoutRef.current);
    }
    setShowNeuropatiaTooltip(true);
  };

  const handleNeuropatiaMouseLeave = () => {
    neuropatiaTooltipTimeoutRef.current = setTimeout(() => {
      setShowNeuropatiaTooltip(false);
    }, 1500);
  };

  const handleNeuropatiaTooltipMouseEnter = () => {
    if (neuropatiaTooltipTimeoutRef.current) {
      clearTimeout(neuropatiaTooltipTimeoutRef.current);
    }
  };

  const handleNeuropatiaTooltipMouseLeave = () => {
    neuropatiaTooltipTimeoutRef.current = setTimeout(() => {
      setShowNeuropatiaTooltip(false);
    }, 1500);
  };

  const getNeuropatiaRecommendations = () => {
    const sensibilidades = [
      formData.sensibilidad_tactil,
      formData.sensibilidad_dolorosa,
      formData.sensibilidad_termica,
      formData.sensibilidad_palestesica,
      formData.sensibilidad_barestesica
    ];
    const hasPerdida = sensibilidades.some(s => s === 'disminuida' || s === 'ausente');
    const isIncomplete = formData.revision_pies && sensibilidades.some(s => !s);

    const recommendations = [];
    if (isIncomplete) {
      recommendations.push('⚠️ Complete todos los campos de sensibilidad para una evaluación completa.');
    }
    if (hasPerdida) {
      recommendations.push('⚠️ Pérdida sensitiva detectada. Derivar a neurología para evaluación adicional.');
      recommendations.push('✔️ Considerar educación al paciente sobre cuidado de pies para prevenir úlceras.');
      recommendations.push('✔️ Monitorizar semestralmente para detectar progresión.');
    } else if (sensibilidades.every(s => s === 'conservada')) {
      recommendations.push('🟢 Sensibilidad normal. Continuar monitoreo anual.');
    }
    return recommendations.length > 0 ? recommendations : ['📘 Sin hallazgos significativos.'];
  };

  // Filtrar recordatorios relevantes para Diabetes
  const recordatoriosDiabetes = calcularRecordatorios().filter(
    (recordatorio) =>
      recordatorio.mensaje.includes('Retinografía') ||
      recordatorio.mensaje.includes('Revisión de pies')
  );

  return (
    <div className="bloque">
      <button
        type="button"
        onClick={() => setDiabetesExpanded(!diabetesExpanded)}
        className="patologia-toggle-btn"
      >
        <span className="section-header">🩸 Evaluaciones específicas para pacientes con Diabetes Mellitus</span>
        <span>{diabetesExpanded ? '▲' : '▼'}</span>
      </button>
      {diabetesExpanded && (
        <div className="patologia-expanded">
          {/* Recordatorios */}
          {recordatoriosDiabetes.length > 0 && (
            <div className="analitica-grupo">
              <div className="section-subheader">🔔 Recordatorios</div>
              <div className="info-box">
                {recordatoriosDiabetes.map((recordatorio, index) => (
                  <div
                    key={index}
                    className={`recordatorio ${
                      recordatorio.tipo === 'vencido'
                        ? 'recordatorio-vencido'
                        : recordatorio.tipo === 'proximo'
                        ? 'recordatorio-proximo'
                        : 'recordatorio-pendiente'
                    }`}
                  >
                    {recordatorio.mensaje}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ECG */}
          <div className="analitica-grupo">
            <div className="section-subheader">
              🩺 ECG
              <span style={{ fontWeight: 'normal', fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                (cada 2 años)
              </span>
            </div>
            <div className="form-row" style={{ marginBottom: '4px' }}>
              <div className="diabetes-inline">
                <label htmlFor="ecg_fecha_dm">Fecha</label>
                <input
                  type="text"
                  id="ecg_fecha_dm"
                  name="ecg_fecha"
                  value={formData.ecg_fecha || ''}
                  readOnly
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="tooltip-container button-tooltip">
                  <button
                    type="button"
                    onClick={scrollToECG}
                    className="nuevo-ecg-btn"
                  >
                    Nuevo ECG
                  </button>
                  <div className="tooltip-content">
                    Editar datos del ECG en la pestaña de Pruebas Complementarias
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row" style={{ marginTop: '0px', marginBottom: '8px' }}>
              <div className="form-group" style={{ marginTop: '0px' }}>
                <label htmlFor="ecg_obs_dm" style={{ fontSize: '12px', fontWeight: '500', marginBottom: '3px', display: 'block' }}>
                  Observaciones
                </label>
                <textarea
                  id="ecg_obs_dm"
                  name="ecg_obs"
                  value={formData.ecg_obs || ''}
                  readOnly
                  placeholder="Las observaciones se editan en Pruebas Complementarias"
                  className="diabetes-textarea-full"
                  style={{ backgroundColor: '#f8f9fa', color: '#666' }}
                />
              </div>
            </div>
            <div className="diabetes-checkboxes">
              <label>
                <input
                  type="checkbox"
                  name="solicita_ecg"
                  checked={formData.solicita_ecg || false}
                  onChange={handleCheckboxChange}
                />
                Solicita ECG
              </label>
              <label>
                <input
                  type="checkbox"
                  name="realiza_ecg"
                  checked={formData.realiza_ecg || false}
                  onChange={handleCheckboxChange}
                />
                Realiza ECG
              </label>
            </div>
          </div>

          {/* ITB */}
          <div className="analitica-grupo">
            <div className="section-subheader">
              🔍 Índice Tobillo-Brazo
              <span style={{ fontWeight: 'normal', fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                (cada 1-2 años)
              </span>
            </div>
            <div className="form-row">
              <div className="diabetes-inline">
                <label htmlFor="itb_fecha_dm">Fecha</label>
                <input
                  type="text"
                  id="itb_fecha_dm"
                  name="itb_fecha"
                  value={formData.itb_fecha || ''}
                  readOnly
                  placeholder="DD/MM/AAAA"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="tooltip-container button-tooltip">
                  <button
                    type="button"
                    onClick={scrollToITB}
                    className="nuevo-itb-btn"
                  >
                    Nuevo ITB
                  </button>
                  <div className="tooltip-content">
                    Editar datos del ITB en la pestaña de Pruebas Complementarias
                  </div>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="diabetes-inline">
                <label htmlFor="itb_pie_izquierdo_dm">ITB Izdo</label>
                <input
                  type="number"
                  id="itb_pie_izquierdo_dm"
                  value={formData.itb_pie_izquierdo || ''}
                  readOnly
                  step="0.01"
                />
              </div>
              <div className="diabetes-inline">
                <label htmlFor="itb_pie_derecho_dm">ITB Dcho</label>
                <input
                  type="number"
                  id="itb_pie_derecho_dm"
                  value={formData.itb_pie_derecho || ''}
                  readOnly
                  step="0.01"
                />
              </div>
            </div>
            <div className="diabetes-checkboxes">
              <label>
                <input
                  type="checkbox"
                  name="solicita_itb"
                  checked={formData.solicita_itb || false}
                  onChange={handleCheckboxChange}
                />
                Solicita ITB
              </label>
              <label>
                <input
                  type="checkbox"
                  name="realiza_itb"
                  checked={formData.realiza_itb || false}
                  onChange={handleCheckboxChange}
                />
                Realiza ITB
              </label>
            </div>
          </div>

          {/* Revisión de pies */}
          <div className="analitica-grupo">
            <div className="section-subheader">
              🦶 Revisión de pies
              <span style={{ fontWeight: 'normal', fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                (semestral/anual)
              </span>
            </div>
            <div className="form-row">
              <div className="diabetes-inline">
                <label htmlFor="pies_fecha">Fecha</label>
                <input
                  type="text"
                  id="pies_fecha"
                  name="pies_fecha"
                  value={formData.pies_fecha || ''}
                  onChange={handleDateFormat}
                  placeholder="DD/MM/AAAA"
                  maxLength="10"
                />
              </div>
              <div className="diabetes-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    name="revision_pies"
                    checked={formData.revision_pies || false}
                    onChange={handleCheckboxChange}
                  />
                  Revisión realizada
                </label>
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setPiesExpanded(!piesExpanded)}
                className="patologia-toggle-btn"
              >
                <span>🔍 Exploración detallada de miembros inferiores</span>
                <span>{piesExpanded ? '▲' : '▼'}</span>
              </button>
            </div>

            {piesExpanded && (
              <div className="patologia-expanded">
                <div className="pies-content">
                  <div className="pies-item">
                    <div className="pies-title">👁️ Estado de la piel</div>
                    <div className="pies-checkboxes">
                      <label>
                        <input
                          type="checkbox"
                          name="pies_grietas"
                          checked={formData.pies_grietas || false}
                          onChange={handleCheckboxChange}
                        />
                        Grietas
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="pies_fisuras"
                          checked={formData.pies_fisuras || false}
                          onChange={handleCheckboxChange}
                        />
                        Fisuras
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          name="pies_piel_deshidratada"
                          checked={formData.pies_piel_deshidratada || false}
                          onChange={handleCheckboxChange}
                        />
                        Piel deshidratada
                      </label>
                    </div>
                    <div className="pies-help">☛ Aumentan el riesgo de lesión e infección</div>
                  </div>

                  <div className="pies-item">
                    <div className="pies-title">👁️ Coloración de la pierna</div>
                    <select
                      name="pies_coloracion"
                      value={formData.pies_coloracion || ''}
                      onChange={handleSelectChange}
                      className="pies-select"
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="normal">Normal</option>
                      <option value="palida">Pálida</option>
                      <option value="cianotica">Cianótica</option>
                    </select>
                    <div className="pies-help">☛ Sugiere compromiso vascular</div>

                    <div className="pies-title" style={{ marginTop: '10px' }}>👁️ Temperatura cutánea</div>
                    <select
                      name="pies_temperatura"
                      value={formData.pies_temperatura || ''}
                      onChange={handleSelectChange}
                      className="pies-select"
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="caliente">Caliente</option>
                      <option value="fria">Fría</option>
                    </select>
                    <div className="pies-help">☛ Fría: isquemia / Caliente: celulitis</div>
                  </div>

                  <div className="pies-item">
                    <div className="pies-title">👁️ Presencia de vello</div>
                    <select
                      name="pies_vello"
                      value={formData.pies_vello || ''}
                      onChange={handleSelectChange}
                      className="pies-select"
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="conservado">Conservado</option>
                      <option value="disminuido_ausente">Disminuido o ausente</option>
                    </select>
                    <div className="pies-help">☛ Ausencia puede indicar isquemia crónica</div>
                  </div>

                  <div className="pies-item">
                    <div className="pies-title">👁️ Pulsos periféricos</div>
                    <div className="pies-grid">
                      <div className="pies-grid-item">
                        <label>Pedio:</label>
                        <select
                          name="pies_pulso_pedio"
                          value={formData.pies_pulso_pedio || ''}
                          onChange={handleSelectChange}
                          className="pies-select"
                        >
                          <option value="">--</option>
                          <option value="presente">Presente</option>
                          <option value="disminuido">Disminuido</option>
                          <option value="ausente">Ausente</option>
                        </select>
                      </div>
                      <div className="pies-grid-item">
                        <label>Tibial posterior:</label>
                        <select
                          name="pies_pulso_tibial"
                          value={formData.pies_pulso_tibial || ''}
                          onChange={handleSelectChange}
                          className="pies-select"
                        >
                          <option value="">--</option>
                          <option value="presente">Presente</option>
                          <option value="disminuido">Disminuido</option>
                          <option value="ausente">Ausente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="pies-item">
                    <div className="pies-title">👁️ Arañas vasculares</div>
                    <div className="pies-checkboxes">
                      <label>
                        <input
                          type="checkbox"
                          name="pies_arañas_vasculares"
                          checked={formData.pies_arañas_vasculares || false}
                          onChange={handleCheckboxChange}
                        />
                        Presentes
                      </label>
                    </div>
                  </div>

                  <div className="pies-item-full">
                    <div className="pies-title">👁️ Estado de las uñas</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '500', display: 'block', marginBottom: '3px', color: '#003049' }}>
                          Corte:
                        </label>
                        <select
                          name="pies_uñas_corte"
                          value={formData.pies_uñas_corte || ''}
                          onChange={handleSelectChange}
                          className="pies-select"
                        >
                          <option value="">--</option>
                          <option value="recto">Recto</option>
                          <option value="mal_cortadas">Mal cortadas</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '500', display: 'block', marginBottom: '3px', color: '#003049' }}>
                          Coloración:
                        </label>
                        <select
                          name="pies_uñas_coloracion"
                          value={formData.pies_uñas_coloracion || ''}
                          onChange={handleSelectChange}
                          className="pies-select"
                        >
                          <option value="">--</option>
                          <option value="normal">Normal</option>
                          <option value="amarillento">Amarillento</option>
                          <option value="marron">Marrón</option>
                          <option value="negro">Negro</option>
                          <option value="purpura">Púrpura</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '500', display: 'block', marginBottom: '3px', color: '#003049' }}>
                          Grosor/forma:
                        </label>
                        <select
                          name="pies_uñas_grosor"
                          value={formData.pies_uñas_grosor || ''}
                          onChange={handleSelectChange}
                          className="pies-select"
                        >
                          <option value="">--</option>
                          <option value="normal">Normal</option>
                          <option value="engrosadas">Engrosadas</option>
                          <option value="garra_teja">En garra</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: '500', display: 'block', marginBottom: '3px', color: '#003049' }}>
                          Dolor/sensibilidad:
                        </label>
                        <select
                          name="pies_uñas_sensibilidad"
                          value={formData.pies_uñas_sensibilidad || ''}
                          onChange={handleSelectChange}
                          className="pies-select"
                        >
                          <option value="">--</option>
                          <option value="dolor_presente">Dolor presente</option>
                          <option value="ausencia_sensibilidad">Sin sensibilidad</option>
                        </select>
                      </div>
                    </div>
                    <div className="pies-help" style={{ marginTop: '4px' }}>☛ Riesgo de presión y úlceras</div>
                  </div>

                  <div className="pies-item">
                    <div className="pies-title">👁️ Calzado adecuado</div>
                    <div className="pies-checkboxes">
                      <label>
                        <input
                          type="checkbox"
                          name="pies_calzado_adecuado"
                          checked={formData.pies_calzado_adecuado || false}
                          onChange={handleCheckboxChange}
                        />
                        Adecuado
                      </label>
                    </div>
                    <input
                      type="text"
                      name="pies_calzado_obs"
                      value={formData.pies_calzado_obs || ''}
                      onChange={handleInputChange}
                      className="pies-input"
                      placeholder="Observaciones calzado..."
                      style={{ marginTop: '6px' }}
                    />
                  </div>

                  <div className="pies-item">
                    <div className="pies-title">👁️ Úlcera vascular</div>
                    <div className="pies-checkboxes">
                      <label>
                        <input
                          type="checkbox"
                          name="pies_ulcera"
                          checked={formData.pies_ulcera || false}
                          onChange={handleCheckboxChange}
                        />
                        Presente
                      </label>
                    </div>
                    {formData.pies_ulcera && (
                      <div style={{ marginTop: '6px' }}>
                        <input
                          type="text"
                          name="pies_ulcera_tipo"
                          value={formData.pies_ulcera_tipo || ''}
                          onChange={handleInputChange}
                          className="pies-input"
                          placeholder="Tipo de úlcera..."
                          style={{ marginBottom: '6px' }}
                        />
                        <textarea
                          name="pies_ulcera_obs"
                          value={formData.pies_ulcera_obs || ''}
                          onChange={handleInputChange}
                          className="pies-textarea"
                          placeholder="Descripción úlcera..."
                        />
                      </div>
                    )}
                  </div>

                  <div className="pies-full-span">
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setNeuropatiaExpanded(!neuropatiaExpanded)}
                        className="patologia-toggle-btn"
                      >
                        <span>Exploración neuropatía sensitiva</span>
                        <span>{neuropatiaExpanded ? '▲' : '▼'}</span>
                      </button>
                    </div>
                    {neuropatiaExpanded && (
                      <div className="patologia-expanded">
                        <div className="tooltip-container wide" style={{ marginBottom: '12px' }}
                             onMouseEnter={handleNeuropatiaMouseEnter}
                             onMouseLeave={handleNeuropatiaMouseLeave}>
                          <span className="tooltip-trigger">🧠 Info Neuropatía</span>
                          {showNeuropatiaTooltip && (
                            <div className="tooltip-content"
                                 onMouseEnter={handleNeuropatiaTooltipMouseEnter}
                                 onMouseLeave={handleNeuropatiaTooltipMouseLeave}>
                              🧠 Guía para Evaluación de Neuropatía Sensitiva:<br />
                              - <strong>Táctil:</strong> Usar monofilamento 10g en 10 puntos del pie (planta, talón, dedos). Presión hasta doblar el filamento.<br />
                              - <strong>Dolorosa:</strong> Aplicar pinchazo suave con aguja estéril o instrumento romo en regiones plantares.<br />
                              - <strong>Térmica:</strong> Usar objetos fríos (metal a 10°C) y calientes (40°C) en planta y dorso del pie.<br />
                              - <strong>Palestésica:</strong> Usar diapasón 128 Hz en maléolo y falange proximal del dedo gordo.<br />
                              - <strong>Barestésica:</strong> Aplicar presión manual en regiones plantares y dorsales.<br />
                              ⚠️ Registrar "disminuida" o "ausente" si hay pérdida parcial o total. Derivar a neurología si hay hallazgos anormales.
                            </div>
                          )}
                        </div>
                        <div className="pies-subseccion">
                          <div className="pies-title">Sensibilidad superficial</div>
                          <div className="pies-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <div className="pies-grid-item">
                              <label>Táctil (monofilamento):</label>
                              <select
                                name="sensibilidad_tactil"
                                value={formData.sensibilidad_tactil || ''}
                                onChange={handleSelectChange}
                                className={`pies-select ${formData.revision_pies && !formData.sensibilidad_tactil ? 'error' : ''}`}
                              >
                                <option value="">--</option>
                                <option value="conservada">Conservada</option>
                                <option value="disminuida">Disminuida</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              {formData.revision_pies && !formData.sensibilidad_tactil && (
                                <span className="error">⚠️ Campo requerido</span>
                              )}
                            </div>
                            <div className="pies-grid-item">
                              <label>Dolorosa (pinchazo):</label>
                              <select
                                name="sensibilidad_dolorosa"
                                value={formData.sensibilidad_dolorosa || ''}
                                onChange={handleSelectChange}
                                className={`pies-select ${formData.revision_pies && !formData.sensibilidad_dolorosa ? 'error' : ''}`}
                              >
                                <option value="">--</option>
                                <option value="conservada">Conservada</option>
                                <option value="disminuida">Disminuida</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              {formData.revision_pies && !formData.sensibilidad_dolorosa && (
                                <span className="error">⚠️ Campo requerido</span>
                              )}
                            </div>
                            <div className="pies-grid-item">
                              <label>Térmica:</label>
                              <select
                                name="sensibilidad_termica"
                                value={formData.sensibilidad_termica || ''}
                                onChange={handleSelectChange}
                                className={`pies-select ${formData.revision_pies && !formData.sensibilidad_termica ? 'error' : ''}`}
                              >
                                <option value="">--</option>
                                <option value="conservada">Conservada</option>
                                <option value="disminuida">Disminuida</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              {formData.revision_pies && !formData.sensibilidad_termica && (
                                <span className="error">⚠️ Campo requerido</span>
                              )}
                            </div>
                          </div>
                          <div className="pies-help">
                            ☛ Usar monofilamento 10g, prueba de pinchazo y objetos fríos/calientes.
                          </div>
                        </div>

                        <div className="pies-subseccion">
                          <div className="pies-title">Sensibilidad profunda</div>
                          <div className="pies-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div className="pies-grid-item">
                              <label>Palestésica (diapasón):</label>
                              <select
                                name="sensibilidad_palestesica"
                                value={formData.sensibilidad_palestesica || ''}
                                onChange={handleSelectChange}
                                className={`pies-select ${formData.revision_pies && !formData.sensibilidad_palestesica ? 'error' : ''}`}
                              >
                                <option value="">--</option>
                                <option value="conservada">Conservada</option>
                                <option value="disminuida">Disminuida</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              {formData.revision_pies && !formData.sensibilidad_palestesica && (
                                <span className="error">⚠️ Campo requerido</span>
                              )}
                            </div>
                            <div className="pies-grid-item">
                              <label>Barestésica (presión):</label>
                              <select
                                name="sensibilidad_barestesica"
                                value={formData.sensibilidad_barestesica || ''}
                                onChange={handleSelectChange}
                                className={`pies-select ${formData.revision_pies && !formData.sensibilidad_barestesica ? 'error' : ''}`}
                              >
                                <option value="">--</option>
                                <option value="conservada">Conservada</option>
                                <option value="disminuida">Disminuida</option>
                                <option value="ausente">Ausente</option>
                              </select>
                              {formData.revision_pies && !formData.sensibilidad_barestesica && (
                                <span className="error">⚠️ Campo requerido</span>
                              )}
                            </div>
                          </div>
                          <div className="pies-help">
                            ☛ Usar diapasón 128 Hz y presión manual para evaluar.
                          </div>
                        </div>

                        <div className="pies-subseccion">
                          <div className="pies-title">Observaciones neuropatía</div>
                          <textarea
                            name="sensibilidad_observaciones"
                            value={formData.sensibilidad_observaciones || ''}
                            onChange={handleInputChange}
                            className="pies-textarea"
                            style={{ width: '98%' }}
                            placeholder="Ej: Pérdida sensitiva en región plantar, test monofilamento 10g positivo..."
                          />
                        </div>

                        <div className="info-box">
                          {getNeuropatiaRecommendations().map((rec, index) => (
                            <div key={index}>{rec}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pies-item-full">
                    <div className="pies-title">📝 Observaciones Generales</div>
                    <textarea
                      name="pies_obs"
                      value={formData.pies_obs || ''}
                      onChange={handleInputChange}
                      className="pies-textarea"
                      style={{ width: '98%' }}
                      placeholder="Observaciones generales sobre exploración de pies..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Retinografía */}
          <div className="analitica-grupo">
            <div className="section-subheader">
              👁️ Retinografía
              <span style={{ fontWeight: 'normal', fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                (cada 2 años)
              </span>
            </div>
            <div className="form-row">
              <div className="diabetes-inline">
                <label htmlFor="retinografia_fecha">Fecha</label>
                <input
                  type="text"
                  id="retinografia_fecha"
                  name="retinografia_fecha"
                  value={formData.retinografia_fecha || ''}
                  onChange={handleDateFormat}
                  placeholder="DD/MM/AAAA"
                  maxLength="10"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="retinografia_obs" style={{ fontSize: '12px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>
                  Observaciones
                </label>
                <textarea
                  id="retinografia_obs"
                  name="retinografia_obs"
                  value={formData.retinografia_obs || ''}
                  onChange={handleInputChange}
                  placeholder="Descripción detallada de la retinografía..."
                  className="diabetes-textarea-full"
                />
              </div>
            </div>
            <div className="diabetes-checkboxes">
              <label>
                <input
                  type="checkbox"
                  name="solicita_retinografia"
                  checked={formData.solicita_retinografia || false}
                  onChange={handleCheckboxChange}
                />
                Solicita retinografía
              </label>
              <label>
                <input
                  type="checkbox"
                  name="realiza_retinografia"
                  checked={formData.realiza_retinografia || false}
                  onChange={handleCheckboxChange}
                />
                Realiza retinografía
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiabetesForm;