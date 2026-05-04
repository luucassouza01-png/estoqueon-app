// ==================== MÓDULO: APP STATE (Gerenciamento de Estado e Persistência) ====================
const AppState = (function() {
    
    // Chaves para localStorage
    const STORAGE_KEYS = {
        SALDO: 'estoqueon_saldo',
        AGENDAMENTOS: 'estoqueon_agendamentos'
    };
    
    // Estado inicial do saldo
    let saldoPaletes = {
        PBR: 850,
        CHEP: 350,
        DESCARTAVEL: 128,
        QUEBRADO: 400,
        ultimaAtualizacao: null,
        atualizadoPor: null
    };
    
    let agendamentosAtivos = [];
    let proximoId = 1;
    
    // Função para identificar o tipo de palete baseado no fornecedor
    function getTipoPaletePorFornecedor(fornecedor) {
        var fornecedorUpper = (fornecedor || '').toUpperCase();
        
        // Palete Quebrado - TRANSMYM ou TRANSMYN
        if (fornecedorUpper.includes('TRANSMYM') || fornecedorUpper.includes('TRANSMYN')) {
            return 'QUEBRADO';
        }
        
        // Palete CHEP - ARGET LOGISTICA
        if (fornecedorUpper.includes('ARGET') || fornecedorUpper.includes('CHEP')) {
            return 'CHEP';
        }
        
        // Palete PBR - Demais fornecedores
        return 'PBR';
    }
    
    // Função para dar baixa no saldo
    function darBaixaNoSaldo(tipoPalete, quantidade, usuario) {
        console.log('=== Dando baixa no saldo ===');
        console.log('Tipo:', tipoPalete, 'Quantidade:', quantidade);
        
        var tipoOriginal = tipoPalete;
        var campoSaldo = '';
        
        if (tipoPalete === 'PBR') {
            campoSaldo = 'PBR';
        } else if (tipoPalete === 'CHEP') {
            campoSaldo = 'CHEP';
        } else if (tipoPalete === 'QUEBRADO') {
            campoSaldo = 'QUEBRADO';
        } else {
            console.error('Tipo de palete desconhecido:', tipoPalete);
            return false;
        }
        
        if (saldoPaletes[campoSaldo] >= quantidade) {
            saldoPaletes[campoSaldo] -= quantidade;
            console.log('Baixa realizada. Novo saldo de ' + tipoPalete + ':', saldoPaletes[campoSaldo]);
            return true;
        } else {
            console.error('Saldo insuficiente para ' + tipoPalete + '. Disponível:', saldoPaletes[campoSaldo], 'Necessário:', quantidade);
            return false;
        }
    }
    
    // Carregar dados salvos
    function carregarDadosSalvos() {
        const salvo = localStorage.getItem(STORAGE_KEYS.SALDO);
        if (salvo) {
            try {
                const parsed = JSON.parse(salvo);
                saldoPaletes = { ...saldoPaletes, ...parsed };
                console.log('Saldo carregado:', saldoPaletes);
            } catch(e) { console.error('Erro ao carregar saldo:', e); }
        }
        
        const agendamentosSalvos = localStorage.getItem(STORAGE_KEYS.AGENDAMENTOS);
        if (agendamentosSalvos) {
            try {
                agendamentosAtivos = JSON.parse(agendamentosSalvos);
                console.log('Agendamentos carregados:', agendamentosAtivos.length);
                
                if (agendamentosAtivos.length > 0) {
                    var maxId = 0;
                    for (var i = 0; i < agendamentosAtivos.length; i++) {
                        if (agendamentosAtivos[i].id > maxId) {
                            maxId = agendamentosAtivos[i].id;
                        }
                    }
                    proximoId = maxId + 1;
                    console.log('Proximo ID disponivel:', proximoId);
                }
            } catch(e) { console.error('Erro ao carregar agendamentos:', e); }
        }
    }
    
    // Salvar dados
    function persistirDados() {
        localStorage.setItem(STORAGE_KEYS.SALDO, JSON.stringify(saldoPaletes));
        localStorage.setItem(STORAGE_KEYS.AGENDAMENTOS, JSON.stringify(agendamentosAtivos));
        console.log('Dados persistidos. Total agendamentos:', agendamentosAtivos.length);
    }
    
    // Atualizar saldo manual
    function atualizarSaldo(novoSaldo, usuario) {
        saldoPaletes = {
            PBR: novoSaldo.PBR || 0,
            CHEP: novoSaldo.CHEP || 0,
            DESCARTAVEL: novoSaldo.DESCARTAVEL || 0,
            QUEBRADO: novoSaldo.QUEBRADO || 0,
            ultimaAtualizacao: new Date().toISOString(),
            atualizadoPor: usuario || 'Operação'
        };
        persistirDados();
        return saldoPaletes;
    }
    
    function getSaldo() {
        return saldoPaletes;
    }
    
    // Resetar sistema
    function resetarSistema() {
        agendamentosAtivos = [];
        proximoId = 1;
        saldoPaletes = {
            PBR: 850,
            CHEP: 350,
            DESCARTAVEL: 128,
            QUEBRADO: 400,
            ultimaAtualizacao: new Date().toISOString(),
            atualizadoPor: 'Sistema'
        };
        localStorage.removeItem(STORAGE_KEYS.AGENDAMENTOS);
        localStorage.setItem(STORAGE_KEYS.SALDO, JSON.stringify(saldoPaletes));
        console.log('Sistema resetado');
        return true;
    }
    
    // Importar agendamentos do CSV
    function importarAgendamentos(agendamentos) {
        var importados = 0;
        
        for (var i = 0; i < agendamentos.length; i++) {
            var ag = agendamentos[i];
            
            var existe = false;
            for (var j = 0; j < agendamentosAtivos.length; j++) {
                if (agendamentosAtivos[j].senha === ag.senha) {
                    existe = true;
                    break;
                }
            }
            
            if (!existe) {
                var tipoPalete = getTipoPaletePorFornecedor(ag.fornecedor);
                
                var novoAgendamento = {
                    id: proximoId++,
                    senha: ag.senha,
                    fornecedor: ag.fornecedor,
                    veiculo: ag.veiculo,
                    quantidade: ag.quantidade,
                    dataHoraAgendada: ag.dataHoraAgendada,
                    status: ag.status,
                    statusOriginal: ag.status,
    etapa: -1,
    etapaAtual: "🚪 Aguardando Chegada",
    historicoEtapas: [],
                    tipoPalete: tipoPalete,
                    createdAt: new Date().toISOString(),
                    historicoEventos: [{
                        status: ag.status,
                        timestamp: new Date().toISOString(),
                        observacao: 'Importado de CSV - Status: ' + ag.status + ' - Tipo Palete: ' + tipoPalete
                    }]
                };
                agendamentosAtivos.push(novoAgendamento);
                importados++;
                console.log('Agendamento importado - ID:', novoAgendamento.id, 'Senha:', ag.senha, 'Tipo Palete:', tipoPalete);
            }
        }
        
        persistirDados();
        console.log('Importados:', importados, 'agendamentos. Proximo ID:', proximoId);
        return importados;
    }
    
    function getAgendamentos() {
        return agendamentosAtivos;
    }
    
    function getAgendamentosAtivos() {
        var ativos = [];
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            if (agendamentosAtivos[i].status !== 'FINALIZADO' && agendamentosAtivos[i].status !== 'CANCELADO') {
                ativos.push(agendamentosAtivos[i]);
            }
        }
        return ativos;
    }
    
    function getAgendamentosPendentes() {
        var pendentes = [];
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            if (agendamentosAtivos[i].status === 'AGENDADO') {
                pendentes.push(agendamentosAtivos[i]);
            }
        }
        return pendentes;
    }
    
    function getAgendamentosFinalizados() {
        var finalizados = [];
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            if (agendamentosAtivos[i].status === 'FINALIZADO') {
                finalizados.push(agendamentosAtivos[i]);
            }
        }
        return finalizados;
    }
    
    function getAgendamentosCancelados() {
        var cancelados = [];
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            if (agendamentosAtivos[i].status === 'CANCELADO') {
                cancelados.push(agendamentosAtivos[i]);
            }
        }
        return cancelados;
    }
    
    // Registrar chegada na doca
    function registrarChegadaDoca(idAgendamento, numeroDoca, usuario) {
        console.log('=== registrarChegadaDoca INICIADO ===');
        console.log('ID recebido:', idAgendamento);
        
        var idNumerico = typeof idAgendamento === 'number' ? idAgendamento : parseInt(idAgendamento);
        var indiceEncontrado = -1;
        
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            if (agendamentosAtivos[i].id === idNumerico) {
                indiceEncontrado = i;
                break;
            }
        }
        
        if (indiceEncontrado === -1) {
            console.error('ERRO: Agendamento não encontrado com ID:', idNumerico);
            return null;
        }
        
        if (agendamentosAtivos[indiceEncontrado].status !== 'AGENDADO') {
            console.error('ERRO: Status inválido. Esperado AGENDADO, recebido:', agendamentosAtivos[indiceEncontrado].status);
            return null;
        }
        
        var agora = new Date();
        var horaAgendada = new Date(agendamentosAtivos[indiceEncontrado].dataHoraAgendada);
        var atrasoMinutos = Math.max(0, Math.floor((agora - horaAgendada) / (1000 * 60)));
        
        agendamentosAtivos[indiceEncontrado].status = 'EM_ANDAMENTO';
        agendamentosAtivos[indiceEncontrado].numeroDoca = numeroDoca;
        agendamentosAtivos[indiceEncontrado].horaChegadaDoca = agora.toISOString();
        agendamentosAtivos[indiceEncontrado].atrasoMinutos = atrasoMinutos;
        
        if (!agendamentosAtivos[indiceEncontrado].historicoEventos) {
            agendamentosAtivos[indiceEncontrado].historicoEventos = [];
        }
        
        agendamentosAtivos[indiceEncontrado].historicoEventos.push({
            status: 'EM_ANDAMENTO',
            timestamp: agora.toISOString(),
            observacao: 'Chegada na doca ' + numeroDoca,
            usuario: usuario
        });
        
        persistirDados();
        console.log('SUCESSO: Agendamento atualizado para EM_ANDAMENTO');
        
        return agendamentosAtivos[indiceEncontrado];
    }
    
    // Registrar conclusao COM BAIXA NO SALDO (com verificação de saldo)
