// ==================== MÓDULO: SLA MANAGER (Gerenciamento de timers) ====================
const SLAManager = (function() {
    
    let timersAtivos = new Map(); // id -> interval
    let callbacks = new Map(); // id -> função de callback
    
    // Formatar tempo restante
    function formatarTempoRestante(milissegundos) {
        if (milissegundos <= 0) return 'SLA EXPIRADO!';
        
        const horas = Math.floor(milissegundos / (1000 * 60 * 60));
        const minutos = Math.floor((milissegundos % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((milissegundos % (1000 * 60)) / 1000);
        
        if (horas > 0) {
            return `${horas}h ${minutos}min ${segundos}s`;
        }
        return `${minutos}min ${segundos}s`;
    }
    
    // Calcular tempo restante com base na chegada na doca
    function calcularTempoRestante(horaChegadaDoca) {
        const chegada = new Date(horaChegadaDoca);
        const agora = new Date();
        const decorrido = agora - chegada;
        const slaMs = 3 * 60 * 60 * 1000; // 3 horas em milissegundos
        const restante = slaMs - decorrido;
        return restante;
    }
    
    // Iniciar timer para um agendamento em andamento
    function iniciarTimer(idAgendamento, horaChegadaDoca, onUpdate, onExpired) {
        pararTimer(idAgendamento);
        
        const interval = setInterval(() => {
            const restante = calcularTempoRestante(horaChegadaDoca);
            
            if (onUpdate) {
                onUpdate(idAgendamento, {
                    restanteMs: restante,
                    restanteFormatado: formatarTempoRestante(restante),
                    expirado: restante <= 0
                });
            }
            
            if (restante <= 0 && onExpired) {
                onExpired(idAgendamento);
                pararTimer(idAgendamento);
            }
        }, 1000);
        
        timersAtivos.set(idAgendamento, interval);
    }
    
    function pararTimer(idAgendamento) {
        if (timersAtivos.has(idAgendamento)) {
            clearInterval(timersAtivos.get(idAgendamento));
            timersAtivos.delete(idAgendamento);
        }
    }
    
    function pararTodosTimers() {
        timersAtivos.forEach((timer, id) => {
            clearInterval(timer);
        });
        timersAtivos.clear();
    }
    
    function temTimerAtivo(idAgendamento) {
        return timersAtivos.has(idAgendamento);
    }
    
    return {
        iniciarTimer,
        pararTimer,
        pararTodosTimers,
        formatarTempoRestante,
        calcularTempoRestante,
        temTimerAtivo
    };
})();