// ==================== MÓDULO: RENDERERS ====================
const Renderers = (function() {
    
    function getMesNome(mes) {
        const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return meses[mes - 1] || mes;
    }

    function getSaldoDisponivel(saldoBase) {
        return (saldoBase.PBR || 0) + (saldoBase.CHEP || 0) + (saldoBase.DESCARTAVEL || 0);
    }

    function calcularMediaMensal(estatisticasMes) {
        const meses = Object.keys(estatisticasMes);
        if (meses.length === 0) return 0;
        let total = 0;
        for (let mes in estatisticasMes) {
            total += estatisticasMes[mes].carregado;
        }
        return Math.round(total / meses.length);
    }

    function calcularMediaAgendasMensal(estatisticasMes) {
        const meses = Object.keys(estatisticasMes);
        if (meses.length === 0) return 0;
        let total = 0;
        for (let mes in estatisticasMes) {
            total += estatisticasMes[mes].qtd || 0;
        }
        return Math.round(total / meses.length);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('pt-BR').format(value);
    }

    function renderizarDashboard(containerId, registros, estatisticas, estatisticasMes, estatisticasTurno, saldoBase) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const totalDisponivel = getSaldoDisponivel(saldoBase);
        const mediaMensalPaletes = calcularMediaMensal(estatisticasMes);
        const mediaMensalAgendas = calcularMediaAgendasMensal(estatisticasMes);
        
        // Calcular tendências (comparação último mês com anterior)
        const mesesOrdenados = Object.keys(estatisticasMes).sort((a, b) => a - b);
        const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1];
        const penultimoMes = mesesOrdenados[mesesOrdenados.length - 2];
        
        let tendenciaPaletes = '';
        let tendenciaAgendas = '';
        
        if (ultimoMes && penultimoMes) {
            const variacaoPaletes = ((estatisticasMes[ultimoMes].carregado - estatisticasMes[penultimoMes].carregado) / estatisticasMes[penultimoMes].carregado) * 100;
            const variacaoAgendas = ((estatisticasMes[ultimoMes].qtd - estatisticasMes[penultimoMes].qtd) / estatisticasMes[penultimoMes].qtd) * 100;
            tendenciaPaletes = `<span class="kpi-trend-${variacaoPaletes >= 0 ? 'up' : 'down'}">${variacaoPaletes >= 0 ? '↑' : '↓'} ${Math.abs(variacaoPaletes).toFixed(1)}%</span>`;
            tendenciaAgendas = `<span class="kpi-trend-${variacaoAgendas >= 0 ? 'up' : 'down'}">${variacaoAgendas >= 0 ? '↑' : '↓'} ${Math.abs(variacaoAgendas).toFixed(1)}%</span>`;
        }

        // Ranking fornecedores
        const fornecedorMap = new Map();
        if (registros.length) {
            registros.forEach(r => {
                if (r.status === "FINALIZADO" && r.carregado > 0) {
                    const current = fornecedorMap.get(r.fornecedor) || { agendas: 0, qtd: 0, valor: 0 };
                    current.agendas++;
                    current.qtd += r.carregado;
                    current.valor += r.valorCobrado || 0;
                    fornecedorMap.set(r.fornecedor, current);
                }
            });
        }
        const ranking = Array.from(fornecedorMap.entries())
            .map(([nome, data]) => ({ nome, ...data }))
            .sort((a, b) => b.qtd - a.qtd)
            .slice(0, 6);

        // Dados para gráficos
        const labelsMensais = mesesOrdenados.map(m => getMesNome(parseInt(m)));
        const valoresMensaisPaletes = mesesOrdenados.map(m => estatisticasMes[m].carregado);
        const valoresMensaisAgendas = mesesOrdenados.map(m => estatisticasMes[m].qtd || 0);
        const agendamentosPendentes = registros.filter(r => r.status === "AGENDADO").slice(0, 10);
        
        // Dados para gráfico de turno (paletes e agendas)
        const turnos = ["1º Turno", "2º Turno", "3º Turno"];
        const paletesPorTurno = turnos.map(t => estatisticasTurno[t]?.paletes || 0);
        const agendasPorTurno = turnos.map(t => estatisticasTurno[t]?.agendas || 0);

        const html = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-title"><i class="fas fa-boxes"></i> SALDO DISPONÍVEL</div>
                    <div class="kpi-value">${formatNumber(totalDisponivel)}</div>
                    <div class="kpi-sub">PBR + CHEP + Descartáveis</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title"><i class="fas fa-chart-line"></i> MÉDIA MENSAL PALETES</div>
                    <div class="kpi-value">${formatNumber(mediaMensalPaletes)}</div>
                    <div class="kpi-sub">paletes/mês ${tendenciaPaletes}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title"><i class="fas fa-calendar-week"></i> MÉDIA MENSAL AGENDAS</div>
                    <div class="kpi-value">${formatNumber(mediaMensalAgendas)}</div>
                    <div class="kpi-sub">agendas/mês ${tendenciaAgendas}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title"><i class="fas fa-dollar-sign"></i> VALOR TOTAL</div>
                    <div class="kpi-value">${formatCurrency(estatisticas.valorTotalCobrado)}</div>
                    <div class="kpi-sub">cobrado (PBR)</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title"><i class="fas fa-calendar"></i> AGENDAMENTOS PENDENTES</div>
                    <div class="kpi-value">${estatisticas.totalAgendados}</div>
                    <div class="kpi-sub">aguardando coleta</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-title"><i class="fas fa-tasks"></i> TOTAL FINALIZADOS</div>
                    <div class="kpi-value">${estatisticas.totalFinalizados}</div>
                    <div class="kpi-sub">coletas realizadas</div>
                </div>
            </div>
            
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-title"><i class="fas fa-chart-pie"></i> Saldo de Paletes - CD910</div>
                    <div class="saldo-item">
                        <span class="saldo-tipo"><i class="fas fa-pallet"></i> PBR</span>
                        <span class="saldo-valor saldo-pbr">${formatNumber(saldoBase.PBR)}</span>
                    </div>
                    <div class="saldo-item">
                        <span class="saldo-tipo"><i class="fas fa-pallet"></i> CHEP (PLT AZUL)</span>
                        <span class="saldo-valor saldo-chep">${formatNumber(saldoBase.CHEP)}</span>
                    </div>
                    <div class="saldo-item">
                        <span class="saldo-tipo"><i class="fas fa-pallet"></i> DESCARTÁVEL</span>
                        <span class="saldo-valor saldo-desc">${formatNumber(saldoBase.DESCARTAVEL)}</span>
                    </div>
                    <div class="saldo-item">
                        <span class="saldo-tipo"><i class="fas fa-pallet"></i> QUEBRADO</span>
                        <span class="saldo-valor saldo-queb">${formatNumber(saldoBase.QUEBRADO)}</span>
                    </div>
                    <div style="margin-top:16px; padding-top:12px; border-top:2px solid #eef2f8;">
                        <strong>✅ Total Disponível para Coleta:</strong> 
                        <span style="font-size:1.5rem; font-weight:800; color:#2c5f8a;">${formatNumber(totalDisponivel)}</span>
                    </div>
                </div>
                <div class="card">
                    <div class="card-title"><i class="fas fa-trophy"></i> Ranking Fornecedores</div>
                    ${ranking.length > 0 ? `
                    <div style="overflow-x:auto;">
                        <table style="width:100%">
                            <thead>
                                <tr>
                                    <th>FORNECEDOR</th><th>AGENDAS</th><th>PALETES</th><th>VALOR</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ranking.map(r => `
                                    <tr>
                                        <td><strong>${r.nome}</strong></td>
                                        <td>${r.agendas}${' '}</td>
                                        <td>${formatNumber(r.qtd)}${' '}</td>
                                        <td>${formatCurrency(r.valor)}${' '}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ` : '<p style="text-align:center; padding:20px;">Carregue a base de agendamentos</p>'}
                </div>
            </div>
            
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-title"><i class="fas fa-chart-bar"></i> Movimentação por Turno</div>
                    <div class="stats-row">
                        ${turnos.map((turno, idx) => `
                            <div class="stat-mini">
                                <div class="stat-mini-value">${formatNumber(paletesPorTurno[idx])}</div>
                                <div>${turno} (paletes)</div>
                                <div style="font-size:0.7rem; color:#6b8b9c; margin-top:4px;">
                                    ${agendasPorTurno[idx]} agendas
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <canvas id="turnoChart" style="max-height: 200px; margin-top: 16px;"></canvas>
                </div>
                <div class="card">
                    <div class="card-title"><i class="fas fa-chart-line"></i> Evolução Mensal</div>
                    ${labelsMensais.length > 0 ? `
                        <canvas id="mensalChart" style="max-height: 200px;"></canvas>
                        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 12px;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div style="width: 12px; height: 12px; background: #2c5f8a; border-radius: 2px;"></div>
                                <span style="font-size:0.7rem;">Paletes</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <div style="width: 12px; height: 12px; background: #d97706; border-radius: 2px;"></div>
                                <span style="font-size:0.7rem;">Agendas</span>
                            </div>
                        </div>
                    ` : '<p style="text-align:center; padding:30px;">Carregue a base de agendamentos</p>'}
                </div>
            </div>
            
            <div class="card">
                <div class="card-title"><i class="fas fa-list-ul"></i> Agendamentos Pendentes</div>
                ${agendamentosPendentes.length > 0 ? `
                <div style="overflow-x:auto;">
                    <table style="width:100%">
                        <thead>
                            <tr>
                                <th>SENHA</th><th>FORNECEDOR</th><th>VEÍCULO</th>
                                <th>PROGRAMADO</th><th>STATUS</th><th>TIPO PLT</th><th>VALOR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${agendamentosPendentes.map(r => `
                                <tr>
                                    <td>${r.senha || '-'}${' '}</td>
                                    <td>${r.fornecedor}${' '}</td>
                                    <td>${r.veiculo || '-'}${' '}</td>
                                    <td>${formatNumber(r.programado)}${' '}</td>
                                    <td><span class="badge badge-warning">${r.status}</span>${' '}</td>
                                    <td>${r.chavePlt}${' '}</td>
                                    <td>${formatCurrency(r.valorCobrado || 0)}${' '}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<p style="text-align:center; padding:20px;">Nenhum agendamento pendente</p>'}
            </div>
        `;
        
        container.innerHTML = html;
        
        // Disparar evento para renderizar gráficos com dados completos
        const event = new CustomEvent('dashboardRendered', {
            detail: { 
                estatisticasTurno, 
                labelsMensais, 
                valoresMensaisPaletes,
                valoresMensaisAgendas,
                paletesPorTurno,
                agendasPorTurno,
                turnos
            }
        });
        document.dispatchEvent(event);
    }

    function renderizarAgendamentos(containerId, registros) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        function formatNumber(value) {
            return new Intl.NumberFormat('pt-BR').format(value);
        }
        
        function formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }
        
        const html = `
            <div class="card">
                <div class="card-title"><i class="fas fa-calendar"></i> Todos os Agendamentos</div>
                <div style="overflow-x:auto;">
                    <table style="width:100%">
                        <thead>
                            <tr>
                                <th>SENHA</th><th>FORNECEDOR</th><th>VEÍCULO</th>
                                <th>PROGRAMADO</th><th>CARREGADO</th><th>STATUS</th>
                                <th>TIPO PLT</th><th>TURNO</th><th>VALOR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${registros.map(r => `
                                <tr>
                                    <td>${r.senha || '-'}${' '}</td>
                                    <td>${r.fornecedor}${' '}</td>
                                    <td>${r.veiculo || '-'}${' '}</td>
                                    <td>${formatNumber(r.programado)}${' '}</td>
                                    <td>${formatNumber(r.carregado)}${' '}</td>
                                    <td><span class="badge ${r.status === 'FINALIZADO' ? 'badge-success' : (r.status === 'CANCELADO' ? 'badge-danger' : 'badge-warning')}">${r.status}</span>${' '}</td>
                                    <td>${r.chavePlt}${' '}</td>
                                    <td>${r.turno}${' '}</td>
                                    <td>${formatCurrency(r.valorCobrado || 0)}${' '}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    function renderizarEstoque(containerId, saldoBase) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const totalDisponivel = getSaldoDisponivel(saldoBase);
        
        function formatNumber(value) {
            return new Intl.NumberFormat('pt-BR').format(value);
        }
        
        const html = `
            <div class="card">
                <div class="card-title"><i class="fas fa-boxes"></i> Saldo de Paletes - CD910 (Base Oficial)</div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> PBR</span>
                    <span class="saldo-valor saldo-pbr">${formatNumber(saldoBase.PBR)}</span>
                </div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> CHEP (PLT AZUL)</span>
                    <span class="saldo-valor saldo-chep">${formatNumber(saldoBase.CHEP)}</span>
                </div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> DESCARTÁVEL</span>
                    <span class="saldo-valor saldo-desc">${formatNumber(saldoBase.DESCARTAVEL)}</span>
                </div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> QUEBRADO</span>
                    <span class="saldo-valor saldo-queb">${formatNumber(saldoBase.QUEBRADO)}</span>
                </div>
                <div style="margin-top:20px; padding:16px; background:#eef2f8; border-radius:20px;">
                    <strong>📦 SALDO DISPONÍVEL PARA COLETA:</strong><br>
                    <span style="font-size:2rem; font-weight:800; color:#2c5f8a;">${formatNumber(totalDisponivel)}</span><br>
                    <small>PBR + CHEP + Descartáveis</small>
                </div>
                <div class="file-status" style="margin-top:16px;">
                    <i class="fas fa-info-circle"></i> Base carregada: SALDO_PALETE.csv
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    function renderizarFornecedores(containerId, registros) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        function formatNumber(value) {
            return new Intl.NumberFormat('pt-BR').format(value);
        }
        
        function formatCurrency(value) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        }
        
        const fornecedoresMap = new Map();
        registros.forEach(r => {
            const current = fornecedoresMap.get(r.fornecedor) || { count: 0, carregado: 0, valor: 0 };
            current.count++;
            current.carregado += r.carregado;
            current.valor += r.valorCobrado || 0;
            fornecedoresMap.set(r.fornecedor, current);
        });
        
        const fornecedores = Array.from(fornecedoresMap.entries())
            .map(([nome, data]) => ({ nome, ...data }))
            .sort((a, b) => b.carregado - a.carregado);
        
        const html = `
            <div class="card">
                <div class="card-title"><i class="fas fa-handshake"></i> Fornecedores - Análise Completa</div>
                <div style="overflow-x:auto;">
                    <table style="width:100%">
                        <thead>
                            <tr>
                                <th>FORNECEDOR</th><th>REGISTROS</th>
                                <th>PALETES CARREGADOS</th><th>VALOR COBRADO</th><th>TIPO PRINCIPAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fornecedores.map(f => {
                                const tipo = registros.find(r => r.fornecedor === f.nome)?.chavePlt || "PBR";
                                return `
                                    <tr>
                                        <td><strong>${f.nome}</strong>${' '}</td>
                                        <td>${f.count}${' '}</td>
                                        <td>${formatNumber(f.carregado)}${' '}</td>
                                        <td>${formatCurrency(f.valor)}${' '}</td>
                                        <td>${tipo}${' '}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }

    return { 
        renderizarDashboard, 
        renderizarAgendamentos, 
        renderizarEstoque, 
        renderizarFornecedores,
        getSaldoDisponivel 
    };

    // ==================== NOVAS TELAS PARA SLA E SALDO ====================

function renderizarMonitorSLA(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const agendamentosEmAndamento = AppState.getAgendamentosAtivos().filter(a => a.status === 'EM_ANDAMENTO');
    const agendamentosAgendados = AppState.getAgendamentosAtivos().filter(a => a.status === 'AGENDADO');
    
    let html = `
        <div class="card">
            <div class="card-title"><i class="fas fa-clock"></i> Monitor de SLA - 3 horas</div>
            <div style="margin-bottom: 20px;">
                <div class="stats-row">
                    <div class="stat-mini"><div class="stat-mini-value">${agendamentosEmAndamento.length}</div><div>Em Andamento</div></div>
                    <div class="stat-mini"><div class="stat-mini-value">${agendamentosAgendados.length}</div><div>Agendados</div></div>
                </div>
            </div>
    `;
    
    if (agendamentosEmAndamento.length === 0 && agendamentosAgendados.length === 0) {
        html += '<p style="text-align:center; padding:40px;">Nenhum agendamento ativo no momento</p>';
    } else {
        // Agendamentos em andamento (prioridade)
        if (agendamentosEmAndamento.length > 0) {
            html += `<h3 style="margin: 20px 0 10px; color:#d97706;">🟡 Em Andamento</h3>`;
            html += `<div style="overflow-x:auto;"><table style="width:100%"><thead><tr>
                <th>Fornecedor</th><th>Veículo</th><th>Doca</th><th>Chegada</th><th>Tempo Restante</th><th>Ações</th>
            </tr></thead><tbody>`;
            
            agendamentosEmAndamento.forEach(a => {
                const restante = SLAManager.calcularTempoRestante(a.horaChegadaDoca);
                const restanteFormatado = SLAManager.formatarTempoRestante(restante);
                const expirado = restante <= 0;
                const horaChegada = new Date(a.horaChegadaDoca).toLocaleTimeString();
                
                html += `<tr style="${expirado ? 'background:#fee2e2;' : ''}">
                    <td><strong>${a.fornecedor}</strong></td>
                    <td>${a.veiculo}</td>
                    <td><span class="badge" style="background:#2c5f8a;color:white;">Doca ${a.numeroDoca}</span></td>
                    <td>${horaChegada}</td>
                    <td><span class="sla-timer" data-id="${a.id}" style="font-weight:bold; ${expirado ? 'color:#dc2626;' : 'color:#2c5f8a;'}">${restanteFormatado}</span></td>
                    <td><button class="upload-btn" onclick="window.concluirAgendamento(${a.id})" style="padding:4px 12px; font-size:0.7rem;"><i class="fas fa-check"></i> Concluir</button></td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        }
        
        // Agendamentos aguardando
        if (agendamentosAgendados.length > 0) {
            html += `<h3 style="margin: 20px 0 10px; color:#2c5f8a;">📋 Aguardando Chegada</h3>`;
            html += `<div style="overflow-x:auto;"><table style="width:100%"><thead><tr>
                <th>Fornecedor</th><th>Veículo</th><th>Quantidade</th><th>Horário</th><th>Ações</th>
            </tr></thead><tbody>`;
            
            agendamentosAgendados.forEach(a => {
                const horario = new Date(a.dataHoraAgendada).toLocaleTimeString();
                html += `<tr>
                    <td><strong>${a.fornecedor}</strong></td>
                    <td>${a.veiculo}</td>
                    <td>${a.quantidade.toLocaleString()}</td>
                    <td>${horario}</td>
                    <td>
                        <button class="upload-btn" onclick="window.abrirModalDoca(${a.id})" style="padding:4px 12px; font-size:0.7rem; background:#d97706;">
                            <i class="fas fa-door-open"></i> Registrar Doca
                        </button>
                    </td>
                </tr>`;
            });
            html += `</tbody></table></div>`;
        }
    }
    
    html += `</div>`;
    
    // Modal para registrar doca
    html += `
    <div id="modalDoca" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
        <div style="background:white; border-radius:20px; padding:24px; width:400px; max-width:90%;">
            <h3 style="margin-bottom:16px;">Registrar Chegada na Doca</h3>
            <input type="hidden" id="modalAgendamentoId">
            <div style="margin-bottom:16px;">
                <label style="display:block; margin-bottom:8px;">Número da Doca:</label>
                <input type="number" id="modalNumeroDoca" class="upload-btn" style="width:100%; background:#f0f2f5; color:#333;" placeholder="Ex: 15">
            </div>
            <div style="display:flex; gap:12px; justify-content:flex-end;">
                <button class="upload-btn" onclick="window.fecharModalDoca()" style="background:#6c8d9b;">Cancelar</button>
                <button class="upload-btn" onclick="window.confirmarRegistroDoca()" style="background:#2c5f8a;">Confirmar</button>
            </div>
        </div>
    </div>
    `;
    
    container.innerHTML = html;
    
    // Iniciar timers para os itens em andamento
    agendamentosEmAndamento.forEach(a => {
        const timerElement = document.querySelector(`.sla-timer[data-id="${a.id}"]`);
        if (timerElement && !SLAManager.temTimerAtivo(a.id)) {
            SLAManager.iniciarTimer(a.id, a.horaChegadaDoca, 
                (id, data) => {
                    const el = document.querySelector(`.sla-timer[data-id="${id}"]`);
                    if (el) {
                        el.textContent = data.restanteFormatado;
                        if (data.expirado) {
                            el.style.color = '#dc2626';
                            el.style.fontWeight = 'bold';
                        }
                    }
                },
                (id) => {
                    showToast(`⚠️ SLA EXPIRADO! Agendamento ${id} ultrapassou 3 horas!`, true);
                    renderizarMonitorSLA(containerId);
                }
            );
        }
    });
}

function renderizarSaldoPaletes(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const saldo = AppState.getSaldo();
    
    const html = `
        <div class="card">
            <div class="card-title"><i class="fas fa-edit"></i> Saldo de Paletes - Atualização em Tempo Real</div>
            <div style="margin-bottom:20px;">
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> PBR</span>
                    <input type="number" id="saldoPBR" value="${saldo.PBR}" class="upload-btn" style="width:120px; background:#f0f2f5; color:#333; text-align:center;">
                </div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> CHEP (PLT AZUL)</span>
                    <input type="number" id="saldoCHEP" value="${saldo.CHEP}" class="upload-btn" style="width:120px; background:#f0f2f5; color:#333; text-align:center;">
                </div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> DESCARTÁVEL</span>
                    <input type="number" id="saldoDESC" value="${saldo.DESCARTAVEL}" class="upload-btn" style="width:120px; background:#f0f2f5; color:#333; text-align:center;">
                </div>
                <div class="saldo-item">
                    <span class="saldo-tipo"><i class="fas fa-pallet"></i> QUEBRADO</span>
                    <input type="number" id="saldoQUEB" value="${saldo.QUEBRADO}" class="upload-btn" style="width:120px; background:#f0f2f5; color:#333; text-align:center;">
                </div>
            </div>
            <div style="display:flex; gap:12px; justify-content:flex-end;">
                <button class="upload-btn" id="salvarSaldoBtn"><i class="fas fa-save"></i> Salvar Alterações</button>
            </div>
            <div class="file-status" style="margin-top:16px;">
                <i class="fas fa-info-circle"></i> Última atualização: ${saldo.ultimaAtualizacao ? new Date(saldo.ultimaAtualizacao).toLocaleString() : 'Nunca'} por ${saldo.atualizadoPor || '-'}
            </div>
        </div>
        
        <div class="card">
            <div class="card-title"><i class="fas fa-plus-circle"></i> Novo Agendamento</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <input type="text" id="novoFornecedor" placeholder="Fornecedor" class="upload-btn" style="background:#f0f2f5; color:#333;">
                <input type="text" id="novoVeiculo" placeholder="Veículo (TOCO/TRUCK/CARRETA)" class="upload-btn" style="background:#f0f2f5; color:#333;">
                <input type="number" id="novaQuantidade" placeholder="Quantidade" class="upload-btn" style="background:#f0f2f5; color:#333;">
                <input type="datetime-local" id="novaDataHora" class="upload-btn" style="background:#f0f2f5; color:#333;">
            </div>
            <div style="margin-top:16px; display:flex; gap:12px; justify-content:flex-end;">
                <button class="upload-btn" id="criarAgendamentoBtn"><i class="fas fa-calendar-plus"></i> Criar Agendamento</button>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('salvarSaldoBtn')?.addEventListener('click', () => {
        const novoSaldo = {
            PBR: parseInt(document.getElementById('saldoPBR').value) || 0,
            CHEP: parseInt(document.getElementById('saldoCHEP').value) || 0,
            DESCARTAVEL: parseInt(document.getElementById('saldoDESC').value) || 0,
            QUEBRADO: parseInt(document.getElementById('saldoQUEB').value) || 0
        };
        AppState.atualizarSaldo(novoSaldo, localStorage.getItem('estoqueon_usuario') || 'Operação');
        showToast('Saldo atualizado com sucesso!');
        renderizarSaldoPaletes(containerId);
    });
    
    document.getElementById('criarAgendamentoBtn')?.addEventListener('click', () => {
        const fornecedor = document.getElementById('novoFornecedor').value;
        const veiculo = document.getElementById('novoVeiculo').value;
        const quantidade = parseInt(document.getElementById('novaQuantidade').value);
        const dataHora = document.getElementById('novaDataHora').value;
        
        if (!fornecedor || !veiculo || !quantidade || !dataHora) {
            showToast('Preencha todos os campos!', true);
            return;
        }
        
        AppState.adicionarAgendamento({
            fornecedor,
            veiculo,
            quantidade,
            dataHoraAgendada: new Date(dataHora).toISOString()
        });
        
        showToast(`Agendamento criado para ${fornecedor}`);
        document.getElementById('novoFornecedor').value = '';
        document.getElementById('novoVeiculo').value = '';
        document.getElementById('novaQuantidade').value = '';
        document.getElementById('novaDataHora').value = '';
        renderizarSaldoPaletes(containerId);
    });
}

function renderizarHistorico(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const agendamentos = AppState.getAgendamentos();
    const finalizados = agendamentos.filter(a => a.status === 'FINALIZADO');
    const slaCumpridos = finalizados.filter(a => a.slaCumprido === true).length;
    const percSla = finalizados.length > 0 ? (slaCumpridos / finalizados.length * 100).toFixed(1) : 0;
    
    let html = `
        <div class="card">
            <div class="card-title"><i class="fas fa-chart-line"></i> Indicadores de Performance</div>
            <div class="stats-row">
                <div class="stat-mini"><div class="stat-mini-value">${finalizados.length}</div><div>Total Finalizados</div></div>
                <div class="stat-mini"><div class="stat-mini-value">${slaCumpridos}</div><div>SLA Cumprido (3h)</div></div>
                <div class="stat-mini"><div class="stat-mini-value">${percSla}%</div><div>Taxa de Conformidade</div></div>
            </div>
        </div>
        <div class="card">
            <div class="card-title"><i class="fas fa-history"></i> Histórico de Operações</div>
            <div style="overflow-x:auto;">
                <table style="width:100%">
                    <thead><tr><th>Data</th><th>Fornecedor</th><th>Quantidade</th><th>Status</th><th>Doca</th><th>Tempo Total</th><th>SLA</th></tr></thead>
                    <tbody>
                        ${agendamentos.slice().reverse().map(a => `
                            <tr>
                                <td>${new Date(a.createdAt).toLocaleDateString()} ${new Date(a.createdAt).toLocaleTimeString()}</td>
                                <td><strong>${a.fornecedor}</strong></td>
                                <td>${a.quantidade.toLocaleString()}</td>
                                <td><span class="badge ${a.status === 'FINALIZADO' ? 'badge-success' : (a.status === 'EM_ANDAMENTO' ? 'badge-warning' : 'badge-danger')}">${a.status}</span></td>
                                <td>${a.numeroDoca || '-'}</td>
                                <td>${a.tempoTotalMinutos ? `${a.tempoTotalMinutos} min` : '-'}</td>
                                <td>${a.slaCumprido === true ? '✅ Sim' : (a.slaCumprido === false ? '❌ Não' : '-')}</td>
                            </tr>
                        `).join('')}
                        ${agendamentos.length === 0 ? '<tr><td colspan="7" style="text-align:center;">Nenhum registro</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

// Funções globais para o modal
window.abrirModalDoca = function(id) {
    const modal = document.getElementById('modalDoca');
    const inputId = document.getElementById('modalAgendamentoId');
    if (modal && inputId) {
        inputId.value = id;
        modal.style.display = 'flex';
    }
};

window.fecharModalDoca = function() {
    const modal = document.getElementById('modalDoca');
    if (modal) modal.style.display = 'none';
};

window.confirmarRegistroDoca = function() {
    const id = document.getElementById('modalAgendamentoId')?.value;
    const numeroDoca = document.getElementById('modalNumeroDoca')?.value;
    
    if (!id || !numeroDoca) {
        showToast('Informe o número da doca!', true);
        return;
    }
    
    AppState.registrarChegadaDoca(parseInt(id), parseInt(numeroDoca), localStorage.getItem('estoqueon_usuario') || 'Operação');
    showToast(`Chegada na doca ${numeroDoca} registrada! SLA de 3 horas iniciado.`);
    window.fecharModalDoca();
    
    // Recarregar tela atual
    const activeMenu = document.querySelector('.nav-item.active')?.getAttribute('data-menu');
    if (activeMenu === 'monitor') {
        renderizarMonitorSLA('dynamicContent');
    }
};

window.concluirAgendamento = function(id) {
    if (confirm('Confirmar conclusão deste agendamento?')) {
        AppState.registrarConclusao(id, localStorage.getItem('estoqueon_usuario') || 'Operação');
        showToast('Agendamento concluído com sucesso!');
        renderizarMonitorSLA('dynamicContent');
    }
};
})();