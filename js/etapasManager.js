// ==================== ETAPAS DO PROCESSO ====================
const EtapasManager = (function() {

    const ETAPAS_LISTA = [
        { id: 0, nome: '🚪 Chegada na Portaria', cor: '#6c8d9b' },
        { id: 1, nome: '📋 Documentação na ADM', cor: '#6c8d9b' },
        { id: 2, nome: '🚛 Chegada na Doca', cor: '#d97706' },
        { id: 3, nome: '🔄 Carregamento', cor: '#d97706' },
        { id: 4, nome: '⏱️ Fim do Carregamento', cor: '#2c5f8a' },
        { id: 5, nome: '💰 Pagamento', cor: '#2c5f8a' },
        { id: 6, nome: '📄 Nota Fiscal', cor: '#2c5f8a' },
        { id: 7, nome: '✅ Finalizado', cor: '#10b981' }
    ];

    function avancarEtapa(agendamento, usuario) {
        var etapaAtual = agendamento.etapa || -1;
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
        
        if (proximaEtapa === 2) {
            agendamento.horaChegadaDoca = timestamp;
            agendamento.status = 'EM_ANDAMENTO';
        }
        
        if (proximaEtapa === 7) {
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
        var etapaAtual = agendamento.etapa || 0;
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
        
        if (etapaAnterior < 2 && agendamento.status === 'EM_ANDAMENTO') {
            agendamento.status = 'AGENDADO';
            agendamento.horaChegadaDoca = null;
        }
        
        return { success: true, etapa: etapaInfo, agendamento: agendamento };
    }

    function getProgresso(etapaAtual) {
        if (etapaAtual === undefined || etapaAtual < 0) return 0;
        return Math.round(((etapaAtual + 1) / ETAPAS_LISTA.length) * 100);
    }

    function renderizarTimeline(etapaAtual) {
        if (etapaAtual === undefined) etapaAtual = -1;
        var html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 16px 0;">';
        for (var i = 0; i < ETAPAS_LISTA.length; i++) {
            var etapa = ETAPAS_LISTA[i];
            var isConcluida = i <= etapaAtual;
            var background = isConcluida ? etapa.cor : '#e2e8f0';
            var textColor = isConcluida ? 'white' : '#6c8d9b';
            html += '<div style="flex: 1; min-width: 80px; text-align: center; background: ' + background + '; color: ' + textColor + '; padding: 6px 2px; border-radius: 10px; font-size: 0.65rem; font-weight: ' + (isConcluida ? '600' : '400') + '">' + etapa.nome + '</div>';
        }
        html += '</div>';
        var progresso = getProgresso(etapaAtual);
        html += '<div style="background: #e2e8f0; border-radius: 20px; height: 6px; margin: 12px 0; overflow: hidden;"><div style="width: ' + progresso + '%; background: #10b981; height: 100%; border-radius: 20px;"></div></div>';
        html += '<div style="text-align: right; font-size: 0.65rem; color: #6c8d9b;">Progresso: ' + progresso + '%</div>';
        return html;
    }

    return {
        ETAPAS_LISTA: ETAPAS_LISTA,
        avancarEtapa: avancarEtapa,
        voltarEtapa: voltarEtapa,
        getProgresso: getProgresso,
        renderizarTimeline: renderizarTimeline
    };
})();
