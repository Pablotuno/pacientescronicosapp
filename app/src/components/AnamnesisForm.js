import React, { useState, useRef } from 'react';
import './AnamnesisForm.css';

const AnamnesisForm = ({ formData, setFormData, handleInputChange, escalasFechaError, calcularRecordatorios }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef(null);
  const tooltipRef = useRef(null);

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 1500);
  };

  const handleTooltipMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
  };

  const handleTooltipMouseLeave = () => {
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 1500);
  };

  const mostrarAvisoCervix = () => {
    const sexo = formData.sexo;
    const edad = parseInt(formData.edad, 10);
    console.log('Renderizando aviso cérvix:', { sexo, edad });
    if (!sexo || isNaN(edad)) return { text: '⚠️ Falta introducir sexo y edad.', class: '' };
    if (sexo !== 'Mujer') return { text: 'ℹ️ Cribado de cérvix no aplicable.', class: 'info' };
    if (edad < 25) return { text: '🔴 No se recomienda cribado antes de los 25 años.', class: 'red' };
    if (edad < 30) return { text: '🟡 Citología cada 3 años entre 25 y 29 años, si resultado negativo.', class: 'yellow' };
    if (edad <= 65) return { text: '🟢 VPH-AR cada 5 años entre 30 y 65 años. Citología solo si VPH positivo.', class: 'green' };
    return { text: '✅ Cribado finalizado si hay 3 citologías o 2 VPH negativos en los últimos 10 años (una en los últimos 5).', class: 'green' };
  };

  const mostrarAvisoColon = () => {
    const edad = parseInt(formData.edad, 10);
    console.log('Renderizando aviso colon:', { edad });
    if (isNaN(edad)) return { text: '⚠️ Falta introducir edad.', class: '' };
    if (edad < 50) return { text: '🔴 El cribado poblacional comienza a los 50 años.', class: 'red' };
    if (edad <= 69) return { text: '🟢 Programa de cribado activo: prueba de sangre oculta en heces (TSOH) cada 2 años. Si es positiva, se realiza colonoscopia.', class: 'green' };
    return { text: '✅ Cribado finalizado si se ha completado el seguimiento hasta los 69 años.', class: 'green' };
  };

  const mostrarAvisoMama = () => {
    const sexo = formData.sexo;
    const edad = parseInt(formData.edad, 10);
    console.log('Renderizando aviso mama:', { sexo, edad });
    if (!sexo || isNaN(edad)) return { text: '⚠️ Falta introducir sexo y edad.', class: '' };
    if (sexo !== 'Mujer') return { text: 'ℹ️ Cribado de mama no aplicable.', class: 'info' };
    if (edad < 45) return { text: '🔴 El cribado poblacional comienza a los 45 años.', class: 'red' };
    if (edad <= 69) return { text: '🟢 Programa de cribado activo: mamografía cada 2 años hasta los 69 años. Se cita por correo ordinario.', class: 'green' };
    if (edad <= 74) return { text: '🟡 Cribado posible: mamografía cada 2 años hasta los 74 años (ampliación progresiva).', class: 'yellow' };
    return { text: '✅ Cribado finalizado según protocolo (>74 años).', class: 'green' };
  };

  // Filtrar recordatorios relevantes para la pestaña Anamnesis
  const recordatoriosAnamnesis = calcularRecordatorios().filter(
    (recordatorio) => recordatorio.mensaje.includes('Escalas de cronicidad')
  );

  return (
    <div className="section active">
      {/* Sección de notificaciones */}
      {recordatoriosAnamnesis.length > 0 && (
        <div className="bloque">
          <div className="section-header">🔔 Recordatorios de Seguimiento</div>
          <div className="info-box">
            {recordatoriosAnamnesis.map((recordatorio, index) => (
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

      <div className="bloque">
        <div className="section-header">📋 Anamnesis general</div>
        <div className="form-group">
          <label htmlFor="anamnesis">Describa la anamnesis del paciente</label>
          <textarea
            id="anamnesis"
            name="anamnesis"
            value={formData.anamnesis}
            onChange={handleInputChange}
          ></textarea>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">🧬 Antecedentes personales</div>
        <div className="patologias-grid">
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="dm" 
              checked={formData.dm} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Diabetes Mellitus</span>
              <span className="patologia-codigo">DM</span>
            </span>
          </label>
          
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="hta" 
              checked={formData.hta} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Hipertensión Arterial</span>
              <span className="patologia-codigo">HTA</span>
            </span>
          </label>
          
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="ecv" 
              checked={formData.ecv} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Enfermedad Cardiovascular</span>
              <span className="patologia-codigo">ECV previa</span>
            </span>
          </label>
          
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="erc" 
              checked={formData.erc} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Enfermedad Renal Crónica</span>
              <span className="patologia-codigo">ERC</span>
            </span>
          </label>
          
          {/* NUEVO - OBESIDAD AÑADIDO AQUÍ */}
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="obesidad" 
              checked={formData.obesidad} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Sobrepeso/Obesidad</span>
              <span className="patologia-codigo">IMC ≥25</span>
            </span>
          </label>
          
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="epoc" 
              checked={formData.epoc} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">EPOC</span>
              <span className="patologia-codigo">Enfermedad Pulmonar</span>
            </span>
          </label>
          
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="asma" 
              checked={formData.asma} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Asma Bronquial</span>
              <span className="patologia-codigo">ASMA</span>
            </span>
          </label>
          
          <label className="patologia-item">
            <input 
              type="checkbox" 
              name="icc" 
              checked={formData.icc} 
              onChange={handleCheckboxChange} 
            />
            <span className="patologia-text">
              <span className="patologia-nombre">Insuficiencia Cardiaca</span>
              <span className="patologia-codigo">ICC</span>
            </span>
          </label>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">🗃️ Otros antecedentes</div>
        <div className="form-group">
          <label htmlFor="otros_antecedentes">Otros antecedentes</label>
          <textarea
            id="otros_antecedentes"
            name="otros_antecedentes"
            value={formData.otros_antecedentes}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="antecedentes_familiares">Antecedentes familiares</label>
          <textarea
            id="antecedentes_familiares"
            name="antecedentes_familiares"
            value={formData.antecedentes_familiares}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="cumple_tratamiento">¿Cumple tratamiento?</label>
            <select
              id="cumple_tratamiento"
              name="cumple_tratamiento"
              value={formData.cumple_tratamiento}
              onChange={handleInputChange}
            >
              <option value="">-- Selecciona --</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="observaciones_tratamiento">Observaciones tratamiento</label>
          <textarea
            id="observaciones_tratamiento"
            name="observaciones_tratamiento"
            value={formData.observaciones_tratamiento}
            onChange={handleInputChange}
          ></textarea>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">🛡️ Programas de prevención</div>
        <div key="cervix" id="bloque_cervix" style={{ display: formData.sexo === 'Mujer' ? 'block' : 'none' }}>
          <div className="aviso-header">🧪 Cáncer de cérvix</div>
          <div className="info-box cervix" data-type="cervix">{mostrarAvisoCervix().text}</div>
        </div>
        <div key="colon" id="bloque_colon">
          <div className="aviso-header">🧪 Cáncer de colon</div>
          <div className="info-box colon" data-type="colon">{mostrarAvisoColon().text}</div>
        </div>
        <div key="mama" id="bloque_mama" style={{ display: formData.sexo === 'Mujer' ? 'block' : 'none' }}>
          <div className="aviso-header">🧪 Cáncer de mama</div>
          <div className="info-box mama" data-type="mama">{mostrarAvisoMama().text}</div>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">💉 Vacunación</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="vacunas_al_dia">¿Vacunas al día?</label>
            <select
              id="vacunas_al_dia"
              name="vacunas_al_dia"
              value={formData.vacunas_al_dia}
              onChange={handleInputChange}
            >
              <option value="">-- Selecciona --</option>
              <option value="Sí">Sí</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="observaciones_vacunas">Observaciones sobre vacunación</label>
            <textarea
              id="observaciones_vacunas"
              name="observaciones_vacunas"
              value={formData.observaciones_vacunas}
              onChange={handleInputChange}
            ></textarea>
          </div>
        </div>
        <div className="form-row vacunas-row">
          <div className="form-group vacunas-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div
              className="tooltip-container wide"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span className="tooltip-trigger">💉 Info Vacunas</span>
              {showTooltip && (
                <div
                  className="tooltip-content"
                  ref={tooltipRef}
                  onMouseEnter={handleTooltipMouseEnter}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  - <strong>Neumococo 20:</strong> A partir de 65 años o grupos de riesgo.<br />
                  - <strong>Herpes Zóster:</strong> 2 episodios previos o nacidos en 1943, 1944, 1945 o 1958, 1959, 1960.<br />
                  - <strong>Gripe y COVID estacional:</strong> Recomendadas anualmente.<br />
                  - <strong>Otras:</strong> Revisar estado vacunal (tétanos, hepatitis B, etc.).<br />
                  - <strong>Calendarios oficiales:</strong><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;- <a href="https://vacunasaep.org/sites/vacunasaep.org/files/calvacaep_2025_principal_solo_tabla_web_sistematica-finalisimo-1.pdf" target="_blank" rel="noopener noreferrer">AEP 2025 (Pediátrico)</a><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;- <a href="https://www.sanidad.gob.es/areas/promocionPrevencion/vacunaciones/calendarioVacunacion.htm" target="_blank" rel="noopener noreferrer">Ministerio de Sanidad (Adulto)</a>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="revision_vacunas"
                name="revision_vacunas"
                checked={formData.revision_vacunas || false}
                onChange={handleCheckboxChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label 
                htmlFor="revision_vacunas" 
                style={{ cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' }}
              >
                📋 Revisamos Calendario Vacunal 
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">🚬 Tabaquismo</div>
        <div className="form-group">
          <label htmlFor="fumador">¿Fumador?</label>
          <select
            id="fumador"
            name="fumador"
            value={formData.fumador}
            onChange={handleInputChange}
          >
            <option value="">-- Selecciona --</option>
            <option value="Sí">Sí</option>
            <option value="No">No</option>
            <option value="Exfumador">Exfumador</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="observaciones_fumador">Observaciones Fumador</label>
          <textarea
            id="observaciones_fumador"
            name="observaciones_fumador"
            value={formData.observaciones_fumador}
            onChange={handleInputChange}
          ></textarea>
        </div>
        {formData.fumador === 'Sí' && (
          <div className="form-row">
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="consejo_antitabaco"
                name="consejo_antitabaco"
                checked={formData.consejo_antitabaco || false}
                onChange={handleCheckboxChange}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label 
                htmlFor="consejo_antitabaco" 
                style={{ cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' }}
              >
                🚭 CONSEJO ANTITABACO DADO
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="bloque">
        <div className="section-header">🍽️ Alimentación y ejercicio</div>
        <div className="form-group">
          <label htmlFor="alimentacion">Hábitos de alimentación</label>
          <textarea
            id="alimentacion"
            name="alimentacion"
            value={formData.alimentacion}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="ejercicio_fisico">Ejercicio físico</label>
          <textarea
            id="ejercicio_fisico"
            name="ejercicio_fisico"
            value={formData.ejercicio_fisico}
            onChange={handleInputChange}
          ></textarea>
        </div>
        <div className="form-row" style={{ marginTop: '15px' }}>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="consejo_alimentacion"
              name="consejo_alimentacion"
              checked={formData.consejo_alimentacion || false}
              onChange={handleCheckboxChange}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label 
              htmlFor="consejo_alimentacion" 
              style={{ cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' }}
            >
              🥗 CONSEJO ALIMENTACIÓN SALUDABLE
            </label>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="consejo_ejercicio"
              name="consejo_ejercicio"
              checked={formData.consejo_ejercicio || false}
              onChange={handleCheckboxChange}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <label 
              htmlFor="consejo_ejercicio" 
              style={{ cursor: 'pointer', marginBottom: '0', fontWeight: '600', color: '#0077b6' }}
            >
              🏃 CONSEJO EJERCICIO FÍSICO
            </label>
          </div>
        </div>
      </div>

      <div className="bloque">
        <div className="section-header">📊 Escalas clínicas</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="escalas_fecha">Fecha del último registro</label>
            <input
              type="text"
              id="escalas_fecha"
              name="escalas_fecha"
              value={formData.escalas_fecha}
              onChange={handleInputChange}
              placeholder="DD/MM/YYYY"
              maxLength="10"
            />
            {escalasFechaError && <span className="error">{escalasFechaError}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="barthel">Barthel</label>
            <select
              id="barthel"
              name="barthel"
              value={formData.barthel}
              onChange={handleInputChange}
            >
              <option value="">--</option>
              <option value="100 - Independencia total">100 - Independencia total</option>
              <option value="61-99 - Dependencia leve">61-99 - Dependencia leve</option>
              <option value="40-60 - Dependencia moderada">40-60 - Dependencia moderada</option>
              <option value="21-39 - Dependencia severa">21-39 - Dependencia severa</option>
              <option value="0-20 - Dependencia total">0-20 - Dependencia total</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="pfeiffer">Pfeiffer</label>
            <select
              id="pfeiffer"
              name="pfeiffer"
              value={formData.pfeiffer}
              onChange={handleInputChange}
            >
              <option value="">--</option>
              <option value="0-2 errores - Normal">0-2 errores - Normal</option>
              <option value="3-4 errores - Deterioro leve">3-4 errores - Deterioro leve</option>
              <option value="5-7 errores - Deterioro moderado">5-7 errores - Deterioro moderado</option>
              <option value="8-10 errores - Deterioro grave">8-10 errores - Deterioro grave</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="necpal">NECPAL</label>
          <select
            id="necpal"
            name="necpal"
            value={formData.necpal}
            onChange={handleInputChange}
          >
            <option value="">--</option>
            <option value="NECPAL negativo">NECPAL negativo</option>
            <option value="NECPAL positivo">NECPAL positivo</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="escalas_otros">Otras escalas / observaciones</label>
          <textarea
            id="escalas_otros"
            name="escalas_otros"
            value={formData.escalas_otros}
            onChange={handleInputChange}
            placeholder="Ej: Downton, Yesavage, GDS, etc."
          ></textarea>
        </div>
      </div>
    </div>
  );
};

export default AnamnesisForm;