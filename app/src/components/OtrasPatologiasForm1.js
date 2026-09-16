import React, { useState, useCallback } from 'react';
import './OtrasPatologiasForm.css';

const OtrasPatologiasForm1 = ({ formData, setFormData, handleInputChange, calcularRecordatorios }) => {
  const [espirometriaExpanded, setEspirometriaExpanded] = useState(false);
  const [epocAsmaExpanded, setEpocAsmaExpanded] = useState(false);
  const [ercExpanded, setErcExpanded] = useState(false);
  const [iccExpanded, setIccExpanded] = useState(false);

  // Helper para validar y parsear números
  const parseNumericValue = useCallback((value, min = 0, max = 1000) => {
    if (!value) return null;
    const stringValue = String(value).trim();
    if (stringValue === '') return null;
    const parsed = parseFloat(stringValue);
    if (isNaN(parsed) || parsed < min || parsed > max) return null;
    return parsed;
  }, []);

  // Helper para formatear fechas
  const formatFechaInput = useCallback((value) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) return '';
    let formatted = cleaned;
    if (cleaned.length >= 2) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length >= 4) formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4) + '/' + cleaned.slice(4, 8);
    return formatted.slice(0, 10);
  }, []);

  const handleDateFormat = useCallback((e) => {
    const { name, value } = e.target;
    const formattedValue = formatFechaInput(value);
    setFormData({ ...formData, [name]: formattedValue });
  }, [formData, setFormData, formatFechaInput]);

  // Manejar checkboxes - ARREGLADO
  const handleCheckboxChange = useCallback((e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  }, [formData, setFormData]);

  // Calcular FEV1/FVC
  const calcularFEV1FVC = useCallback(() => {
    const fev1 = parseNumericValue(formData.espirometria_fev1, 0, 10);
    const fvc = parseNumericValue(formData.espirometria_fvc, 0, 10);
    
    if (fev1 && fvc && fvc > 0) {
      const ratio = ((fev1 / fvc) * 100).toFixed(1);
      setFormData({ ...formData, espirometria_fev1_fvc: ratio });
    } else {
      setFormData({ ...formData, espirometria_fev1_fvc: '' });
    }
  }, [formData, setFormData, parseNumericValue]);

  // Función de clases de input
  const getInputClass = useCallback((field, value) => {
    const num = parseNumericValue(value);
    if (num === null) return '';
    
    const thresholds = {
      sato2: { green: 95, yellow: 90 },
      espirometria_fev1_fvc: { green: 70, yellow: 50 }
    };
    
    const threshold = thresholds[field];
    if (!threshold) return '';
    
    if (num >= threshold.green) return 'green';
    if (num >= threshold.yellow) return 'yellow';
    return 'red';
  }, [parseNumericValue]);

  // Función para información ICC - CORREGIDA CON TODAS LAS VISITAS
  const getIccInfoContent = useCallback((tipoVisita) => {
    switch (tipoVisita) {
      case '1':
        return {
          title: '🔍 Qué hacer en la 1ª visita tras alta:',
          content: [
            '• Medir constantes vitales y peso.',
            '• Aplicar escalas: Barthel, Lawton, MNA.',
            '• Revisar tratamiento prescrito.',
            '• Detectar signos y síntomas de alarma.',
            '• Identificar cuidador principal.',
            '• Entregar guía de autocuidados.',
            '• Solicitar analítica y ECG si no disponibles.',
            '• Citar siguiente revisión.'
          ]
        };
      case '2':
        return {
          title: '📞 Qué hacer en la 2ª visita telefónica (15 días):',
          content: [
            '• Comprobar si hay signos de descompensación.',
            '• Valorar síntomas nuevos o persistentes.',
            '• Revisión de resultados de analítica/ECG.',
            '• Reforzar autocuidados y adherencia al tratamiento.',
            '• Programar próxima visita presencial.'
          ]
        };
      case '3':
        return {
          title: '👥 Qué hacer en la 3ª visita presencial (4 semanas):',
          content: [
            '• Reevaluar signos vitales y situación clínica.',
            '• Aplicar escalas emocionales: Goldberg, Zarit.',
            '• Ajustar plan de cuidados si es necesario.',
            '• Determinar la frecuencia de seguimientos futuros.',
            '• Registrar nueva fecha de control.'
          ]
        };
      case 'seguimiento':
        return {
          title: '📆 Qué hacer en visitas de seguimiento:',
          content: [
            '• Valorar estado clínico y aparición de signos de alarma.',
            '• Vigilar adherencia al tratamiento y autocuidados.',
            '• Reforzar educación sanitaria y hábitos de vida.',
            '• Revisar medicación, analíticas y coordinación con UIC/MIN.',
            '• Registrar fecha de próxima cita.'
          ]
        };
      case 'descompensacion':
        return {
          title: '🚨 Qué hacer en descompensación/urgente:',
          content: [
            '• Evaluar signos de congestión inmediatamente.',
            '• Revisar factores desencadenantes.',
            '• Optimizar tratamiento diurético urgente.',
            '• Considerar derivación inmediata a Cardiología.',
            '• Seguimiento estrecho en 3-7 días.'
          ]
        };
      default:
        return { title: '', content: [] };
    }
  }, []);

  // Función para calcular diagnóstico de ERC
  const getIRCDiagnosis = useCallback(() => {
    const fg = parseFloat(formData.fg);
    const creatinina = parseFloat(formData.creatinina);
    const microalbumina = parseFloat(formData.microalbumina);
    let estadioText = '';
    const recommendations = [];

    if (isNaN(fg)) {
      return { diagnosis: '⚠️ Introduce FG para diagnóstico de ERC.', recommendations: [] };
    }

    if (fg >= 90) {
      estadioText = 'G1 (≥90 ml/min) – normal';
    } else if (fg >= 60) {
      estadioText = 'G2 (60–89 ml/min) – Disminución leve';
    } else if (fg >= 45) {
      estadioText = 'G3a (45–59 ml/min)';
    } else if (fg >= 30) {
      estadioText = 'G3b (30–44 ml/min)';
    } else if (fg >= 15) {
      estadioText = 'G4 (15–29 ml/min)';
    } else {
      estadioText = 'G5 (<15 ml/min) – fallo renal terminal';
    }

    if (fg >= 90 && (isNaN(creatinina) || creatinina <= 2) && (isNaN(microalbumina) || microalbumina <= 30)) {
      return { diagnosis: '📘 Función renal normal (FG ≥90 ml/min). No se requiere intervención específica.', recommendations: [] };
    }

    if (fg >= 60 && fg < 90 && (isNaN(creatinina) || creatinina <= 2) && (isNaN(microalbumina) || microalbumina <= 30)) {
      recommendations.push('⚠️ Disminución leve de FG, monitorizar función renal anualmente.');
    }

    if (!isNaN(creatinina) && creatinina > 2 && creatinina <= 2.5) {
      recommendations.push('⚠️ Creatinina elevada, monitorizar función renal anualmente.');
    } else if (!isNaN(creatinina) && creatinina > 2.5) {
      recommendations.push('⚠️ Creatinina elevada, valorar posible daño renal con nefrología.');
    }

    if (!isNaN(microalbumina) && microalbumina > 30) {
      recommendations.push('⚠️ Microalbuminuria mayor 30 mg/g confirmada → valorar posible ERC con repetición.');
    }

    if (fg < 60 || (!isNaN(microalbumina) && microalbumina > 30) || (!isNaN(creatinina) && creatinina > 2.5)) {
      if (fg >= 45) {
        recommendations.push('✔️ Control semestral (G3a)');
      } else {
        recommendations.push('✔️ Control trimestral + valorar nefro (G3b–G5)');
      }
      recommendations.push('✔️ Dieta baja en proteínas (~0.8 g/kg/día) y sodio menor 2g/día');
      recommendations.push('✔️ TA objetivo menor 130/80 mmHg');
      recommendations.push('✔️ Hidratación adecuada');
      recommendations.push('✔️ Evitar AINEs y fármacos nefrotóxicos');
    }

    return { diagnosis: `📘 Estadio ${estadioText}`, recommendations };
  }, [formData.fg, formData.creatinina, formData.microalbumina]);

  // Función para diagnóstico de espirometría
  const getEspirometriaRecommendations = useCallback(() => {
    const recommendations = [];
    const fev1fvc = parseFloat(formData.espirometria_fev1_fvc);
    const sato2 = parseFloat(formData.sato2);
    const exacerbaciones = parseInt(formData.exacerbaciones_ultimo_ano);
    const controlAsma = formData.control_asma;
    const inhaladores = formData.inhaladores;
    const camara = formData.camara;
    const espirometriaFecha = formData.espirometria_fecha;

    // Interpretación espirométrica
    if (!isNaN(fev1fvc)) {
      if (fev1fvc >= 70) {
        recommendations.push('🟢 FEV1/FVC ≥70%: Función pulmonar normal.');
      } else if (fev1fvc >= 50) {
        recommendations.push('🟡 FEV1/FVC 50-70%: Obstrucción leve-moderada.');
        recommendations.push('✔️ Optimizar tratamiento broncodilatador.');
      } else {
        recommendations.push('🔴 FEV1/FVC menor 50%: Obstrucción severa.');
        recommendations.push('✔️ Considerar derivación a neumología.');
      }
    }

    // Saturación
    if (!isNaN(sato2)) {
      if (sato2 < 88) {
        recommendations.push('🔴 SatO2 menor 88%: Hipoxemia severa. Considerar oxigenoterapia.');
      } else if (sato2 < 92) {
        recommendations.push('🟡 SatO2 88-92%: Hipoxemia moderada.');
      } else if (sato2 < 95) {
        recommendations.push('🟡 SatO2 92-95%: Hipoxemia leve.');
      } else {
        recommendations.push('🟢 SatO2 ≥95%: Saturación adecuada.');
      }
    }

    // Exacerbaciones
    if (!isNaN(exacerbaciones)) {
      if (exacerbaciones >= 2) {
        recommendations.push('🔴 ≥2 exacerbaciones/año: Alto riesgo. Intensificar tratamiento.');
      } else if (exacerbaciones === 1) {
        recommendations.push('🟡 1 exacerbación/año: Riesgo moderado.');
      } else {
        recommendations.push('🟢 Sin exacerbaciones en el último año.');
      }
    }

    // Control del asma
    if (controlAsma) {
      if (controlAsma === 'Mal controlado') {
        recommendations.push('🔴 Asma mal controlado: Revisar técnica inhalatoria y adherencia.');
      } else if (controlAsma === 'Parcialmente controlado') {
        recommendations.push('🟡 Asma parcialmente controlado: Optimizar tratamiento.');
      } else {
        recommendations.push('🟢 Asma bien controlado.');
      }
    }

    // Técnica inhalatoria
    if (inhaladores === 'Sí' && camara === 'No') {
      recommendations.push('⚠️ Recomendar cámara espaciadora para mejorar técnica inhalatoria.');
    }

    // Espirometría
    if (!espirometriaFecha) {
      recommendations.push('⚠️ Realizar espirometría para evaluación funcional.');
    }

    // Recomendaciones generales
    recommendations.push('✔️ Revisar técnica inhalatoria en cada visita.');
    recommendations.push('✔️ Vacunación antigripal anual y antineumocócica.');
    recommendations.push('✔️ Ejercicio físico adaptado.');

    return recommendations.length > 0 ? recommendations : ['📘 Sin hallazgos significativos.'];
  }, [
    formData.espirometria_fev1_fvc, formData.sato2, formData.exacerbaciones_ultimo_ano,
    formData.control_asma, formData.inhaladores, formData.camara, formData.espirometria_fecha
  ]);

  // Filtrar recordatorios relevantes
  const recordatoriosPatologias = calcularRecordatorios().filter(
    (recordatorio) => 
      recordatorio.mensaje.includes('Espirometría')
  );

  return (
    <div className="otras-patologias-form">
      
      {/* EPOC/ASMA */}
      {(formData.epoc || formData.asma) && (
        <div className="bloque">
          <button
            type="button"
            onClick={() => setEpocAsmaExpanded(!epocAsmaExpanded)}
            className="patologia-toggle-btn"
          >
            <span className="section-header">
              {formData.epoc && formData.asma ? '🌬️Seguimiento de pacientes con EPOC y Asma' :
               formData.epoc ? '🌬️Seguimiento de pacientes con EPOC' :
               '🌬️ Seguimiento de pacientes con Asma'}
            </span>
            <span>{epocAsmaExpanded ? '▲' : '▼'}</span>
          </button>
          {epocAsmaExpanded && (
            <div className="patologia-expanded">
              {/* Recordatorios */}
              {recordatoriosPatologias.length > 0 && (
                <div className="analitica-grupo">
                  <div className="section-subheader">🔔 Recordatorios</div>
                  <div className="info-box">
                    {recordatoriosPatologias.map((recordatorio, index) => (
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

              {/* Seguimiento básico */}
              <div className="analitica-grupo">
                <div className="section-subheader">🔍 Exploración y seguimiento</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="sato2">SatO₂ (%)</label>
                    <input
                      type="number"
                      id="sato2"
                      name="sato2"
                      value={formData.sato2 || ''}
                      onChange={handleInputChange}
                      min="60"
                      max="100"
                      step="1"
                      className={getInputClass('sato2', formData.sato2)}
                    />
                    <span className="normal-range">≥95%</span>
                  </div>
                  
                  <div className="patologia-inline">
                    <label htmlFor="peak_flow">Peak Flow (L/min)</label>
                    <input
                      type="number"
                      id="peak_flow"
                      name="peak_flow"
                      value={formData.peak_flow || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="1000"
                      step="1"
                    />
                    <span className="normal-range">Variable</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="exacerbaciones_ultimo_ano">Exacerbaciones/año</label>
                    <input
                      type="number"
                      id="exacerbaciones_ultimo_ano"
                      name="exacerbaciones_ultimo_ano"
                      value={formData.exacerbaciones_ultimo_ano || ''}
                      onChange={handleInputChange}
                      min="0"
                      max="20"
                      step="1"
                    />
                    <span className="normal-range">0-1</span>
                  </div>
                  
                  {formData.asma && (
                    <div className="patologia-inline">
                      <label htmlFor="control_asma">Control asma</label>
                      <select
                        id="control_asma"
                        name="control_asma"
                        value={formData.control_asma || ''}
                        onChange={handleInputChange}
                      >
                        <option value="">--</option>
                        <option value="Bien controlado">Bien controlado</option>
                        <option value="Parcialmente controlado">Parcialmente controlado</option>
                        <option value="Mal controlado">Mal controlado</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Espirometría */}
              <div className="analitica-grupo">
                <div className="section-subheader">
                  📊 Espirometría
                  <span style={{ fontWeight: 'normal', fontSize: '11px', color: '#666', marginLeft: '8px' }}>
                    (anual)
                  </span>
                </div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="espirometria_fecha">Fecha</label>
                    <input
                      type="text"
                      id="espirometria_fecha"
                      name="espirometria_fecha"
                      value={formData.espirometria_fecha || ''}
                      onChange={handleDateFormat}
                      placeholder="DD/MM/AAAA"
                      maxLength="10"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEspirometriaExpanded(!espirometriaExpanded)}
                  className="patologia-toggle-btn"
                  style={{ marginTop: '10px', marginBottom: '10px' }}
                >
                  <span>📈 Valores espirométricos detallados</span>
                  <span>{espirometriaExpanded ? '▲' : '▼'}</span>
                </button>

                {espirometriaExpanded && (
                  <div className="patologia-expanded">
                    <div className="form-row">
                      <div className="patologia-inline">
                        <label htmlFor="espirometria_fev1">FEV₁ (L)</label>
                        <input
                          type="number"
                          id="espirometria_fev1"
                          name="espirometria_fev1"
                          value={formData.espirometria_fev1 || ''}
                          onChange={handleInputChange}
                          onBlur={calcularFEV1FVC}
                          step="0.01"
                          min="0"
                          max="6"
                        />
                        <span className="normal-range">≥2.5 L</span>
                      </div>
                      
                      <div className="patologia-inline">
                        <label htmlFor="espirometria_fvc">FVC (L)</label>
                        <input
                          type="number"
                          id="espirometria_fvc"
                          name="espirometria_fvc"
                          value={formData.espirometria_fvc || ''}
                          onChange={handleInputChange}
                          onBlur={calcularFEV1FVC}
                          step="0.01"
                          min="0"
                          max="8"
                        />
                        <span className="normal-range">≥3.0 L</span>
                      </div>
                    </div>
                    
                    <div className="form-row">
                      <div className="patologia-inline">
                        <label htmlFor="espirometria_fev1_fvc">FEV₁/FVC (%)</label>
                        <input
                          type="number"
                          id="espirometria_fev1_fvc"
                          name="espirometria_fev1_fvc"
                          value={formData.espirometria_fev1_fvc || ''}
                          readOnly
                          className={getInputClass('espirometria_fev1_fvc', formData.espirometria_fev1_fvc)}
                        />
                        <span className="normal-range">≥70%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="espirometria_obs">Observaciones espirometría</label>
                    <textarea
                      id="espirometria_obs"
                      name="espirometria_obs"
                      value={formData.espirometria_obs || ''}
                      onChange={handleInputChange}
                      placeholder="Interpretación de la espirometría..."
                      className="patologia-textarea-full"
                    />
                  </div>
                </div>
              </div>

              {/* Inhaladores */}
              <div className="analitica-grupo">
                <div className="section-subheader">💊 Inhaladores y técnica</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="inhaladores">Usa inhaladores</label>
                    <select
                      id="inhaladores"
                      name="inhaladores"
                      value={formData.inhaladores || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">--</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  <div className="patologia-inline">
                    <label htmlFor="camara">Cámara espaciadora</label>
                    <select
                      id="camara"
                      name="camara"
                      value={formData.camara || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">--</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="inhaladores_obs">Observaciones técnica inhalatoria</label>
                    <textarea
                      id="inhaladores_obs"
                      name="inhaladores_obs"
                      value={formData.inhaladores_obs || ''}
                      onChange={handleInputChange}
                      placeholder="Técnica correcta, errores observados, tipo de dispositivo..."
                      className="patologia-textarea-full"
                    />
                  </div>
                </div>
              </div>

              {/* Oxigenoterapia */}
              <div className="analitica-grupo">
                <div className="section-subheader">🫁 Oxigenoterapia</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="oxigeno_domiciliario">O₂ domiciliario</label>
                    <select
                      id="oxigeno_domiciliario"
                      name="oxigeno_domiciliario"
                      value={formData.oxigeno_domiciliario ? 'Sí' : formData.oxigeno_domiciliario === false ? 'No' : ''}
                      onChange={(e) => {
                        const value = e.target.value === 'Sí' ? true : e.target.value === 'No' ? false : null;
                        setFormData({ ...formData, oxigeno_domiciliario: value });
                      }}
                    >
                      <option value="">--</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  <div className="patologia-inline">
                    <label htmlFor="oxigeno_uso">Horas/día</label>
                    <input
                      type="text"
                      id="oxigeno_uso"
                      name="oxigeno_uso"
                      value={formData.oxigeno_uso || ''}
                      onChange={handleInputChange}
                      placeholder="16h/día"
                    />
                  </div>
                </div>
              </div>

              {/* Recomendaciones automáticas */}
              <div className="analitica-grupo">
                <div className="section-subheader">📋 Recomendaciones actuales</div>
                <div className="info-box">
                  {getEspirometriaRecommendations().map((rec, index) => (
                    <div key={index}>{rec}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ENFERMEDAD RENAL CRÓNICA (ERC) */}
      {formData.erc && (
        <div className="bloque">
          <button
            type="button"
            onClick={() => setErcExpanded(!ercExpanded)}
            className="patologia-toggle-btn"
          >
            <span className="section-header">🩸 Seguimiento de pacientes con Enfermedad Renal Crónica</span>
            <span>{ercExpanded ? '▲' : '▼'}</span>
          </button>
          {ercExpanded && (
            <div className="patologia-expanded">
              {/* Diagnóstico automático */}
              <div className="analitica-grupo">
                <div className="section-subheader">🔍 Diagnóstico y estadificación ERC</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="erc_tipo">Tipo de ERC</label>
                    <select
                      id="erc_tipo"
                      name="erc_tipo"
                      value={formData.erc_tipo || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="Diabética">Diabética</option>
                      <option value="Hipertensiva">Hipertensiva</option>
                      <option value="Poliquística">Poliquística</option>
                      <option value="Glomerular">Glomerular</option>
                      <option value="Intersticial">Intersticial</option>
                      <option value="Otras">Otras causas</option>
                    </select>
                  </div>
                  
                  <div className="patologia-inline">
                    <label htmlFor="erc_estadio_manual">Estadio manual</label>
                    <select
                      id="erc_estadio_manual"
                      name="erc_estadio_manual"
                      value={formData.erc_estadio_manual || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Auto (por FG)</option>
                      <option value="G1">G1</option>
                      <option value="G2">G2</option>
                      <option value="G3a">G3a</option>
                      <option value="G3b">G3b</option>
                      <option value="G4">G4</option>
                      <option value="G5">G5</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="erc_diagnosticado_por">Diagnosticado por</label>
                    <select
                      id="erc_diagnosticado_por"
                      name="erc_diagnosticado_por"
                      value={formData.erc_diagnosticado_por || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="Atención Primaria">Atención Primaria</option>
                      <option value="Nefrología">Nefrología</option>
                      <option value="Medicina Interna">Medicina Interna</option>
                      <option value="Endocrinología">Endocrinología</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                </div>

                {/* Diagnóstico automático */}
                <div className="info-box">
                  <div>{getIRCDiagnosis().diagnosis}</div>
                  {getIRCDiagnosis().recommendations.map((rec, index) => (
                    <div key={index}>{rec}</div>
                  ))}
                </div>
              </div>

              {/* Seguimiento */}
              <div className="analitica-grupo">
                <div className="section-subheader">🏥 Seguimiento y vacunas</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="irc_nefrologia">Seguimiento nefrología</label>
                    <select
                      id="irc_nefrologia"
                      name="irc_nefrologia"
                      value={formData.irc_nefrologia ? 'Sí' : formData.irc_nefrologia === false ? 'No' : ''}
                      onChange={(e) => {
                        const value = e.target.value === 'Sí' ? true : e.target.value === 'No' ? false : null;
                        setFormData({ ...formData, irc_nefrologia: value });
                      }}
                    >
                      <option value="">--</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="irc_vacuna_hb">Vacuna Hepatitis B</label>
                    <select
                      id="irc_vacuna_hb"
                      name="irc_vacuna_hb"
                      value={formData.irc_vacuna_hb ? 'Sí' : formData.irc_vacuna_hb === false ? 'No' : ''}
                      onChange={(e) => {
                        const value = e.target.value === 'Sí' ? true : e.target.value === 'No' ? false : null;
                        setFormData({ ...formData, irc_vacuna_hb: value });
                      }}
                    >
                      <option value="">--</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                  
                  <div className="patologia-inline">
                    <label htmlFor="irc_vacuna_neumo">Vacuna neumococo</label>
                    <select
                      id="irc_vacuna_neumo"
                      name="irc_vacuna_neumo"
                      value={formData.irc_vacuna_neumo ? 'Sí' : formData.irc_vacuna_neumo === false ? 'No' : ''}
                      onChange={(e) => {
                        const value = e.target.value === 'Sí' ? true : e.target.value === 'No' ? false : null;
                        setFormData({ ...formData, irc_vacuna_neumo: value });
                      }}
                    >
                      <option value="">--</option>
                      <option value="Sí">Sí</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dieta */}
              <div className="analitica-grupo">
                <div className="section-subheader">🍽️ Recomendaciones dietéticas</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="irc_dieta">Plan dietético personalizado</label>
                    <textarea
                      id="irc_dieta"
                      name="irc_dieta"
                      value={formData.irc_dieta || ''}
                      onChange={handleInputChange}
                      placeholder="Restricciones específicas de proteínas, sodio, fósforo, potasio según estadio..."
                      className="patologia-textarea-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* INSUFICIENCIA CARDIACA (ICC) - CORREGIDO CON TODAS LAS VISITAS */}
      {formData.icc && (
        <div className="bloque">
          <button
            type="button"
            onClick={() => setIccExpanded(!iccExpanded)}
            className="patologia-toggle-btn"
          >
            <span className="section-header">💗 Seguimiento de pacientes con Insuficiencia Cardiaca</span>
            <span>{iccExpanded ? '▲' : '▼'}</span>
          </button>
          {iccExpanded && (
            <div className="patologia-expanded">
              {/* Tipo de visita - CORREGIDO CON TODAS LAS OPCIONES */}
              <div className="analitica-grupo">
                <div className="section-subheader">📋 Tipo de visita ICC</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="icc_visita">Selecciona el tipo</label>
                    <select
                      id="icc_visita"
                      name="icc_visita"
                      value={formData.icc_visita || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">--</option>
                      <option value="1">1ª visita tras alta</option>
                      <option value="2">2ª visita telefónica (15 días)</option>
                      <option value="3">3ª visita presencial (4 semanas)</option>
                      <option value="seguimiento">Seguimiento posterior</option>
                      <option value="descompensacion">Descompensación/Urgente</option>
                    </select>
                  </div>
                </div>

                {formData.icc_visita && (
                  <div className="info-box" style={{ marginTop: '12px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#003049' }}>
                      {getIccInfoContent(formData.icc_visita).title}
                    </div>
                    {getIccInfoContent(formData.icc_visita).content.map((item, index) => (
                      <div key={index} style={{ marginBottom: '4px', lineHeight: '1.4' }}>{item}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Signos de alarma */}
              <div className="analitica-grupo">
                <div className="section-subheader">⚠️ Signos de alarma</div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="icc_signos_alarma">Descripción signos y síntomas</label>
                    <textarea
                      id="icc_signos_alarma"
                      name="icc_signos_alarma"
                      value={formData.icc_signos_alarma || ''}
                      onChange={handleInputChange}
                      placeholder="Disnea, ortopnea, edemas, fatiga, palpitaciones..."
                      className="patologia-textarea-full"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="icc-checkbox-group">
                    <label className="icc-checkbox-label">
                      <input
                        type="checkbox"
                        name="icc_sin_alarma"
                        checked={formData.icc_sin_alarma || false}
                        onChange={handleCheckboxChange}
                        className="icc-checkbox"
                      />
                      Sin signos de alarma en la actualidad
                    </label>
                  </div>
                </div>
              </div>

              {/* Próxima cita */}
              <div className="analitica-grupo">
                <div className="section-subheader">📅 Programación próxima cita</div>
                
                <div className="form-row">
                  <div className="patologia-inline">
                    <label htmlFor="icc_proxima_cita">Fecha próxima cita</label>
                    <input
                      type="text"
                      id="icc_proxima_cita"
                      name="icc_proxima_cita"
                      value={formData.icc_proxima_cita || ''}
                      onChange={handleDateFormat}
                      placeholder="DD/MM/AAAA"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="icc-info-content">
                <div className="icc-info-title">💡 Información adicional ICC</div>
                <div className="icc-info-list">
                  <div>🔴 <strong>Signos de alarma:</strong> disnea de reposo, ortopnea, edemas, ganancia de peso mayor 2kg en 3 días</div>
                  <div>✔️ <strong>Autocuidados:</strong> control de peso diario, restricción de sal, ejercicio adaptado</div>
                  <div>💊 <strong>Tratamiento:</strong> IECA/ARA II, betabloqueantes, diuréticos según indicación</div>
                  <div>🏥 <strong>Seguimiento:</strong> 1ª visita (7-14 días post-alta), luego cada 1-3 meses según estabilidad</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OtrasPatologiasForm1;