// ==================== MÓDULO: DATA PROCESSOR (Lógica Power Query) ====================
const DataProcessor = (function() {
    
    function normalizarFornecedor(nome) {
        if (!nome) return nome;
        const upper = nome.toUpperCase();
        if (upper.includes("TRANSMYM") || upper.includes("TRANSMYN")) return "TRANSMYM";
        if (upper.includes("AJA QUIMICA")) return "AJA QUIMICA";
        if (upper.includes("NUTRIX-SP")) return "NUTRIX-SP";
        if (upper.includes("CARVAO ARCO IRIS")) return "CARVAO ARCO IRIS";
        if (upper.includes("CHEP")) return "CHEP";
        if (upper.includes("HIKARI")) return "HIKARI";
        if (upper.includes("MONDIAL")) return "MONDIAL";
        if (upper.includes("BRITANIA")) return "BRITANIA";
        if (upper.includes("ARGET")) return "CHEP";
        if (upper.includes("SUPREMA")) return "SUPREMA";
        if (upper.includes("SOBEL")) return "SOBEL";
        if (upper.includes("PLANALTO")) return "RACOES PLANALTO";
        if (upper.includes("STELLA DORO")) return "STELLA DORO";
        if (upper.includes("QUIMICA AMPARO")) return "QUIMICA AMPARO";
        if (upper.includes("J MACEDO")) return "J MACEDO";
        if (upper.includes("BRF")) return "BRF";
        if (upper.includes("AMBEV")) return "AMBEV";
        if (upper.includes("NADIR")) return "NADIR";
        if (upper.includes("TRES CORACOES")) return "TRES CORACOES";
        return nome;
    }

    function getTurno(horaChegadaStr) {
        if (!horaChegadaStr || horaChegadaStr === "31/12/1969 21:00") return "Sem hora de chegada";
        let hora = 0;
        if (typeof horaChegadaStr === 'string') {
            const parts = horaChegadaStr.split(' ');
            if (parts.length >= 2) {
                const timeParts = parts[1].split(':');
                hora = parseInt(timeParts[0]);
            } else {
                const timeParts = horaChegadaStr.split(':');
                hora = parseInt(timeParts[0]);
            }
        }
        if (hora >= 6 && hora <= 14) return "1º Turno";
        if (hora >= 14 && hora <= 22) return "2º Turno";
        if (hora >= 22 || (hora >= 0 && hora <= 5)) return "3º Turno";
        return "Fora dos turnos definidos";
    }

    function extractDate(dateTimeStr) {
        if (!dateTimeStr || dateTimeStr === "31/12/1969 21:00") return null;
        const parts = dateTimeStr.split(' ');
        if (parts.length >= 1) {
            const dateParts = parts[0].split('/');
            if (dateParts.length === 3) {
                return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
            }
        }
        return null;
    }

    function getValorCobrado(fornecedor, veiculo) {
        const f = (fornecedor || "").toUpperCase();
        if (f === "CHEP" || f === "TRANSMYM") return 0;
        const v = (veiculo || "").toUpperCase();
        if (v === "TRUCK") return 120;
        if (v === "CARRETA") return 210;
        if (v === "TOCO" || v === "LEVE" || v === "VUC") return 50;
        return null;
    }

    function getChavePlt(fornecedor) {
        const f = (fornecedor || "").toUpperCase();
        if (f === "TRANSMYM" || f === "TRANSMYN") return "PLT QUEB.";
        if (f === "CHEP") return "PLT AZUL";
        return "PBR";
    }

    function processarDados(rows) {
        const processados = [];
        let totalCarregadoGeral = 0, totalValorGeral = 0;
        let finalizadosCount = 0, canceladosCount = 0, agendadosCount = 0;
        const estatisticasMes = {};
        const estatisticasTurno = { 
            "1º Turno": { paletes: 0, agendas: 0 },
            "2º Turno": { paletes: 0, agendas: 0 },
            "3º Turno": { paletes: 0, agendas: 0 },
            "Sem hora de chegada": { paletes: 0, agendas: 0 } 
        };

        for (let row of rows) {
            const senha = row.SENHA;
            const dataAgendaRaw = row["DATA/HORA AGENDA"];
            const dataChegadaRaw = row["DATA/HORA CHEGADA"];
            const fornecedorRaw = row.FORNECEDOR;
            const status = row.STATUS || "AGENDADO";
            const veiculoAgendado = row["VEIC. AGENDADO"];
            let programado = parseInt(row.PROGRAMADO) || 0;
            const retiradoRaw = row.RETIRADO;

            if (isNaN(programado) || programado === 0) programado = 420;

            const fornecedor = normalizarFornecedor(fornecedorRaw);
            const turno = getTurno(dataChegadaRaw);
            const dataAgenda = extractDate(dataAgendaRaw);
            const mes = dataAgenda ? dataAgenda.getMonth() + 1 : null;

            let retirado = null;
            if (retiradoRaw && retiradoRaw !== "" && !isNaN(parseInt(retiradoRaw))) {
                retirado = parseInt(retiradoRaw);
            }
            const carregado = (retirado !== null && retirado !== 0) ? retirado : programado;
            const valorCobrado = getValorCobrado(fornecedor, veiculoAgendado);
            const chavePlt = getChavePlt(fornecedor);

            if (status === "FINALIZADO") {
                finalizadosCount++;
                totalCarregadoGeral += carregado;
                if (valorCobrado) totalValorGeral += valorCobrado;

                // Estatísticas por mês
                if (mes) {
                    if (!estatisticasMes[mes]) { 
                        estatisticasMes[mes] = { qtd: 0, valor: 0, carregado: 0 }; 
                    }
                    estatisticasMes[mes].qtd++;
                    estatisticasMes[mes].carregado += carregado;
                    estatisticasMes[mes].valor += valorCobrado || 0;
                }

                // Estatísticas por turno (paletes e agendas)
                if (turno && estatisticasTurno[turno]) {
                    estatisticasTurno[turno].paletes += carregado;
                    estatisticasTurno[turno].agendas++;
                } else if (turno) {
                    estatisticasTurno[turno] = { paletes: carregado, agendas: 1 };
                }
            } else if (status === "CANCELADO") {
                canceladosCount++;
            } else if (status === "AGENDADO") {
                agendadosCount++;
            }

            processados.push({
                senha, fornecedor, status, veiculo: veiculoAgendado,
                programado, carregado, valorCobrado, chavePlt,
                dataAgenda, turno, mes
            });
        }

        return {
            registros: processados,
            estatisticas: {
                totalRegistros: rows.length,
                totalFinalizados: finalizadosCount,
                totalCancelados: canceladosCount,
                totalAgendados: agendadosCount,
                totalCarregado: totalCarregadoGeral,
                valorTotalCobrado: totalValorGeral
            },
            estatisticasMes,
            estatisticasTurno
        };
    }

    return { 
        processarDados, 
        normalizarFornecedor, 
        getTurno, 
        getValorCobrado, 
        getChavePlt, 
        extractDate 
    };
})();