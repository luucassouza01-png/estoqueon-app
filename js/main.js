function renderizarMonitorSLACompleto() {
    var container = document.getElementById('dynamicContent');
    if (!container) return;
    
    var todosAgendamentos = AppState.getAgendamentos();
    var emAndamento = [];
    var agendados = [];
    var hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    console.log('=== Monitor SLA ===');
    console.log('Total agendamentos:', todosAgendamentos.length);
    
    for (var i = 0; i < todosAgendamentos.length; i++) {
        var ag = todosAgendamentos[i];
        var dataAgenda = new Date(ag.dataHoraAgendada);
        dataAgenda.setHours(0, 0, 0, 0);
        
        console.log('Agendamento:', ag.senha, 'Data:', dataAgenda, 'Hoje:', hoje, 'Status:', ag.status);
        
        if (dataAgenda.getTime() === hoje.getTime()) {
            if (ag.status === 'EM_ANDAMENTO') {
                emAndamento.push(ag);
                if (ag.horaChegadaDoca && !timersAtivos[ag.id]) {
                    iniciarTimer(ag.id, ag.horaChegadaDoca);
                }
            }
            else if (ag.status === 'AGENDADO') {
                agendados.push(ag);
            }
        }
    }
    
    agendados.sort(function(a, b) {
        return new Date(a.dataHoraAgendada) - new Date(b.dataHoraAgendada);
    });
    
    var html = '<div class="card">' +
        '<div class="card-title">Monitor de SLA - 3 horas</div>' +
        '<div class="stats-row">' +
        '<div class="stat-mini" style="background:#fff3cd;"><div class="stat-mini-value" style="color:#d97706;">' + emAndamento.length + '</div><div>Em Andamento</div><div style="font-size:0.7rem;">na doca hoje</div></div>' +
        '<div class="stat-mini" style="background:#e8f4f5;"><div class="stat-mini-value" style="color:#2c5f8a;">' + agendados.length + '</div><div>Agendados</div><div style="font-size:0.7rem;">para hoje</div></div>' +
        '</div>';
    
    if (emAndamento.length > 0) {
        html += '<h3 style="margin: 24px 0 16px 0; color:#d97706; font-size:1rem; border-left:4px solid #d97706; padding-left:12px;"> EM ANDAMENTO - NA DOCA</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px;">';
        
        for (var e = 0; e < emAndamento.length; e++) {
            var a = emAndamento[e];
            var chegadaDoca = new Date(a.horaChegadaDoca);
            var agora = new Date();
            var tempoDecorrido = Math.floor((agora - chegadaDoca) / 60000);
            var slaTotal = 180;
            var tempoRestante = Math.max(0, slaTotal - tempoDecorrido);
            var expirado = tempoRestante <= 0;
            var tempoDecorridoText = (tempoDecorrido >= 60) ? Math.floor(tempoDecorrido / 60) + 'h ' + (tempoDecorrido % 60) + 'min' : tempoDecorrido + 'min';
            var tempoRestanteText = (tempoRestante >= 60) ? Math.floor(tempoRestante / 60) + 'h ' + (tempoRestante % 60) + 'min' : tempoRestante + 'min';
            var percProgresso = Math.min(100, Math.floor((tempoDecorrido / slaTotal) * 100));
            
            var etapaAtual = (a.etapa !== undefined && a.etapa >= 0) ? a.etapa : 1;
            
            html += '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                '<span style="font-weight: 700; font-size: 1rem;">Senha: ' + (a.senha || '-') + '</span>' +
                '<span class="badge" style="background:#2c5f8a; color:white;">Doca ' + a.numeroDoca + '</span>' +
                '</div>' +
                '<div style="margin-bottom: 6px;"><strong>' + a.fornecedor + '</strong></div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 6px;">Veículo: ' + a.veiculo + ' | ' + a.quantidade.toLocaleString() + ' paletes</div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 12px;">Chegada: ' + chegadaDoca.toLocaleTimeString() + '</div>' +
                '<div style="margin-top: 12px;">' + EtapasManager.renderizarTimeline(etapaAtual) + '</div>' +
                '<div style="background: #f0f2f5; border-radius: 12px; height: 8px; margin-bottom: 12px;">' +
                '<div style="background: ' + (expirado ? '#dc2626' : '#d97706') + '; width: ' + percProgresso + '%; height: 8px; border-radius: 12px;"></div>' +
                '</div>' +
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<div><span style="font-size:0.7rem; color:#6c8d9b;">Tempo em doca:</span><br><span style="font-weight: 700;">' + tempoDecorridoText + '</span></div>' +
                '<div style="text-align:center;"><span style="font-size:0.7rem; color:#6c8d9b;">Restante SLA:</span><br><span style="font-weight: 700; ' + (expirado ? 'color:#dc2626' : 'color:#2c5f8a') + '">' + (expirado ? 'EXPIRADO!' : tempoRestanteText) + '</span></div>' +
                '<button class="upload-btn" onclick="window.concluirAgendamento(' + a.id + ')" style="padding:6px 14px; background:#2c5f8a;">Concluir</button>' +
                '</div>';
            
            if (a.status !== 'FINALIZADO') {
                html += '<div style="display: flex; gap: 8px; margin-top: 12px;">';
                if (etapaAtual < 3) {
                    html += '<button class="upload-btn" onclick="window.avancarEtapa(' + a.id + ')" style="background:#10b981; padding:6px 12px; font-size:0.7rem;">✓ Avançar Etapa</button>';
                }
                if (etapaAtual > 0) {
                    html += '<button class="upload-btn" onclick="window.voltarEtapa(' + a.id + ')" style="background:#6c8d9b; padding:6px 12px; font-size:0.7rem;">↺ Voltar Etapa</button>';
                }
                html += '</div>';
            }
            
            html += '</div>';
        }
        html += '</div>';
    }
    
    if (agendados.length > 0) {
        html += '<h3 style="margin: 24px 0 16px 0; color:#2c5f8a; font-size:1rem; border-left:4px solid #2c5f8a; padding-left:12px;"> AGENDADOS - AGUARDANDO INÍCIO</h3>';
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px;">';
        
        for (var a2 = 0; a2 < agendados.length; a2++) {
            var a = agendados[a2];
            var horario = new Date(a.dataHoraAgendada);
            var agora = new Date();
            var atrasado = horario < agora;
            
            html += '<div style="background: white; border-radius: 16px; padding: 16px; border: 1px solid #eef2f8;">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">' +
                '<span style="font-weight: 700; font-size: 1rem;">Senha: ' + (a.senha || '-') + '</span>' +
                (atrasado ? '<span class="badge" style="background:#dc2626; color:white;">Atrasado</span>' : '<span class="badge" style="background:#2c5f8a; color:white;">Agendado</span>') +
                '</div>' +
                '<div style="margin-bottom: 6px;"><strong>' + a.fornecedor + '</strong></div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 6px;">Veículo: ' + a.veiculo + ' | ' + a.quantidade.toLocaleString() + ' paletes</div>' +
                '<div style="font-size:0.8rem; color:#6c8d9b; margin-bottom: 12px;">Agendado: ' + horario.toLocaleString() + (atrasado ? ' <span style="color:#dc2626;">(ATRASADO)</span>' : '') + '</div>' +
                '<div style="margin-top: 12px;">' + EtapasManager.renderizarTimeline(-1) + '</div>' +
                '</div>';
        }
        html += '</div>';
    }
    
    if (emAndamento.length === 0 && agendados.length === 0) {
        html += '<p style="text-align:center; padding:60px; color:#6c8d9b;">Nenhum agendamento para hoje</p>';
    }
    html += '</div>';
    
    container.innerHTML = html;
}
