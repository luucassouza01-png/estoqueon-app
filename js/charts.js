// ==================== MÓDULO: CHARTS (Gráficos) ====================
const Charts = (function() {
    
    let turnoChartInstance = null;
    let mensalChartInstance = null;

    function renderTurnoChart(estatisticasTurno) {
        const canvas = document.getElementById('turnoChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (turnoChartInstance) {
            turnoChartInstance.destroy();
        }
        
        turnoChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['1º Turno', '2º Turno', '3º Turno'],
                datasets: [{
                    data: [
                        estatisticasTurno["1º Turno"] || 0,
                        estatisticasTurno["2º Turno"] || 0,
                        estatisticasTurno["3º Turno"] || 0
                    ],
                    backgroundColor: ['#1f8a70', '#e07c3c', '#9b59b6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    function renderMensalChart(labels, values) {
        const canvas = document.getElementById('mensalChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (mensalChartInstance) {
            mensalChartInstance.destroy();
        }
        
        mensalChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Paletes Carregados',
                    data: values,
                    backgroundColor: '#1f8a70',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw.toLocaleString()} paletes`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Event listener para renderizar gráficos após dashboard ser montado
    document.addEventListener('dashboardRendered', function(e) {
        const { estatisticasTurno, labelsMensais, valoresMensais } = e.detail;
        renderTurnoChart(estatisticasTurno);
        if (labelsMensais && labelsMensais.length > 0) {
            renderMensalChart(labelsMensais, valoresMensais);
        }
    });

    return {
        renderTurnoChart,
        renderMensalChart
    };
})();