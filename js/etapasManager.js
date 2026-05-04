// ==================== ETAPAS DO PROCESSO (SIMPLIFICADO) ====================
const EtapasManager = (function() {

    const ETAPAS_LISTA = [
        { id: 0, nome: '📋 Documentação na ADM', cor: '#6c8d9b' },
        { id: 1, nome: '🚛 Chegada na Doca', cor: '#d97706' },
        { id: 2, nome: '⏱️ Fim do Carregamento', cor: '#2c5f8a' },
        { id: 3, nome: '✅ Finalizado', cor: '#10b981' }
    ];

    function avancarEtapa(agendamento, usuario) {
        if (!agendamento) return { success: false, error: 'Agendamento inválido' };
        
        var etapaAtual = agendamento.etapa !== undefined ? agendamento.etapa : -1;
        var proximaEtapa = etapaAtual + 1;
        
        if (proximaEtapa >= ETAPAS_LISTA.length) {
            return { success: false, error: 'Processo já finalizado' };
        }
        
        var etapaInfo = ETAPAS_LISTA[proximaEtapa];
        var timestamp = new Date().toISOString();
        
        agendamento.etapa = proximaEtapa;
        agendamento.etapaAtual = etapaInfo.nome;
        
        if (!agendamento.historicoEtapas) {
            agendamento.historicoEtapas = [];
        }
        
        agendamento.historicoEtapas.push({
            etapa: proximaEtapa,
            nome: etapaInfo.nome,
            timestamp: timestamp,
            usuario: usuario
        });
        
        // Se chegou na doca, inicia SLA
        if (proximaEtapa === 1 && !agendamento.horaChegadaDoca) {
            agendamento.horaChegadaDoca = timestamp;
            agendamento.status = 'EM_ANDAMENTO';
        }
        
        // Se finalizou, conclui o processo
        if (proximaEtapa === 3) {
            agendamento.status = 'FINALIZADO';
            agendamento.horaConclusao = timestamp;
            if (agendamento.horaChegadaDoca) {
                var inicio = new Date(agendamento.horaChegadaDoca);
                var fim = new Date(timestamp);
                var tempoMin = Math.floor((fim - inicio) / 60000);
                agendamento.tempoTotalMinutos = tempoMin;
                agendamento.slaCumprido = tempoMin <= 180;
            }
        }
        
        return { success: true, etapa: etapaInfo, agendamento: agendamento };
    }

    function voltarEtapa(agendamento, usuario) {
        if (!agendamento) return { success: false, error: 'Agendamento inválido' };
        
        var etapaAtual = agendamento.etapa !== undefined ? agendamento.etapa : 0;
        var etapaAnterior = etapaAtual - 1;
        
        if (etapaAnterior < 0) {
            return { success: false, error: 'Já está na primeira etapa' };
        }
        
        var etapaInfo = ETAPAS_LISTA[etapaAnterior];
        
        agendamento.etapa = etapaAnterior;
        agendamento.etapaAtual = etapaInfo.nome;
        
        agendamento.historicoEtapas.push({
            etapa: etapaAnterior,
            nome: etapaInfo.nome,
            timestamp: new Date().toISOString(),
            usuario: usuario,
            observacao: 'Retorno de etapa'
        });
        
        // Se voltou da doca, ajustar status
        if (etapaAnterior < 1) {
            agendamento.status = 'AGENDADO';
            agendamento.horaChegadaDoca = null;
        }
        
        return { success: true, etapa: etapaInfo, agendamento: agendamento };
    }

    function getProgresso(etapaAtual) {
        if (etapaAtual === undefined || etapaAtual < 0) return 0;
        return Math.round(((etapaAtual + 1) / ETAPAS_LISTA.length) * 100);
    }

    function getEtapaAtualNome(etapaAtual) {
        if (etapaAtual === undefined || etapaAtual < 0) return 'Aguardando';
        return ETAPAS_LISTA[etapaAtual] ? ETAPAS_LISTA[etapaAtual].nome : 'Desconhecido';
    }

    function renderizarTimeline(etapaAtual) {
        if (etapaAtual === undefined) etapaAtual = -1;
        var html = '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0;">';
        for (var i = 0; i < ETAPAS_LISTA.length; i++) {
            var etapa = ETAPAS_LISTA[i];
            var isConcluida = i <= etapaAtual;
            var isAtual = i === etapaAtual;
            var background = isConcluida ? etapa.cor : '#e2e8f0';
            var textColor = isConcluida ? 'white' : '#6c8d9b';
            var border = isAtual ? '2px solid #1e3a5f' : 'none';
            html += '<div style="flex: 1; text-align: center; background: ' + background + '; color: ' + textColor + '; padding: 8px 2px; border-radius: 8px; font-size: 0.7rem; font-weight: ' + (isConcluida ? '600' : '400') + '; border: ' + border + '">' + etapa.nome + '</div>';
        }
        html += '</div>';
        var progresso = getProgresso(etapaAtual);
        html += '<div style="background: #e2e8f0; border-radius: 20px; height: 6px; margin: 8px 0; overflow: hidden;"><div style="width: ' + progresso + '%; background: #10b981; height: 100%; border-radius: 20px;"></div></div>';
        html += '<div style="text-align: right; font-size: 0.65rem; color: #6c8d9b;">Progresso: ' + progresso + '% - Etapa atual: ' + getEtapaAtualNome(etapaAtual) + '</div>';
        return html;
    }

    return {
        ETAPAS_LISTA: ETAPAS_LISTA,
        avancarEtapa: avancarEtapa,
        voltarEtapa: voltarEtapa,
        getProgresso: getProgresso,
        getEtapaAtualNome: getEtapaAtualNome,
        renderizarTimeline: renderizarTimeline
    };
})();