function registrarConclusao(idAgendamento, usuario) {
    console.log('=== registrarConclusao chamado ===');
    console.log('ID:', idAgendamento);
    
    var idNumerico = typeof idAgendamento === 'number' ? idAgendamento : parseInt(idAgendamento);
    var indiceEncontrado = -1;
    
    for (var i = 0; i < agendamentosAtivos.length; i++) {
        if (agendamentosAtivos[i].id === idNumerico) {
            indiceEncontrado = i;
            break;
        }
    }
    
    if (indiceEncontrado === -1) {
        console.error('Agendamento não encontrado para conclusão');
        return { success: false, error: 'Agendamento não encontrado' };
    }
    
    if (agendamentosAtivos[indiceEncontrado].status !== 'EM_ANDAMENTO') {
        console.error('Status inválido para conclusão:', agendamentosAtivos[indiceEncontrado].status);
        return { success: false, error: 'Status inválido para conclusão' };
    }
    
    var agendamento = agendamentosAtivos[indiceEncontrado];
    var tipoPalete = agendamento.tipoPalete || getTipoPaletePorFornecedor(agendamento.fornecedor);
    var quantidade = agendamento.quantidade;
    
    console.log('Dados para baixa - Tipo:', tipoPalete, 'Quantidade:', quantidade, 'Fornecedor:', agendamento.fornecedor);
    
    // Verificar saldo antes de dar baixa
    var campoSaldo = '';
    if (tipoPalete === 'PBR') {
        campoSaldo = 'PBR';
    } else if (tipoPalete === 'CHEP') {
        campoSaldo = 'CHEP';
    } else if (tipoPalete === 'QUEBRADO') {
        campoSaldo = 'QUEBRADO';
    } else {
        return { success: false, error: 'Tipo de palete desconhecido: ' + tipoPalete };
    }
    
    var saldoDisponivel = saldoPaletes[campoSaldo];
    
    if (saldoDisponivel < quantidade) {
        var mensagemErro = 'Saldo insuficiente para ' + tipoPalete + '! Disponível: ' + saldoDisponivel + ' | Necessário: ' + quantidade;
        console.error(mensagemErro);
        return { success: false, error: mensagemErro, saldoAtual: saldoDisponivel, quantidadeNecessaria: quantidade, tipo: tipoPalete };
    }
    
    // Dar baixa no saldo
    saldoPaletes[campoSaldo] -= quantidade;
    console.log('Baixa realizada. Novo saldo de ' + tipoPalete + ':', saldoPaletes[campoSaldo]);
    
    var agora = new Date();
    var horaChegadaDoca = new Date(agendamento.horaChegadaDoca);
    var tempoTotalMinutos = Math.floor((agora - horaChegadaDoca) / (1000 * 60));
    var slaCumprido = tempoTotalMinutos <= 180;
    
    agendamentosAtivos[indiceEncontrado].status = 'FINALIZADO';
    agendamentosAtivos[indiceEncontrado].horaConclusao = agora.toISOString();
    agendamentosAtivos[indiceEncontrado].tempoTotalMinutos = tempoTotalMinutos;
    agendamentosAtivos[indiceEncontrado].slaCumprido = slaCumprido;
    agendamentosAtivos[indiceEncontrado].tipoPalete = tipoPalete;
    
    if (!agendamentosAtivos[indiceEncontrado].historicoEventos) {
        agendamentosAtivos[indiceEncontrado].historicoEventos = [];
    }
    
    agendamentosAtivos[indiceEncontrado].historicoEventos.push({
        status: 'FINALIZADO',
        timestamp: agora.toISOString(),
        observacao: 'Concluído em ' + tempoTotalMinutos + ' minutos. SLA ' + (slaCumprido ? 'CUMPRIDO' : 'NÃO CUMPRIDO') + '. Baixa de ' + quantidade + ' paletes ' + tipoPalete,
        usuario: usuario
    });
    
    // Atualizar a data da última atualização do saldo
    saldoPaletes.ultimaAtualizacao = agora.toISOString();
    saldoPaletes.atualizadoPor = usuario;
    
    persistirDados();
    console.log('Agendamento concluído com sucesso! Novo saldo - PBR:', saldoPaletes.PBR, 'CHEP:', saldoPaletes.CHEP, 'QUEBRADO:', saldoPaletes.QUEBRADO);
    
    return { 
        success: true, 
        agendamento: agendamentosAtivos[indiceEncontrado],
        novoSaldo: {
            PBR: saldoPaletes.PBR,
            CHEP: saldoPaletes.CHEP,
            QUEBRADO: saldoPaletes.QUEBRADO,
            DESCARTAVEL: saldoPaletes.DESCARTAVEL
        }
    };
}
    
    function cancelarAgendamento(idAgendamento, motivo, usuario) {
        var idNumerico = typeof idAgendamento === 'number' ? idAgendamento : parseInt(idAgendamento);
        var indiceEncontrado = -1;
        
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            if (agendamentosAtivos[i].id === idNumerico) {
                indiceEncontrado = i;
                break;
            }
        }
        
        if (indiceEncontrado === -1) return null;
        
        agendamentosAtivos[indiceEncontrado].status = 'CANCELADO';
        agendamentosAtivos[indiceEncontrado].motivoCancelamento = motivo;
        
        if (!agendamentosAtivos[indiceEncontrado].historicoEventos) {
            agendamentosAtivos[indiceEncontrado].historicoEventos = [];
        }
        
        agendamentosAtivos[indiceEncontrado].historicoEventos.push({
            status: 'CANCELADO',
            timestamp: new Date().toISOString(),
            observacao: 'Cancelado: ' + motivo,
            usuario: usuario
        });
        
        persistirDados();
        return agendamentosAtivos[indiceEncontrado];
    }
    
    // Exportar dados
    function exportarDadosCSV() {
        if (agendamentosAtivos.length === 0) return null;
        
        var headers = ['ID', 'Senha', 'Fornecedor', 'Data/Hora Agendada', 'Veículo', 'Quantidade', 'Status', 'Tipo Palete', 'Nº Doca', 'Chegada Doca', 'Conclusão', 'Tempo (min)', 'SLA Cumprido'];
        var rows = [];
        
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            var a = agendamentosAtivos[i];
            rows.push([
                a.id,
                a.senha || '-',
                a.fornecedor,
                a.dataHoraAgendada,
                a.veiculo,
                a.quantidade,
                a.status,
                a.tipoPalete || getTipoPaletePorFornecedor(a.fornecedor),
                a.numeroDoca || '-',
                a.horaChegadaDoca ? new Date(a.horaChegadaDoca).toLocaleString() : '-',
                a.horaConclusao ? new Date(a.horaConclusao).toLocaleString() : '-',
                a.tempoTotalMinutos || '-',
                a.slaCumprido ? 'Sim' : (a.slaCumprido === false ? 'Não' : '-')
            ]);
        }
        
        var csvContent = headers.join(';') + '\n';
        for (var j = 0; j < rows.length; j++) {
            csvContent += rows[j].join(';') + '\n';
        }
        return csvContent;
    }
    
    // Função para debug
    function listarAgendamentos() {
        console.log('=== LISTA DE AGENDAMENTOS ===');
        for (var i = 0; i < agendamentosAtivos.length; i++) {
            console.log('ID:', agendamentosAtivos[i].id, '| Senha:', agendamentosAtivos[i].senha, '| Status:', agendamentosAtivos[i].status, '| Tipo:', agendamentosAtivos[i].tipoPalete);
        }
        return agendamentosAtivos;
    }
    
    // Inicializar
    carregarDadosSalvos();
    
    return {
        atualizarSaldo: atualizarSaldo,
        getSaldo: getSaldo,
        resetarSistema: resetarSistema,
        importarAgendamentos: importarAgendamentos,
        getAgendamentos: getAgendamentos,
        getAgendamentosAtivos: getAgendamentosAtivos,
        getAgendamentosPendentes: getAgendamentosPendentes,
        getAgendamentosFinalizados: getAgendamentosFinalizados,
        getAgendamentosCancelados: getAgendamentosCancelados,
        registrarChegadaDoca: registrarChegadaDoca,
        registrarConclusao: registrarConclusao,
        cancelarAgendamento: cancelarAgendamento,
        exportarDadosCSV: exportarDadosCSV,
        persistirDados: persistirDados,
        listarAgendamentos: listarAgendamentos,
        getTipoPaletePorFornecedor: getTipoPaletePorFornecedor
    };
})();